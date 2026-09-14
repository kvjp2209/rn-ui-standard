#!/usr/bin/env node
/**
 * Checks all four import-order rules: tier order, blank lines between tiers,
 * pyramid inside each block, pyramid inside multi-line braces.
 * Usage: node check-import-order.mjs [--config tiers.json] <file|dir>...
 *
 * Kiểm đủ bốn luật thứ tự import: thứ tự tầng, dòng trống giữa tầng,
 * kim tự tháp trong khối, kim tự tháp trong ngoặc import nhiều dòng.
 * Cách dùng: node check-import-order.mjs [--config tiers.json] <file|thư mục>...
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const DEFAULT_CONFIG = {
  tier1: ['react', 'react-native', '@components/Kit'],
  shared: [
    '@app',
    '@assets',
    '@components',
    '@constants',
    '@hooks',
    '@libs',
    '@locale',
    '@modules',
    '@navigation',
    '@theme',
    '@utils',
    '@src',
  ],
  local: ['@src/screens'],
  api: ['@api'],
  stores: ['@stores'],
};

const TIER = { CORE: 1, THIRD: 2, SHARED: 3, API: 4, STORES: 5, LOCAL: 6 };
const TIER_LABEL = {
  1: 'tầng 1 (react/react-native/Kit)',
  2: 'tầng 2 (thư viện ngoài)',
  3: 'tầng 3 (module chung)',
  4: 'khối @api',
  5: 'khối @stores',
  6: 'tầng 4 (nội bộ module)',
};

const END_RE = /(from\s+['"][^'"]+['"]|^\s*import\s+['"][^'"]+['"])\s*;?\s*$/;

const matches = (path, alias) => path === alias || path.startsWith(`${alias}/`);
const matchesAny = (path, aliases) => aliases.some(a => matches(path, a));
const stripComment = line => line.replace(/\s*\/\/.*$/, '');

const tierOf = (path, config) => {
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

const checkFile = (source, config) => {
  const { lines, imports } = parseImports(source);
  const violations = [];
  const report = (line, rule, message) => violations.push({ line, rule, message });

  imports.forEach(imp => {
    imp.tier = tierOf(imp.path, config);
  });

  const reactIndex = imports.findIndex(imp => imp.path === 'react');
  if (reactIndex > 0) {
    report(imports[reactIndex].start, 3, "`react` phải là import đầu tiên");
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

const collectFiles = target => {
  const stat = statSync(target);
  if (stat.isFile()) return ['.ts', '.tsx'].includes(extname(target)) ? [target] : [];
  return readdirSync(target)
    .filter(name => name !== 'node_modules' && !name.startsWith('.'))
    .flatMap(name => collectFiles(join(target, name)));
};

const main = () => {
  const args = process.argv.slice(2);
  let config = DEFAULT_CONFIG;
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1) {
    config = { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(args[configIndex + 1], 'utf8')) };
    args.splice(configIndex, 2);
  }
  const targets = args.length ? args : ['src'];
  const files = targets.flatMap(collectFiles);

  let total = 0;
  let dirty = 0;
  files.forEach(file => {
    const violations = checkFile(readFileSync(file, 'utf8'), config);
    if (!violations.length) return;
    dirty++;
    total += violations.length;
    violations.forEach(v => {
      console.log(`${relative(process.cwd(), file)}:${v.line}  [luật ${v.rule}] ${v.message}`);
    });
  });

  console.log(`\n${total} vi phạm ở ${dirty}/${files.length} file.`);
  process.exit(total ? 1 : 0);
};

main();
