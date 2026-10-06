/**
 * Logic behind check-import-order.mjs, without CLI concerns: preset loading,
 * config resolution, import parsing and the four import-order rules. Kept apart
 * from the CLI so it can be tested without spawning a process.
 *
 * Phần logic của check-import-order.mjs, không lo phần CLI: nạp preset, chọn
 * cấu hình, đọc khối import và bốn luật thứ tự import. Tách khỏi CLI để test
 * được mà không cần chạy tiến trình.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

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
const PRESETS_DIR = new URL('../../../presets/', import.meta.url);
const PRESET_EXT = '.json';
const PRESET_NAME_RE = /^[\w-]+$/;
const BOM_RE = /^\uFEFF/;
const FRONT_MATTER_FENCE = '---';
const OVERLAY_PRESET_KEY_RE = /^preset[ \t]*:/;
const OVERLAY_PRESET_RE = /^preset[ \t]*:[ \t]*(['"]?)([\w-]+)\1[ \t]*(?:#.*)?$/;

const matches = (path, alias) => path === alias || path.startsWith(`${alias}/`);
const matchesAny = (path, aliases) => aliases.some(a => matches(path, a));
const stripComment = line => line.replace(/\s*\/\/.*$/, '');
const isFence = line => line.trimEnd() === FRONT_MATTER_FENCE;

/**
 * Lists the presets shipped in presets/ (file names without .json), sorted.
 *
 * Liệt kê các preset có sẵn trong presets/ (tên file bỏ .json), đã sắp xếp.
 */
const listPresets = () =>
  readdirSync(PRESETS_DIR)
    .filter(file => file.endsWith(PRESET_EXT))
    .map(file => file.slice(0, -PRESET_EXT.length))
    .sort();

/**
 * Loads presets/<name>.json from the plugin root. Throws when the name is not
 * a shipped preset (which also keeps names like ../package out of the path) or
 * when the file has no importTiers.
 *
 * Nạp presets/<name>.json ở gốc plugin. Ném lỗi khi tên không phải preset có
 * sẵn (nhờ đó tên kiểu ../package không lọt vào đường dẫn) hoặc file thiếu
 * importTiers.
 */
export const loadPreset = name => {
  const available = listPresets();
  if (!PRESET_NAME_RE.test(name) || !available.includes(name)) {
    throw new Error(
      `[rn-ui-standard] preset không tồn tại: ${name} (có: ${available.join(', ')})`,
    );
  }

  const preset = JSON.parse(readFileSync(new URL(`${name}${PRESET_EXT}`, PRESETS_DIR), 'utf8'));
  if (!preset?.importTiers) {
    throw new Error(`[rn-ui-standard] preset ${name} thiếu khoá importTiers`);
  }
  return preset;
};

/**
 * Reads `preset:` from the overlay front matter under cwd. Returns null when
 * there is no overlay, no front matter (a block between two `---` lines at the
 * top of the file) or no `preset:` key; throws when the `preset:` line cannot
 * be read. Accepts quotes, a trailing `# comment`, spaces before the colon,
 * trailing spaces after a `---` line, a UTF-8 BOM and CRLF.
 *
 * Đọc `preset:` trong front matter của overlay dưới cwd. Trả null khi không có
 * overlay, không có front matter (khối nằm giữa hai dòng `---` ở đầu file)
 * hoặc không có khoá `preset:`; ném lỗi khi dòng `preset:` không đọc được.
 * Chấp nhận nháy, chú thích `# …` cuối dòng, dấu cách trước dấu hai chấm, dấu
 * cách thừa sau dòng `---`, BOM UTF-8 và CRLF.
 */
export const readOverlayPreset = cwd => {
  const overlay = join(cwd, OVERLAY_PATH);
  if (!existsSync(overlay)) return null;

  const [opening, ...rest] = readFileSync(overlay, 'utf8').replace(BOM_RE, '').split(/\r?\n/);
  if (!isFence(opening)) return null;

  const closing = rest.findIndex(isFence);
  if (closing === -1) return null;

  const line = rest.slice(0, closing).find(l => OVERLAY_PRESET_KEY_RE.test(l));
  if (line === undefined) return null;

  const match = line.match(OVERLAY_PRESET_RE);
  if (!match) {
    throw new Error(`[rn-ui-standard] không đọc được \`preset\` trong ${OVERLAY_PATH}: ${line}`);
  }
  return match[2];
};

/**
 * Picks the tiers: --config (merged key by key, path relative to cwd) >
 * --preset > overlay front matter > rn-cli. Accepts `--flag value` and
 * `--flag=value`; throws on a missing value or an unknown option. Returns the
 * remaining args as targets (default: src).
 *
 * Chọn tầng: --config (ghi đè từng khoá, đường dẫn tính từ cwd) > --preset >
 * front matter overlay > rn-cli. Nhận `--cờ giá_trị` và `--cờ=giá_trị`; ném lỗi
 * khi thiếu giá trị hoặc gặp tuỳ chọn lạ. Phần args còn lại là đích kiểm (mặc
 * định: src).
 */
export const resolveConfig = (argv, cwd = process.cwd()) => {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { preset: { type: 'string' }, config: { type: 'string' } },
    allowPositionals: true,
    strict: true,
  });

  const overlayPreset = values.preset === undefined ? readOverlayPreset(cwd) : null;
  const presetName = values.preset ?? overlayPreset ?? DEFAULT_PRESET;

  let tiers;
  try {
    tiers = loadPreset(presetName).importTiers;
  } catch (error) {
    if (overlayPreset === null) throw error;
    throw new Error(`${error.message} (đọc từ ${OVERLAY_PATH})`);
  }

  const config =
    values.config === undefined
      ? tiers
      : { ...tiers, ...JSON.parse(readFileSync(resolve(cwd, values.config), 'utf8')) };

  return { config, presetName, targets: positionals.length ? positionals : ['src'] };
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
