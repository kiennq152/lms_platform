# VIAN Academy LMS

Hệ thống quản lý học tập cho học viên, giảng viên và quản trị viên, xây bằng **Expo (Web / iOS / Android) + Supabase**.

- 📄 Đặc tả yêu cầu: [docs/SRS.md](docs/SRS.md)
- 🗂 Mô hình dữ liệu: [docs/ERD.md](docs/ERD.md)
- 🚀 Cài đặt & bản đồ màn hình: [docs/README.md](docs/README.md)

## Bắt đầu nhanh

```bash
npm install
# 1. Chạy supabase_schema.sql → supabase/migrations/*.sql → supabase_seed.sql trong Supabase SQL Editor
# 2. Chạy app
npx expo start --web
```

Kiểm thử: `npm test` (database + unit), chi tiết ở [docs/README.md](docs/README.md#6-kiểm-thử).

Build web cho Vercel: `npx expo export --platform web` (thư mục `dist/`).
