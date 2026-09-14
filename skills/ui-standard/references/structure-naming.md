# Cấu trúc thư mục, đặt tên, memo

## Một thư mục một màn

```
src/screens/<Màn>/
├── <Màn>.tsx          ← render
├── <Màn>.logic.ts     ← state + handler, không JSX
├── index.ts
├── components/
└── constants/ helpers/ types/ hooks/   ← khi cần
```

KHÔNG nhét nhiều màn vào một thư mục. Dấu hiệu đã sai: navigator phải import kiểu
`@src/screens/A/B` — thò tay vào ruột thư mục của màn khác.

## Đặt file theo chủ sở hữu

Trước khi tạo file, hỏi *"màn nào sở hữu cái này?"* — rồi **đếm số nơi dùng thật**.

| Dùng ở | Đặt tại |
|---|---|
| 1 màn | `screens/<Màn>/components/` (hoặc `constants/`, `helpers/`) |
| ≥ 2 màn, là UI | `src/components/` |
| ≥ 2 màn, là logic miền | `src/api/<domain>/` (vd `<domain>.presenter.ts`) |
| Primitive dựng trên Restyle, không biết miền | `src/components/Kit/` |

- `src/api/` **không import ngược** từ `@components`. Cần union kiểu UI thì khai tại chỗ.
- Component chỉ còn 1 nơi dùng mà đang nằm ở Kit/`components/` → trả về màn sở hữu.
  0 nơi dùng → xoá, kèm helper và test của nó.

## Tách file

- > 250 dòng nên tách, > 400 bắt buộc.
- Ranh giới: **state + handler** vào `.logic.ts`, phần render ở lại `.tsx`, component con
  vào `components/`.
- **Đừng** tách một hàm render cần chục prop thành component riêng — khoan prop như vậy
  tệ hơn file dài.
- **Miễn trừ file bảng tra / hằng số.** Phép thử: *thêm một mục mới có làm tăng số nhánh
  người đọc phải hiểu không?* Không → để yên dù dài. Thường gồm: file locale, registry
  `Icon.tsx`, union `IconType`, `palette.ts`/`themes/*`, `navigation/types.ts`,
  `constants/*`. Store hay file logic dài **không** được miễn.

## Đặt tên

- **Theo thực thể miền, hoặc theo token mà component tô.** `BrandCard` (vì nền `$brand`),
  `OrderSummary` — không `HeroCard`, `OrderHero`. "Hero" là từ vựng landing page, không
  nói gì về dữ liệu.
- **Đừng dựng lớp bọc rỗng.** Một file chỉ bọc `Pressable`, một file chỉ map entity sang
  prop, một file mới render — người đọc phải mở cả ba mới biết thẻ hiển thị gì. Gộp một,
  nhận thẳng entity.

## Kiểu route

```ts
// navigation/types.ts
export type OrderDetailsProp = RouteProp<HomeStackParamList, 'ORDER_DETAILS'>;

// SAI — ghép tại màn
const { params } = useRoute<RouteProp<HomeStackParamList, 'ORDER_DETAILS'>>();
// ĐÚNG
const { params } = useRoute<OrderDetailsProp>();
```

Gom một chỗ thì đổi tên route là sửa một nơi, `tsc` chỉ ra phần còn lại.

## Thứ tự `return` của hook & destructure — kim tự tháp hai nhóm

1. **Giá trị** — state, ref, giá trị tính toán, `t`
2. **Hàm** — `set*`, `handle*`, `on*`, mọi `useCallback`

Mỗi nhóm ngắn trên dài dưới. **Destructure phía dùng giữ đúng thứ tự** để hai bên đọc
song song. Không trả ra khoá mà component không dùng.

```ts
return {
  t,
  note,
  error,
  loading,
  showConfirmAlert,
  setNote,
  onFailed,
  handleSubmit,
  setShowConfirmAlert,
};
```

## memo / useMemo / useCallback

- **Màn hình luôn `export default memo(Screen)`.**
- **Component con: chỉ `memo` khi prop thật sự ổn định.** Mở nơi gọi ra xem — `memo` vô
  hiệu nếu: nhận `children`; nơi gọi truyền closure inline hoặc object/mảng literal; giá
  trị bị tính lại ở cha mỗi render.
- **Sửa gốc trước khi bọc memo:** cha phát prop mới mỗi render thì `useMemo` ở cha mới là
  việc cần làm.
- `React.memo` xoá type parameter của component generic — với component nhỏ, không đáng.
- `useCallback` cho handler trả ra từ `.logic.ts`; `useMemo` cho dẫn xuất trả mảng/object.
- `react-hooks/exhaustive-deps` ở mức `error`: lint xanh nghĩa là dependency đúng.
