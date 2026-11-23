# Software Requirements Specification (SRS)
## VIAN Academy Learning Management System — v2.0 (Supabase MVP)

| | |
|---|---|
| **Phiên bản** | 2.0 |
| **Ngày** | 2026-11-22 |
| **Thay thế** | v1.0 (2024-01-20, lưu tại [`legacy/SRS_v1.md`](legacy/SRS_v1.md)) |
| **Nền tảng** | Expo (React Native + Web) · Supabase (Postgres, Auth, Storage, RLS) |

---

## 1. Giới thiệu

### 1.1 Mục đích
Tài liệu mô tả yêu cầu của VIAN Academy LMS sau khi chuyển từ kiến trúc web + Node/Express + PostgreSQL tự quản (v1) sang **Expo + Supabase**. Mục tiêu của v2 là một bản MVP chạy thật, ít hạ tầng: Supabase đảm nhận xác thực, lưu trữ, phân quyền và giám sát; ứng dụng chỉ còn một codebase chạy được trên Web, iOS và Android.

### 1.2 Phạm vi
Ba vai trò: **Học viên**, **Giảng viên**, **Quản trị viên**. Hệ thống hỗ trợ danh mục khoá học, đăng ký và thanh toán (mô phỏng), học qua video/bài đọc, theo dõi tiến độ, cấp chứng chỉ, diễn đàn và hỏi đáp, dashboard cho từng vai trò, kiểm duyệt khoá học, báo cáo doanh thu và hỗ trợ khách hàng.

### 1.3 Nguyên tắc thiết kế
1. **Dữ liệu đơn giản.** Dùng tối đa 14 bảng Postgres. Không có server riêng; logic nhạy cảm (thanh toán, hoàn tiền, thống kê) nằm trong các hàm SQL `security definer` (RPC).
2. **Bảo mật ở tầng database.** Mọi bảng bật Row Level Security. Client không bao giờ được tin cậy về vai trò, giá tiền hay trạng thái.
3. **Tận dụng Supabase.** Auth (email/mật khẩu, OTP), Storage (ảnh), Logs/Reports/Backups được dùng thay cho các tính năng tự xây ở v1.
4. **Cắt bỏ phần "enterprise".** Giám sát CPU/RAM, log hệ thống tự xây, i18n, 2FA… được hoãn hoặc giao cho Supabase Dashboard.

### 1.4 Thuật ngữ
- **RLS**: Row Level Security, chính sách phân quyền theo từng dòng của Postgres.
- **RPC**: hàm Postgres được gọi từ client qua `supabase.rpc()`.
- **Khoá học (Course) → Chương (Module) → Bài học (Lesson).**
- **Đăng ký (Enrollment)**: quan hệ học viên ↔ khoá học.

---

## 2. Mô tả tổng quan

### 2.1 Kiến trúc

```
┌──────────────────────────────┐        ┌─────────────────────────────────────┐
│  Expo app (Web / iOS / Android)│  HTTPS │ Supabase                            │
│  expo-router, supabase-js     │ ─────▶ │  Auth  · PostgREST · Storage         │
│  lib/auth · lib/cart (local)  │        │  Postgres: tables + RLS + triggers   │
└──────────────────────────────┘        │            + RPC (checkout, stats…)  │
                                        └─────────────────────────────────────┘
```

### 2.2 Vai trò người dùng

| Vai trò | Cách có | Quyền chính |
|---|---|---|
| Khách | Không đăng nhập | Xem danh mục, chi tiết khoá, bài xem thử, diễn đàn, gửi yêu cầu hỗ trợ, thêm vào giỏ |
| Học viên | Tự đăng ký | Đăng ký/mua khoá, học, tiến độ, chứng chỉ, đánh giá, hỏi đáp, diễn đàn |
| Giảng viên | Tự đăng ký **và được admin duyệt** | Tạo/sửa khoá, xây nội dung, gửi duyệt, xem học viên, doanh thu, trả lời hỏi đáp |
| Quản trị viên | Gán bằng SQL (không tự đăng ký được) | Toàn quyền: người dùng, kiểm duyệt, giao dịch/hoàn tiền, mã giảm giá, danh mục, hỗ trợ, cài đặt |

### 2.3 Môi trường vận hành
- Web: trình duyệt hiện đại (Chrome, Edge, Firefox, Safari); triển khai tĩnh trên Vercel (`npx expo export`).
- Mobile: iOS/Android qua Expo.
- Backend: một project Supabase.

### 2.4 Ràng buộc
- Thanh toán là **mô phỏng** (`SIM-…`), không tích hợp cổng thật ở v2.
- Video lưu ở YouTube (công khai hoặc không công khai) hoặc một URL file video; không tự stream.
- Giao diện tiếng Việt; chưa hỗ trợ đa ngôn ngữ.

---

## 3. Yêu cầu chức năng

Trạng thái: **✅ Đã làm** · **🟡 Đơn giản hoá** (làm theo cách gọn hơn v1) · **⏸ Hoãn** (để phiên bản sau).

### 3.1 Quản lý người dùng

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-001 | Đăng ký bằng email/mật khẩu | ✅ | Supabase Auth `signUp`; trigger `handle_new_user` tạo hồ sơ `users` |
| FR-002 | Đăng nhập | ✅ | Mật khẩu hoặc OTP email (`(auth)/login`, `(auth)/verify-otp`) |
| FR-003 | Quên mật khẩu | ✅ | Gửi OTP email → xác thực → `(details)/change-password` |
| FR-004 | Duy trì phiên | ✅ | supabase-js (localStorage trên web, SecureStore trên mobile) |
| FR-005 | Phân quyền theo vai trò | ✅ | `users.role` + RLS + `RoleGuard`; người dùng **không thể** tự gán `admin` |
| FR-006 | Xem/sửa hồ sơ | ✅ | `(tabs)/profile`, `(details)/edit-profile` |
| FR-007 | Ảnh đại diện | ✅ | Storage bucket `avatars/<uid>/…` |
| FR-008 | Cập nhật thông tin cá nhân | ✅ | Trigger `users_guard` chặn sửa `role/status/admin_approved/email` |
| FR-009 | Đổi mật khẩu | ✅ | `auth.updateUser({ password })` |
| FR-010 | Admin xem mọi người dùng | ✅ | `admin/users` |
| FR-011 | Admin tạo/sửa/xoá người dùng | 🟡 | Sửa vai trò, duyệt GV, khoá/mở khoá. Tạo qua trang Đăng ký; xoá vĩnh viễn trong Supabase Dashboard |
| FR-012 | Khoá/mở khoá tài khoản | ✅ | `status = 'suspended'`: bị đăng xuất, RPC/insert bị chặn bởi `is_active_user()` |
| FR-013 | Lọc theo vai trò, trạng thái | ✅ | Kèm bộ lọc "Chờ duyệt GV" |
| FR-014 | Xuất dữ liệu người dùng | ✅ | CSV (UTF-8 BOM, mở được bằng Excel) |

### 3.2 Khoá học

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-015 | Danh mục khoá học | ✅ | `(tabs)/courses` (chỉ `status = 'published'`) |
| FR-016 | Tìm theo tên, danh mục, giảng viên | ✅ | Tìm không dấu ở phía client |
| FR-017 | Lọc theo giá, đánh giá, danh mục | ✅ | Kèm lọc theo trình độ |
| FR-018 | Sắp xếp | ✅ | Phổ biến, đánh giá, mới nhất, giá tăng/giảm |
| FR-019 | Chi tiết khoá học | ✅ | `(details)/course-detail`; curriculum lấy từ view `course_outline` (không lộ URL video) |
| FR-020 | GV tạo khoá học | ✅ | `instructor/create-course`; chỉ GV **đã được duyệt** |
| FR-021 | Tiêu đề, mô tả, giá | ✅ | Kèm mục tiêu, yêu cầu, trình độ, ngôn ngữ, ảnh bìa |
| FR-022 | Tải lên tài liệu | 🟡 | Video: link YouTube hoặc URL. Tài liệu: link đính kèm (`lessons.attachment_url`). Ảnh bìa: Storage `thumbnails` |
| FR-023 | Tổ chức chương/bài | ✅ | `instructor/curriculum/[id]`: thêm, sửa, xoá, sắp xếp |
| FR-024 | Điều kiện tiên quyết | ⏸ | Thay bằng trường văn bản "Yêu cầu" |
| FR-025 | Xuất bản/ẩn khoá học | ✅ | Luồng `draft → pending → published / rejected`; GV có thể ẩn (`published → draft`) nhưng **không tự xuất bản** được |
| FR-026 | Admin xem khoá chờ duyệt | ✅ | `admin/courses` |
| FR-027 | Duyệt/từ chối | ✅ | Từ chối bắt buộc có lý do (`rejection_reason`), GV nhìn thấy lý do |
| FR-028 | Thống kê khoá học | ✅ | Số bài, học viên, đánh giá, doanh thu (trigger đếm + `admin_stats`) |
| FR-029 | Admin sửa thông tin khoá | ✅ | Admin dùng chung màn hình chỉnh sửa |

### 3.3 Đăng ký & Thanh toán

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-030 | Đăng ký khoá học | ✅ | Khoá miễn phí: insert trực tiếp (RLS chỉ cho phép khi `price = 0`). Khoá trả phí: RPC `checkout` |
| FR-031 | Kiểm tra điều kiện tiên quyết | ⏸ | Theo FR-024 |
| FR-032 | Khoá miễn phí và trả phí | ✅ | |
| FR-033 | Xem khoá đã đăng ký | ✅ | `student/dashboard` |
| FR-034–036 | Giỏ hàng: thêm, xem, xoá | 🟡 | Lưu trên thiết bị (`lib/cart.tsx`), không cần bảng; tự loại khoá đã sở hữu hoặc đã gỡ |
| FR-037 | Tính tổng kèm giảm giá | ✅ | RPC `quote_checkout`: giá luôn tính ở server |
| FR-038 | Nhiều phương thức thanh toán | 🟡 | Thẻ / PayPal / Chuyển khoản, **mô phỏng** |
| FR-039 | Thanh toán an toàn | 🟡 | Không lưu số thẻ; giao dịch chỉ được tạo bởi RPC `security definer` |
| FR-040 | Mã giảm giá | ✅ | Bảng `coupons` (theo % hoặc số tiền cố định, giới hạn lượt dùng, hạn sử dụng); quản lý tại `admin/coupons` |
| FR-041 | Hoá đơn/biên lai | 🟡 | Mã giao dịch và lịch sử trong `student/dashboard`; chưa có PDF |
| FR-042 | Xử lý lỗi thanh toán | ✅ | RPC trả lỗi tiếng Việt (mã hết hạn, khoá đã sở hữu, tài khoản bị khoá…) |

### 3.4 Học tập

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-043 | Truy cập nội dung sau khi đăng ký | ✅ | RLS trên `lessons`: chỉ người đã đăng ký, GV của khoá, admin; bài `is_preview` mở cho mọi người |
| FR-044 | Trình phát video | ✅ | YouTube iframe; trên web có `<video>` cho URL thường |
| FR-045 | Theo dõi xem video | 🟡 | Tự đánh dấu hoàn thành khi video YouTube/HTML5 kết thúc; chưa lưu giây đang xem |
| FR-046 | Tải tài liệu | ✅ | `attachment_url` |
| FR-047 | Nhiều định dạng video | 🟡 | YouTube và mọi định dạng trình duyệt phát được |
| FR-048–050 | Tiến độ, %, đánh dấu hoàn thành | ✅ | `lesson_progress`; trigger tính lại `enrollments.progress_percentage` |
| FR-051 | Học tiếp từ chỗ dừng | ✅ | Mở bài học truy cập gần nhất chưa hoàn thành |

### 3.5 Chứng chỉ

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-052 | Tự cấp khi hoàn thành | ✅ | Trigger tạo `certificates` khi tiến độ đạt 100% |
| FR-053 | Tên học viên, khoá học, ngày | ✅ | Kèm giảng viên và mã xác thực 10 ký tự |
| FR-054 | Tải chứng chỉ | 🟡 | Web: In / Lưu PDF qua trình duyệt; mobile: chia sẻ |
| FR-055 | Xem danh sách chứng chỉ | ✅ | Kèm trang xác thực công khai theo mã |

### 3.6 Cộng đồng

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-056–058 | Tạo chủ đề, trả lời, tìm kiếm | ✅ | `(tabs)/community`, `(details)/topic` |
| FR-059 | Diễn đàn theo khoá học | ✅ | `forum_topics.course_id`; tab Hỏi đáp trong trình phát bài học |
| FR-060 | Học viên đặt câu hỏi | ✅ | `type = 'question'` |
| FR-061 | GV trả lời | ✅ | Người hỏi, GV của khoá hoặc admin đánh dấu "lời giải" (RPC `mark_solution`) |
| FR-062 | Vote câu trả lời | ⏸ | Thay bằng đánh dấu lời giải |
| — | Kiểm duyệt (bổ sung) | ✅ | Admin ghim, khoá, xoá; tác giả xoá bài của mình |

### 3.7 Dashboard

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-063–067 | Dashboard học viên | ✅ | `student/dashboard`: khoá học, tiến độ, chứng chỉ, lịch sử thanh toán, bài tiếp theo |
| FR-068–071 | Dashboard giảng viên | ✅ | `instructor/dashboard` (RPC `instructor_stats`): doanh thu 6 tháng, học viên, hiệu quả theo khoá, đăng ký gần đây; `instructor/students/[id]` |
| FR-072–076 | Dashboard admin | ✅ | `admin/dashboard` (RPC `admin_stats`) |
| FR-077–078 | Log hệ thống, giám sát | 🟡 | Supabase Dashboard → Logs / Reports |

### 3.8 Tài chính

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-079 | Tổng doanh thu | ✅ | |
| FR-080 | Doanh thu theo ngày/tuần/tháng/năm | ✅ | Kèm biểu đồ 12 tháng |
| FR-081 | Theo khoá học | ✅ | Top 10 |
| FR-082 | Theo giảng viên | ✅ | Top 10 |
| FR-083 | Ghi nhận giao dịch | ✅ | Bảng `transactions` (chỉ RPC được ghi) |
| FR-084 | Lọc, tìm giao dịch | ✅ | Theo kỳ, trạng thái, học viên, mã giao dịch, mã giảm giá |
| FR-085 | Báo cáo tài chính | 🟡 | Thống kê trên dashboard + xuất CSV |
| FR-086 | Hoàn tiền | ✅ | RPC `refund_transaction` (chỉ admin) → giao dịch `refunded`, thu hồi quyền truy cập khoá học |

### 3.9 Quản trị hệ thống

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-087–088 | Cấu hình tên site, email | ✅ | Bảng 1 dòng `app_settings`; `admin/settings` |
| FR-089 | Cấu hình bảo mật | 🟡 | Supabase Dashboard → Authentication |
| FR-090 | Cấu hình email | 🟡 | Supabase Dashboard → Auth → SMTP |
| FR-091 | Chế độ bảo trì | ✅ | `maintenance_mode`: người dùng thường thấy trang bảo trì, admin vẫn vào được |
| — | Bật/tắt đăng ký giảng viên (bổ sung) | ✅ | `allow_instructor_signup` |
| — | Quản lý danh mục (bổ sung) | ✅ | `admin/categories` |
| FR-092–099 | Giám sát, log, cảnh báo | ⏸ | Dùng Supabase Logs / Reports / Alerts |

### 3.10 Hỗ trợ

| Mã | Yêu cầu | Trạng thái | Cách hiện thực |
|---|---|---|---|
| FR-100 | FAQ | ✅ | `(details)/support` |
| FR-101 | Liên hệ hỗ trợ | ✅ | Bảng `support_tickets` (khách cũng gửi được); admin phản hồi tại `admin/tickets`, người dùng thấy phản hồi |
| FR-102 | Tài liệu hướng dẫn | ✅ | `docs/` |

---

## 4. Yêu cầu giao diện ngoài

| Mã | Yêu cầu | Trạng thái |
|---|---|---|
| UI-001 | Responsive | ✅ Khung 768px cho trang học viên, 1200px cho dashboard; trình phát chia 2 cột trên web rộng |
| UI-002 | Dark mode | ⏸ Theme tối mới có ở mức điều hướng, các màn hình chính đang dùng nền sáng |
| UI-003 | WCAG 2.1 AA | 🟡 Có `accessibilityRole/Label` cho nút, tab, thanh tiến độ; chưa audit đầy đủ |
| UI-004 | Đa ngôn ngữ | ⏸ |
| SI-001 | Cổng thanh toán | ⏸ Mô phỏng; dự kiến Stripe qua Edge Function + webhook |
| SI-002 | Dịch vụ email | ✅ Supabase Auth (OTP, xác thực email) |
| SI-003 | Video hosting | ✅ YouTube / URL bên ngoài |
| SI-004 | Database | ✅ Supabase Postgres |
| CI-001 | HTTPS | ✅ |
| CI-002 | REST API | ✅ PostgREST + RPC |
| CI-003 | WebSocket realtime | ⏸ Supabase Realtime có sẵn khi cần |

---

## 5. Yêu cầu phi chức năng

### 5.1 Bảo mật

| Mã | Yêu cầu | Hiện thực |
|---|---|---|
| SEC-001 | Băm mật khẩu | Supabase Auth (bcrypt) |
| SEC-002 | HTTPS | Supabase / Vercel |
| SEC-003–005 | CSRF / XSS / SQL injection | JWT bearer (không dùng cookie session); React escape output; PostgREST tham số hoá |
| SEC-006–007 | Hết hạn phiên, giới hạn đăng nhập | Cấu hình Supabase Auth |
| SEC-008 | 2FA | ⏸ (Supabase MFA có sẵn khi cần) |
| SEC-009 (mới) | Không tự nâng quyền | `handle_new_user` chỉ nhận `student`/`instructor`; trigger `users_guard` |
| SEC-010 (mới) | Không tự xuất bản | Trigger `courses_guard` giới hạn các bước chuyển trạng thái |
| SEC-011 (mới) | Bảo vệ nội dung trả phí | RLS trên `lessons`; view `course_outline` không chứa URL |
| SEC-012 (mới) | Giá tính ở server | `quote_checkout` / `checkout`; client chỉ gửi danh sách `course_id` |

### 5.2 Hiệu năng & mở rộng
- Có index trên mọi khoá ngoại hay dùng (`courses.status`, `enrollments.course_id`, `transactions.transaction_date`…).
- Bộ đếm (`total_lessons`, `total_enrollments`, `rating`, `reply_count`) được trigger lưu sẵn, danh mục không phải `COUNT`.
- Thống kê dashboard tính trong một lần gọi RPC.

### 5.3 Độ tin cậy
- Sao lưu: Supabase Backups (gói Pro có PITR).
- Migration chạy lại nhiều lần vẫn an toàn (idempotent).

---

## 6. Mô hình dữ liệu
Xem [`ERD.md`](ERD.md).

## 7. Lộ trình sau MVP
1. Thanh toán thật (Stripe/VNPay) qua Supabase Edge Function + webhook, chuyển `payment_status` từ `pending` sang `completed`.
2. Lưu vị trí xem video (giây) và xem tiếp từ đúng chỗ.
3. Xuất chứng chỉ PDF ở server (Edge Function) và gửi qua email.
4. Vote câu trả lời, thông báo realtime khi có trả lời mới.
5. Dark mode đầy đủ, đa ngôn ngữ (vi/en/ko).
6. Điều kiện tiên quyết giữa các khoá học.

## 8. Lịch sử thay đổi

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0 | 2024-01-20 | SRS ban đầu (web + Node/Express) |
| 2.0 | 2026-11-22 | Chuyển sang Expo + Supabase; đánh dấu trạng thái từng FR; bổ sung SEC-009…012 |
