/**
 * Pure logic behind check-import-order.mjs: preset loading, config resolution,
 * import parsing and the four import-order rules. Kept apart from the CLI so it
 * can be tested without spawning a process.
 *
 * Phần logic thuần của check-import-order.mjs: nạp preset, chọn cấu hình, đọc
 * khối import và bốn luật thứ tự import. Tách khỏi CLI để test được mà không
 * cần chạy tiến trình.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

export const DEFAULT_PRESET = 'rn-cli';
export const OVERLAY_PATH = 'docs/ui-standard/project.md';

const TIER = { CORE: 1, THIRD: 2, SHARED: 3, API: 4, STORES: 5, LOCAL: 6 };
export const TIER_LABEL = {
  1: 'tầng 1 (react/react-native/Kit)',
  2: 'tầng 2 (thư viện ngoài)',
  3: 'tầng 3 (module chung)',
  4: 'khối @api',
  5: 'khối @stores',
  6: 'tầng 4 (nội bộ module)',
};

const END_RE = /(from\s+['"][^'"]+['"]|^\s*import\s+['"][^'"]+['"])\s*;?\s*$/;
const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const PRESET_LINE_RE = /^preset:\s*([\w-]+)\s*$/m;

const matches = (path, alias) => path === alias || path.startsWith(`${alias}/`);
const matchesAny = (path, aliases) => aliases.some(a => matches(path, a));
const stripComment = line => line.replace(/\s*\/\/.*$/, '');

/**
 * Loads presets/<name>.json from the plugin root.
 *
 * Nạp presets/<name>.json ở gốc plugin.
 */
export const loadPreset = name => {
  const url = new URL(`../../../presets/${name}.json`, import.meta.url);
  if (!existsSync(url)) {
    throw new Error(`[rn-ui-standard] preset không tồn tại: ${name} (có: rn-cli, expo-router)`);
  }
  return JSON.parse(readFileSync(url, 'utf8'));
};

/**
 * Reads `preset:` from the overlay front matter under cwd; null when the
 * overlay or the key is missing.
 *
 * Đọc `preset:` trong front matter của overlay dưới cwd; trả null khi không có
 * overlay hoặc không có khoá.
 */
export const readOverlayPreset = cwd => {
  const overlay = join(cwd, OVERLAY_PATH);
  if (!existsSync(overlay)) return null;

  const frontMatter = readFileSync(overlay, 'utf8').match(FRONT_MATTER_RE);
  const preset = frontMatter?.[1].match(PRESET_LINE_RE);
  return preset ? preset[1] : null;
};

/**
 * Picks the tiers: --config (merged key by key) > --preset > overlay front
 * matter > rn-cli. Returns the remaining args as targets (default: src).
 *
 * Chọn tầng: --config (ghi đè từng khoá) > --preset > front matter overlay >
 * rn-cli. Phần args còn lại là đích kiểm (mặc định: src).
 */
export const resolveConfig = (argv, cwd = process.cwd()) => {
  const args = [...argv];
  const take = flag => {
    const index = args.indexOf(flag);
    if (index === -1) return null;
    const [, value] = args.splice(index, 2);
    return value;
  };

  const configPath = take('--config');
  const presetFlag = take('--preset');
  const presetName = presetFlag ?? readOverlayPreset(cwd) ?? DEFAULT_PRESET;
  const tiers = loadPreset(presetName).importTiers;
  const config = configPath
    ? { ...tiers, ...JSON.parse(readFileSync(configPath, 'utf8')) }
    : tiers;

  return { config, presetName, targets: args.length ? args : ['src'] };
};

export const tierOf = (path, config) => {
  if (matchesAny(path, config.tier1)) return TIER.CORE;
  if (path.startsWith('.') || matchesAny(path, config.local)) return TIER.LOCAL;
  if (matchesAny(path, config.api)) return TIER.API;
  if (matchesAny(path, config.stores)) return TIER.STORES;
  if (matchesAny(path, config.shared)) return TIER.SHARED;
  return TIER.THIRD;
};

/**
 * Reads the leading import region; stops at the first non-import statement.
 *
 * Đọc vùng import đầu file; dừng ở câu lệnh đầu tiên không phải import.
 */
const parseImports = source => {
  const lines = source.split('\n');
  const imports = [];
  let inBlockComment = false;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      i++;
      continue;
    }
    if (trimmed === '' || trimmed.startsWith('//')) {
      i++;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      i++;
      continue;
    }
    if (!/^import[\s{'"*]/.test(trimmed)) break;

    let j = i;
    while (j < lines.length && !END_RE.test(stripComment(lines[j]))) j++;
    if (j >= lines.length) break;

    const lastLine = stripComment(lines[j]).replace(/\s+$/, '');
    const path = lastLine.match(/['"]([^'"]+)['"]\s*;?$/)[1];
    const specifiers =
      j > i && /\{\s*$/.test(stripComment(lines[i]))
        ? lines
            .slice(i + 1, j)
            .map(l => stripComment(l).trim().replace(/,$/, ''))
            .filter(Boolean)
            .map((name, k) => ({ name, line: i + 2 + k }))
        : [];

    imports.push({
      path,
      start: i + 1,
      end: j + 1,
      lastLength: lastLine.length,
      specifiers,
    });
    i = j + 1;
  }

  return { lines, imports };
};

const blankLinesBetween = (lines, prev, cur) =>
  lines.slice(prev.end, cur.start - 1).filter(l => l.trim() === '').length;

export const checkFile = (source, config) => {
  const { lines, imports } = parseImports(source);
  const violations = [];
  const report = (line, rule, message) => violations.push({ line, rule, message });

  imports.forEach(imp => {
    imp.tier = tierOf(imp.path, config);
  });

  const reactIndex = imports.findIndex(imp => imp.path === 'react');
  if (reactIndex > 0) {
    report(imports[reactIndex].start, 3, '`react` phải là import đầu tiên');
  }

  for (let k = 1; k < imports.length; k++) {
    const prev = imports[k - 1];
    const cur = imports[k];
    const blanks = blankLinesBetween(lines, prev, cur);
    const sameBlock = prev.tier === cur.tier;

    if (cur.tier < prev.tier) {
      report(
        cur.start,
        1,
        `'${cur.path}' (${TIER_LABEL[cur.tier]}) đứng sau '${prev.path}' (${TIER_LABEL[prev.tier]})`,
      );
    }
    if (sameBlock && blanks !== 0) {
      report(cur.start, 2, `dòng trống bên trong ${TIER_LABEL[cur.tier]}`);
    }
    if (!sameBlock && blanks !== 1) {
      report(cur.start, 2, `cần đúng 1 dòng trống trước '${cur.path}', đang có ${blanks}`);
    }
    if (
      sameBlock &&
      prev.path !== 'react' &&
      cur.path !== 'react' &&
      cur.lastLength < prev.lastLength
    ) {
      report(
        cur.start,
        3,
        `'${cur.path}' (dòng cuối ${cur.lastLength}) phải đứng trước '${prev.path}' (${prev.lastLength})`,
      );
    }
  }

  imports.forEach(imp => {
    for (let k = 1; k < imp.specifiers.length; k++) {
      const prev = imp.specifiers[k - 1];
      const cur = imp.specifiers[k];
      if (cur.name.length < prev.name.length) {
        report(cur.line, 4, `'${cur.name}' phải đứng trước '${prev.name}' trong ngoặc`);
      }
    }
  });

  return violations.sort((a, b) => a.line - b.line);
};

export const collectFiles = target => {
  const stat = statSync(target);
  if (stat.isFile()) return ['.ts', '.tsx'].includes(extname(target)) ? [target] : [];
  return readdirSync(target)
    .filter(name => name !== 'node_modules' && !name.startsWith('.'))
    .flatMap(name => collectFiles(join(target, name)));
};
