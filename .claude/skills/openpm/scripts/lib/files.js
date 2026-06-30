const fs = require('fs');
const path = require('path');

// 解析 Markdown 文件：分离 frontmatter 和 body
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)?$/);
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
        if (typeof item === 'string') lines.push(`  - "${item}"`);
        else lines.push(`  - ${item}`);
      }
    } else if (typeof v === 'string') {
      lines.push(`${k}: "${v}"`);
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
}

// 列出目录中所有文件
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
}

// 读取目录中所有文件的 frontmatter
function readAll(dir) {
  return listFiles(dir).map(f => {
    const { frontmatter } = parseMarkdown(f);
    return frontmatter;
  });
}

module.exports = { parseMarkdown, parseYaml, serializeYaml, writeMarkdown, listFiles, readAll };
