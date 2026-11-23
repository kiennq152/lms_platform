# VIAN Academy LMS — Tài liệu dự án

| Tài liệu | Nội dung |
|---|---|
| [SRS.md](SRS.md) | Đặc tả yêu cầu v2.0 (Supabase MVP), trạng thái từng FR |
| [ERD.md](ERD.md) | Mô hình dữ liệu, RPC, trigger, storage |
| [legacy/](legacy/) | Tài liệu của bản web + Node/Firebase cũ (chỉ để tham khảo) |

---

## 1. Cài đặt database (một lần)

Mở **Supabase Dashboard → SQL Editor** và chạy lần lượt:

1. [`supabase_schema.sql`](../supabase_schema.sql): bảng gốc (bỏ qua nếu database đã có).
2. [`supabase/migrations/20261122000000_srs_mvp.sql`](../supabase/migrations/20261122000000_srs_mvp.sql): sửa lỗi bảo mật, thêm bảng, trigger, RPC, storage. **Chạy lại nhiều lần vẫn an toàn.**
   Sau đó chạy [`20261123000000_grants_privacy.sql`](../supabase/migrations/20261123000000_grants_privacy.sql): cấp quyền API và ẩn email/điện thoại. **Phải chạy trước khi deploy bản app tương ứng.**
   Cuối cùng chạy [`20261124000000_hidden_course_access.sql`](../supabase/migrations/20261124000000_hidden_course_access.sql): học viên đã đăng ký vẫn học được khi khoá bị ẩn.
3. [`supabase_seed.sql`](../supabase_seed.sql) (tuỳ chọn): danh mục, giảng viên/học viên mẫu (mật khẩu `123456`, **không chạy trên database thật**), khoá học, mã giảm giá `WELCOME10`, `VIAN200K`.
4. Tạo admin: đăng ký một tài khoản trong app, rồi chạy:
   ```sql
   update public.users set role = 'admin', admin_approved = true where email = 'you@example.com';
   ```

> Lần chạy đầu, migration duyệt sẵn mọi tài khoản giảng viên **đã tồn tại** để họ không bị chặn. Giảng viên đăng ký sau đó cần admin duyệt tại *Quản trị → Người dùng → Chờ duyệt GV*.

### Cấu hình Supabase Auth nên kiểm tra
- **Authentication → Providers → Email**: bật *Confirm email* nếu muốn bắt buộc xác thực email.
- **Authentication → Email Templates → Magic Link**: thêm `{{ .Token }}` để email có mã OTP 6 số (dùng cho đăng nhập OTP và quên mật khẩu).
- **Authentication → URL Configuration**: thêm domain Vercel vào *Site URL / Redirect URLs*.

## 2. Chạy ứng dụng

```bash
npm install
npx expo start --web     # web: http://localhost:8081
npx expo start           # mobile qua Expo Go
```

Build web tĩnh (Vercel dùng [`vercel.json`](../vercel.json)):
```bash
npx expo export --platform web   # → dist/
```

## 3. Bản đồ màn hình

| Khu vực | Route | Vai trò |
|---|---|---|
| Trang chủ, Khoá học, Giỏ hàng, Cộng đồng, Tài khoản | `/(tabs)/…` | Mọi người |
| Chi tiết khoá học, Học bài, Thanh toán, Chứng chỉ, Chủ đề, Hồ sơ, Hỗ trợ | `/(details)/…` | Mọi người (một số cần đăng nhập) |
| Học tập của tôi | `/student/dashboard` | Học viên |
| Bảng điều khiển, Tạo/Sửa khoá, Nội dung, Học viên & Hỏi đáp | `/instructor/…` | Giảng viên |
| Tổng quan, Người dùng, Kiểm duyệt, Giao dịch, Mã giảm giá, Danh mục, Hỗ trợ, Cài đặt | `/admin/…` | Admin |

## 4. Cấu trúc code

```
app/                 expo-router (mỗi file là một màn hình)
components/ui/kit.tsx  bộ UI dùng chung (Card, Badge, StatCard, BarChart, Field, Chips, Tabs...)
components/role-guard.tsx  chặn route theo vai trò
lib/supabase.ts      client
lib/auth.tsx         session + hồ sơ + app_settings (useAuth)
lib/cart.tsx         giỏ hàng lưu trên thiết bị (useCart)
lib/api.ts           câu select dùng chung, upload ảnh
lib/format.ts        định dạng tiền, ngày, nhãn tiếng Việt
lib/notify.ts        alert/confirm chạy được cả web và mobile
supabase/migrations/ SQL migration
```

## 5. Luồng nghiệp vụ chính

1. **Giảng viên** đăng ký → admin duyệt → tạo khoá (luôn là *Bản nháp*) → thêm chương/bài → *Gửi duyệt*.
2. **Admin** duyệt → khoá chuyển *Đã xuất bản* (hoặc *Bị từ chối* kèm lý do → GV sửa và gửi lại).
3. **Học viên** đăng ký miễn phí, hoặc thêm vào giỏ → thanh toán (mô phỏng, có mã giảm giá) → học → đánh dấu hoàn thành → đạt 100% thì tự nhận chứng chỉ.
4. **Hoàn tiền**: admin → *Giao dịch* → *Hoàn tiền* → học viên mất quyền truy cập.

## 6. Kiểm thử

| Lệnh | Nội dung |
|---|---|
| `npm run test:db` | Chạy schema + toàn bộ migration trên PGlite (Postgres thật, không cần Docker): quyền API, RLS, thanh toán, hoàn tiền, chứng chỉ, seed |
| `npm run test:unit` | Jest: hàm trong `lib/`, giỏ hàng, chặn theo vai trò, trạng thái lỗi |
| `npm test` | Cả hai |
| `npm run typecheck`, `npm run lint` | Kiểm tra kiểu và quy tắc code |

CI chạy tất cả ở mỗi lần push/PR vào `stg` và `main`. Test database không cấp sẵn quyền nào: thêm bảng mới thì migration phải tự `grant`.
