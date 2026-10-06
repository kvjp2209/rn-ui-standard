#!/usr/bin/env node
/**
 * Checks all four import-order rules: tier order, blank lines between tiers,
 * pyramid inside each block, pyramid inside multi-line braces.
 * Usage: check-import-order.mjs [--preset rn-cli|expo-router] [--config tiers.json] [<file|dir>...]
 * `--preset=<name>` and `--config=<file>` work too; without targets it checks `src`.
 * Without --preset, reads `preset:` from docs/ui-standard/project.md in cwd; default rn-cli.
 * Exit code: 0 clean, 1 violations found, 2 usage error (message only) or internal error (with stack).
 *
 * Kiểm đủ bốn luật thứ tự import: thứ tự tầng, dòng trống giữa tầng,
 * kim tự tháp trong khối, kim tự tháp trong ngoặc import nhiều dòng.
 * Cách dùng: check-import-order.mjs [--preset rn-cli|expo-router] [--config tiers.json] [<file|thư mục>...]
 * Dạng `--preset=<tên>` và `--config=<file>` cũng dùng được; không truyền đích thì kiểm `src`.
 * Không có --preset thì đọc `preset:` trong docs/ui-standard/project.md ở cwd; mặc định rn-cli.
 * Mã thoát: 0 sạch, 1 có vi phạm, 2 lỗi cách dùng (chỉ in thông điệp) hoặc lỗi nội bộ (kèm stack).
 */
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

import { checkFile, collectFiles, resolveConfig } from './import-order-lib.mjs';

const main = () => {
  const { config, targets } = resolveConfig(process.argv.slice(2));
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

// Errors a user can fix (unknown preset, unreadable overlay, bad flags) print just the message;
// anything else is an internal error, so its stack is kept for the bug report.
// Lỗi người dùng tự sửa được (preset lạ, overlay không đọc được, cờ sai) chỉ in thông điệp;
// lỗi khác là lỗi nội bộ nên giữ stack để báo lỗi.
const isUsageError = error =>
  String(error?.message).startsWith('[rn-ui-standard]') ||
  String(error?.code).startsWith('ERR_PARSE_ARGS_');

try {
  main();
} catch (error) {
  console.error(isUsageError(error) ? error.message : (error?.stack ?? String(error)));
  process.exit(2);
}
