/**
 * Locks the ui-standard token CONTRACT (names and shape), not the brand values.
 * Copy to src/theme/__tests__/ and set SIZES / RADII from the overlay.
 * Add a project-specific test next to it if you also want to lock values.
 *
 * Khoá HỢP ĐỒNG token của ui-standard (tên và hình dạng), không khoá giá trị thương hiệu.
 * Copy vào src/theme/__tests__/ rồi đặt SIZES / RADII theo overlay.
 * Muốn khoá cả giá trị thì viết thêm test riêng của dự án bên cạnh.
 */
import { defaultTheme } from '..';

const SIZES = [12, 14, 16, 18, 24, 30] as const;
const WEIGHTS = { R: '400', M: '500', SB: '600', B: '700' } as const;
const RADII = [0, 4, 6, 8, 12, 16, 24, 48] as const;

const SEMANTIC_COLORS = [
  '$cta',
  '$ctaSoft',
  '$brand',
  '$accent',
  '$canvas',
  '$surface',
  '$surfaceSoft',
  '$surfaceInput',
  '$text',
  '$textMuted',
  '$textSecondary',
  '$textPlaceholder',
  '$textOnBrand',
  '$textOnBrandMuted',
  '$trackOnBrand',
  '$border',
  '$borderStrong',
  '$danger',
  '$success',
  '$warning',
  '$overlay',
] as const;

type Colors = Record<string, string | undefined>;
type Variants = Record<string, { fontSize?: number; fontWeight?: string } | undefined>;

describe('hợp đồng token màu', () => {
  it('có đủ token semantic', () => {
    const colors = defaultTheme.colors as unknown as Colors;
    SEMANTIC_COLORS.forEach(name => {
      expect([name, typeof colors[name]]).toEqual([name, 'string']);
    });
  });
});

describe('text variant T<cỡ><độ đậm>', () => {
  it('có đủ tổ hợp cỡ × độ đậm, fontSize và fontWeight khớp tên', () => {
    const variants = defaultTheme.textVariants as unknown as Variants;
    SIZES.forEach(size => {
      Object.entries(WEIGHTS).forEach(([suffix, weight]) => {
        const name = `T${size}${suffix}`;
        expect([name, variants[name]?.fontSize, variants[name]?.fontWeight]).toEqual([
          name,
          size,
          weight,
        ]);
      });
    });
  });

  it('không có alias vai trò song song với T*', () => {
    ['body', 'caption', 'title', 'heading', 'overline'].forEach(name => {
      expect([name, name in defaultTheme.textVariants]).toEqual([name, false]);
    });
  });
});

describe('borderRadii', () => {
  it('thang số map đúng chính nó và có full', () => {
    const radii = defaultTheme.borderRadii as unknown as Record<string, number>;
    RADII.forEach(value => {
      expect(radii[value]).toBe(value);
    });
    expect(radii.full).toBe(9999);
  });

  it('không có radius đặt tên theo vai trò', () => {
    ['chip', 'card', 'hero', 'avatar', 'pill'].forEach(name => {
      expect([name, name in defaultTheme.borderRadii]).toEqual([name, false]);
    });
  });
});

describe('shadowVariants', () => {
  it('có đủ ba mức elevation', () => {
    ['raised', 'floating', 'overlay'].forEach(name => {
      expect([name, name in defaultTheme.shadowVariants]).toEqual([name, true]);
    });
  });
});
