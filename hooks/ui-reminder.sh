#!/bin/sh
# Fires before Claude writes a .tsx file. Reminds it to load the ui-standard skill
# and the project overlay, once per session. Silent in repos without an overlay.
#
# Chạy trước khi Claude ghi một file .tsx. Nhắc nạp skill ui-standard và overlay
# của dự án, mỗi phiên một lần. Im lặng ở repo không có overlay.

payload=$(cat)

overlay="${CLAUDE_PROJECT_DIR:-.}/docs/ui-standard/project.md"
[ -f "$overlay" ] || exit 0

sid=$(printf '%s' "$payload" | jq -r '.session_id // "nosession"')
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')

case "$file" in
  *.tsx) ;;
  *) exit 0 ;;
esac

marker="${TMPDIR:-/tmp}/claude-ui-standard-${sid}"
[ -f "$marker" ] && exit 0
: > "$marker"

jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: "This edit touches a .tsx file. Load the `rn-ui-standard:ui-standard` skill and read docs/ui-standard/project.md NOW, before writing UI code — token contract, Kit-over-react-native, 4-tier import order, the four required data states, and the project'\''s deliberate decisions. · Thay đổi này đụng file .tsx. Nạp skill `rn-ui-standard:ui-standard` và đọc docs/ui-standard/project.md NGAY trước khi viết: hợp đồng token, luật Kit thay primitive RN, thứ tự import 4 tầng, 4 trạng thái bắt buộc, và các quyết định có chủ đích của dự án."
  }
}'
