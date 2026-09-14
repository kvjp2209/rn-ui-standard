# Trạng thái bắt buộc

Mọi màn có tải dữ liệu khai báo đủ **loading → có dữ liệu → rỗng → lỗi**. Không trạng
thái nào rơi vào màn trắng.

| Trạng thái | Dùng | Ghi chú |
|---|---|---|
| Loading nội dung | Skeleton dựng từ `Kit/Skeleton` (`SkeletonBox`, `SkeletonText`, `SkeletonSection`) | Hình khối khớp bố cục thật. Trễ hiện vài trăm ms (hook kiểu `useDelayedLoading`) để request nhanh không nháy |
| Loading chặn thao tác | `LoadingView` | Chỉ cho lớp phủ đè cả màn (submit, thanh toán…) |
| Tải thêm trang | Spinner nhỏ ở chân list | Spinner inline nhỏ được phép |
| Có dữ liệu | — | |
| Rỗng | `<ListEmpty content={t('…')} />` | Không tự viết khối rỗng riêng |
| Lỗi | `<ListEmpty title icon content actionLabel onActionPress />` | Luôn có nút thử lại |

## `ListEmpty`

```tsx
<ListEmpty content={t('list_is_empty')} />                    // minh hoạ mặc định
<ListEmpty icon="card-outline" content={t('...')} />          // icon cụ thể
<ListEmpty content={t('...')} hideVisual />                   // list ngang, chỗ hẹp
<ListEmpty title={t('...')} content={t('...')}
           actionLabel={t('try_again')} onActionPress={refetch} />  // lỗi / có hành động
```

`content` bắt buộc và phải qua i18n. Không có giá trị mặc định tiếng Anh.

## Store phải phơi lỗi

Màn không dựng được trạng thái lỗi nếu store nuốt lỗi vào `console.log`. Mỗi store có tải
dữ liệu:

- có trường `error: string | null` trong state;
- trong `catch`: `set({ error: <lỗi đã chuẩn hoá>.message })`, không chỉ log;
- xoá `error` khi bắt đầu lần gọi kế tiếp.

## `disabled` ≠ "trông mờ"

`disabled` của React Native chỉ nghĩa là **"không bấm được"**. "Trông như không dùng
được" là chuyện khác và không phải lúc nào cũng đi kèm — nhiều chỗ dùng `disabled` thuần
để chặn thao tác lặp (vd phần đánh giá đã gửi) và **không** muốn giao diện đổi.

- Kit `Pressable` **không tự làm mờ** khi `disabled`. Đừng thêm opacity mặc định vào Kit.
- Cần hiện mờ → truyền `opacity={0.5}` ngay tại nơi gọi.
- Nên có test khoá hành vi này trong Kit để không ai "sửa" lại.

## Phản hồi khi nhấn

`Pressable` của React Native không có phản hồi thị giác mặc định (khác
`TouchableOpacity`). Có thêm phản hồi mặc định trong Kit hay không là **quyết định của dự
án** — xem overlay.
