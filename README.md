# rn-ui-standard

Quy chuẩn UI dùng chung cho các dự án React Native dùng Shopify Restyle, đóng gói thành
Claude Code plugin.

Repo chỉ chứa **luật chung**. Mọi thứ riêng của một dự án (giá trị màu, định hướng thị
giác, file mẫu, quyết định có chủ đích) nằm trong **overlay** của chính dự án đó.

## Nội dung

```
.claude-plugin/          plugin.json + marketplace.json
skills/ui-standard/
  SKILL.md               luật cốt lõi, trỏ tới references
  references/            token, import, cấu trúc, trạng thái, copy tiếng Việt, bẫy
  scripts/               check-import-order.mjs — kiểm đủ 4 luật thứ tự import
hooks/                   nhắc nạp skill ở lần ghi .tsx đầu tiên (chỉ khi repo có overlay)
templates/
  project.md             overlay để copy vào dự án
  eslint-ui-rules.js     phần luật máy chặn được
  theme-contract.test.ts khoá hợp đồng tên token
```

## Giả định về dự án dùng

Cấu trúc thư mục và alias theo khuôn: `src/screens/<Màn>/`, `src/components/Kit/`,
`src/components/Icon/`, `src/theme/themes/light.ts`, `src/api/<domain>/`, `src/stores/`,
`src/navigation/types.ts`; alias `@components`, `@theme`, `@api`, `@stores`, `@src`…
Alias khác thì truyền `--config` cho bộ kiểm import.

## Cài vào một dự án

**1. Bật plugin cho cả team** — chạy ở thư mục gốc dự án, CLI tự ghi
`.claude/settings.json` (commit file đó):

```bash
claude plugin marketplace add <git-url-hoặc-đường-dẫn> --scope project
claude plugin install rn-ui-standard@rn-ui-standard --scope project
```

Với đường dẫn local, CLI ghi `"source": { "source": "directory", "path": "…" }` — chỉ đúng
trên máy đó. Khi repo đã có remote, chạy lại lệnh đầu với git URL để cả team dùng được.

**2. Tạo overlay:** copy `templates/project.md` → `docs/ui-standard/project.md`, điền.

**3. Trỏ từ `CLAUDE.md` của dự án:**

```md
## Trước khi viết UI
Nạp skill `rn-ui-standard:ui-standard` và đọc `docs/ui-standard/project.md` TRƯỚC dòng
code UI đầu tiên.
```

**4. Tuỳ chọn:** gộp `templates/eslint-ui-rules.js` vào `.eslintrc.js`, copy
`templates/theme-contract.test.ts` vào `src/theme/__tests__/`.

Nếu dự án đang có skill UI riêng trong `.claude/skills/`, gỡ nó sau khi overlay đã đủ để
tránh hai nguồn luật.

## Kiểm thứ tự import

```bash
node <đường-dẫn-plugin>/skills/ui-standard/scripts/check-import-order.mjs src
```

Thoát mã 1 khi còn vi phạm, dùng được trong lint-staged/CI.

## Đóng góp luật mới

Luật học được ở một dự án chỉ vào repo này khi:

1. Áp được cho **mọi** dự án cùng khuôn — không thì nó thuộc overlay của dự án đó.
2. **Không mang dấu vết dự án nguồn:** không tên sản phẩm, không thực thể miền, không mã
   màu, không đường dẫn file cụ thể, không số liệu đo, không ngày tháng hay lịch sử migrate.
   Ví dụ minh hoạ dùng thực thể trung tính (`Order`, `Profile`).
3. Kèm **lý do** (vì sao) ngắn gọn, không kèm câu chuyện.

Tăng `version` trong `.claude-plugin/plugin.json` và `marketplace.json` mỗi lần phát hành.
