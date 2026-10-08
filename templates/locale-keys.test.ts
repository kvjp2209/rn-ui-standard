/**
 * Locks the i18n key naming rule (references/copy-vi.md): keys are flat and each
 * one is the whole English text in snake_case, nothing shortened. Copy to
 * src/locale/__tests__/ and list in NOT_PROSE the keys whose text is not English
 * words (a sample value, a symbol, a language named in itself).
 *
 * Khoá luật đặt tên key i18n (references/copy-vi.md): key phẳng một tầng và mỗi
 * key là toàn bộ bản tiếng Anh dạng snake_case, không viết tắt. Copy vào
 * src/locale/__tests__/ rồi liệt kê trong NOT_PROSE các key có chuỗi không phải
 * chữ tiếng Anh (giá trị mẫu, ký hiệu, tên ngôn ngữ viết bằng chính nó).
 */
import en from '../en';
import vi from '../vi';

// The key a text must have: every word of the English text in snake_case,
// `{{param}}` as its name, `&` as "and", apostrophes and punctuation dropped.
// Key mà một chuỗi phải có: đủ mọi từ của bản tiếng Anh dạng snake_case,
// `{{param}}` thành tên param, `&` thành "and", bỏ dấu nháy và dấu câu.
const keyOf = (text: string) =>
  text
    .toLowerCase()
    .replace(/\{\{(\w+)\}\}/g, ' $1 ')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

// Texts that are not English words, so their key says what they are, e.g.
// 'example_email', 'no_value', 'vietnamese'.
// Chuỗi không phải chữ tiếng Anh, nên key nói nó là gì, vd 'example_email',
// 'no_value', 'vietnamese'.
const NOT_PROSE: readonly string[] = [];

describe('locale', () => {
  it('vi và en có cùng tập key', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
  });

  it('mọi key đều phẳng, không lồng nhóm', () => {
    for (const value of [...Object.values(vi), ...Object.values(en)]) {
      expect(typeof value).toBe('string');
    }
  });

  it('key ghi đủ nguyên văn bản tiếng Anh, không viết tắt', () => {
    const mismatched = Object.entries(en)
      .filter(([key]) => !NOT_PROSE.includes(key))
      .filter(([key, text]) => keyOf(text) !== key)
      .map(([key, text]) => `${key} → ${keyOf(text)}`);

    expect(mismatched).toEqual([]);
  });
});
