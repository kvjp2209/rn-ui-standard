# Thứ tự import

Rule này có **BỐN luật con. Kiểm thiếu một luật là báo "sạch" nhầm.**

1. Đúng thứ tự tầng.
2. Đúng **một** dòng trống giữa hai tầng; **không** có dòng trống trong một tầng.
3. Kim tự tháp trong mỗi khối.
4. Kim tự tháp bên trong ngoặc của import nhiều dòng.

Không cần kiểm bằng mắt:

```bash
node <plugin-root>/skills/ui-standard/scripts/check-import-order.mjs src
```

## Các tầng

```
react · react-native · @components/Kit          ← tầng 1
                                                ← dòng trống
thư viện bên thứ ba (react-i18next, @shopify/…) ← tầng 2
                                                ← dòng trống
@components/* @constants @navigation @theme     ← tầng 3: module chung
@libs @utils @hooks @assets @locale @src/hooks
                                                ← dòng trống
@api/*                                          ← khối riêng
                                                ← dòng trống
@stores/*                                       ← khối riêng
                                                ← dòng trống
./… ../… @src/screens/…                         ← tầng 4: nội bộ module
```

- `@api/*` và `@stores/*` **luôn là khối riêng**, sau tầng 3.
- **Alias không quyết định tầng, nguồn gốc mới quyết định.** `@src/screens/…` là màn khác
  → tầng 4. `@src/hooks/…` là chung → tầng 3.
- Import tương đối (`../Box`, `./types`) luôn tầng 4, kể cả bên trong `components/Kit/`.
- Import sâu vào Kit (`@components/Kit/Box`, `import type { X } from '@components/Kit/…'`)
  vẫn là Kit → **tầng 1**, xếp kim tự tháp chung với barrel.
- Tầng 1 **không** có thứ tự cứng `react-native` → `Kit`. Chỉ `react` cố định đầu; phần
  còn lại theo kim tự tháp.

## Kim tự tháp

**Lớp 1 — giữa các import trong khối:** ngắn trên, dài dưới, đo bằng **độ dài DÒNG CUỐI**
(dòng chứa `from '...'`). Import một dòng thì là cả dòng; nhiều dòng thì là
`} from '...';`. Nhờ vậy import nhiều dòng xen kẽ tự nhiên với import một dòng:

```ts
import Animated, {
  runOnJS,
  withTiming,
} from 'react-native-reanimated';                                        // 33
import { useSafeAreaInsets } from 'react-native-safe-area-context';      // 66
import { Gesture, GestureDetector } from 'react-native-gesture-handler'; // 71
```

**`react` luôn ở dòng đầu tiên**, kể cả khi dài hơn dòng dưới — ngoại lệ duy nhất.

**Lớp 2 — bên trong ngoặc của import nhiều dòng:** tên ngắn nhất ở trên.

```ts
import {
  StyleSheet,        // 10
  ListRenderItem,    // 14
  RefreshControl,    // 14
  ActivityIndicator, // 17
} from 'react-native';
```

Import một dòng không áp lớp 2 (`{ Box, FlatList, Pressable, Text }` giữ nguyên).

Ưu tiên: **path trước, specifier sau.**

## Mẫu đầy đủ

```ts
import { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Box, Pressable, Text } from '@components/Kit';

import { useTranslation } from 'react-i18next';

import { Icon } from '@components/Icon';
import { SCREENS } from '@constants/SCREENS';
import { navigateTo } from '@navigation/actions';
import { useThemeStyles } from '@theme';

import { OrderItem } from '@api/orders/orders.type';

import { useOrderStore } from '@stores/orders';

import OrderRow from './components/OrderRow';
import { detailSheetRef } from '@src/screens/OrderDetails/constants';
```

## Bẫy khi codemod

Script chèn import mới vào *sau dòng import cuối cùng* (hoặc ngay trước dòng Kit) sẽ phá
thứ tự ở hàng loạt file cùng lúc. Chèn đúng khối theo tầng, rồi chạy lại bộ kiểm.
