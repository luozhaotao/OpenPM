const fs = require('fs');
const path = require('path');

// 进程级内存缓存，TTL 5 秒，上限 100 条目
const _cache = new Map();
const CACHE_TTL = 5000;
const CACHE_MAX = 100;

function _evictOldest() {
  let oldestKey = null;
  let oldestTime = Infinity;
  for (const [k, v] of _cache) {
    if (v.time < oldestTime) { oldestTime = v.time; oldestKey = k; }
  }
  if (oldestKey) _cache.delete(oldestKey);
}

// 解析 Markdown 文件：分离 frontmatter 和 body
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)?$/);
  if (!match) throw new Error(`Invalid frontmatter in ${filePath}`);
  const frontmatter = parseYaml(match[1]);
  const body = (match[2] || '').trim();
  return { frontmatter, body, _raw: content };
}

// 简易 YAML 解析器（只支持标量、数组、字符串）
function parseYaml(yaml) {
  const result = {};
  const lines = yaml.split('\n');
  let key = null;
  for (const line of lines) {
    if (/^\s*-\s/.test(line)) {
      // 数组项
      const val = line.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '');
      if (key && Array.isArray(result[key])) {
        result[key].push(val);
      }
    } else if (/^[\w_]+:/.test(line)) {
      const colonIdx = line.indexOf(':');
      key = line.substring(0, colonIdx).trim();
      let val = line.substring(colonIdx + 1).trim();
      if (val === '') {
        result[key] = [];
      } else {
        // 去掉引号
        val = val.replace(/^["']|["']$/g, '');
        // 尝试转数字/布尔
        if (val === 'true') result[key] = true;
        else if (val === 'false') result[key] = false;
        else if (/^-?\d+(\.\d+)?$/.test(val)) result[key] = Number(val);
        else result[key] = val;
      }
    }
  }
  return result;
}

// 序列化 frontmatter 回 YAML
function serializeYaml(obj) {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const item of v) {
        if (typeof item === 'string') lines.push(`  - "${item.replace(/"/g, '\\"')}"`);
        else lines.push(`  - ${item}`);
      }
    } else if (typeof v === 'string') {
      lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  return lines.join('\n');
}

// 写入 Markdown 文件
function writeMarkdown(filePath, frontmatter, body) {
  const yaml = serializeYaml(frontmatter);
  const content = `---\n${yaml}\n---\n\n${body || ''}`.trimEnd() + '\n';
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  _cache.delete(dir);  // 写入后自动失效该目录缓存
}

// 列出目录中所有文件
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
}

// 读取目录中所有文件的 frontmatter（带内存缓存）
function readAll(dir) {
  const now = Date.now();
  const entry = _cache.get(dir);
  if (entry && (now - entry.time) < CACHE_TTL) return entry.data;
  const data = listFiles(dir).map(f => {
    const { frontmatter } = parseMarkdown(f);
    return frontmatter;
  });
  if (_cache.size >= CACHE_MAX) _evictOldest();
  _cache.set(dir, { data, time: now });
  return data;
}

// 清除指定目录的缓存，返回是否确实清除了条目
function invalidateCache(dir) {
  return _cache.delete(dir);
}

module.exports = { parseMarkdown, parseYaml, serializeYaml, writeMarkdown, listFiles, readAll, invalidateCache };
