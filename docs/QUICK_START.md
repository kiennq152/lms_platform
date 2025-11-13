# 🚀 VIAN Academy LMS - Quick Start Guide

## Tóm Tắt Nhanh

Đây là một hệ thống quản lý học tập (LMS) hoàn chỉnh được xây dựng bằng **HTML5 + Tailwind CSS + JavaScript**.

## 📂 Các Trang Chính

| Trang | Đường dẫn | Chức Năng |
|-------|---------|----------|
| 🏫 Instructor Dashboard | `bảng_điều_khiển_giảng_viên/code.html` | Xem doanh thu, quản lý khóa học |
| 👤 Student Dashboard | `bảng_điều_khiển_học_viên/code.html` | Xem khóa học, tiến độ học |
| 👨‍💼 Admin Dashboard | `bảng_quản_trị/code.html` | Thống kê, quản lý người dùng |
| 📚 Course Catalog | `trang_danh_mục_khóa_học/index.html` | Duyệt và tìm khóa học |
| 🎥 Course Details | `trang_chi_tiết_khóa_học/code.html` | Chi tiết khóa học |
| ▶️ Course Player | `trình_phát_khóa_học_/index.html` | Xem video bài học |
| 🛒 Shopping Cart | `giỏ_hàng_&_thanh_toán/code.html` | Giỏ hàng & Thanh toán |
| 👥 Community | `cộng_đồng_/index.html` | Diễn đàn thảo luận |
| ⚙️ Profile | `hồ_sơ_&_cài_đặt_tài_khoản/code.html` | Cài đặt tài khoản |
| 💬 Help Center | `hỗ_trợ_/index.html` | FAQ & Hỗ trợ |
| ⚖️ Policies | `pháp_lý_/index.html` | Điều khoản & Chính sách |

## ✨ Tính Năng Nổi Bật

✅ **Dashboard cho Giáo Viên**
- Xem doanh thu
- Quản lý khóa học
- Xem danh sách học viên
- Phân tích thống kê

✅ **Dashboard cho Học Sinh**
- Xem khóa học đang học
- Theo dõi tiến độ
- Xem chứng chỉ
- Lịch sử thanh toán

✅ **Quản Lý Khóa Học**
- Danh sách khóa học với bộ lọc
- Tìm kiếm và sắp xếp
- Chi tiết khóa học
- Trình phát video

✅ **Thanh Toán**
- Giỏ hàng động
- Mã giảm giá
- Nhiều phương thức thanh toán
- Hóa đơn

✅ **Cộng Đồng**
- Diễn đàn thảo luận
- Tạo chủ đề mới
- Bình luận

✅ **Hỗ Trợ**
- FAQ
- Biểu mẫu liên hệ
- Chat hỗ trợ

✅ **Dark Mode**
- Toàn bộ app hỗ trợ dark mode
- Thích ứng tự động

✅ **Responsive**
- Mobile, tablet, desktop
- Touch-friendly

## 🎨 Thiết Kế

### Màu Sắc
- **Primary**: Xanh tối (#1E3A8A)
- **Accent**: Đỏ (#DC2626)
- **Background**: Sáng/Tối

### Font
- **Main Font**: Lexend (Google Fonts)
- **Icons**: Material Symbols

## 🔧 Cách Sử Dụng

### 1. Mở Các Trang
Đơn giản, mở các file HTML trong trình duyệt:
```bash
# Windows
start "bảng_điều_khiển_giảng_viên/code.html"

# Mac
open "bảng_điều_khiển_giảng_viên/code.html"

# Linux
xdg-open "bảng_điều_khiển_giảng_viên/code.html"
```

### 2. Local Storage
Dữ liệu được lưu trong browser:
- **cart** - Giỏ hàng
- **userProfile** - Hồ sơ người dùng

Để xóa:
```javascript
localStorage.clear();
```

### 3. Chức Năng Test

#### Shopping Cart
- Mua khóa học
- Áp dụng mã: `SAVE10`, `SAVE50`, `SUMMER20`
- Thanh toán

#### Profile
- Chỉnh sửa thông tin
- Thay đổi ảnh đại diện
- Lưu thay đổi

#### Course Learning
1. Mở Course Catalog
2. Thêm khóa học vào giỏ
3. Thanh toán
4. Mở Course Player

## 💡 Các Mã Giảm Giá Test

| Mã | Loại | Mức Giảm |
|----|------|---------|
| `SAVE10` | % | 10% |
| `SAVE50` | $ | $50 |
| `SUMMER20` | % | 20% |

## 📱 Responsive Layout

- **Mobile**: 375px+
- **Tablet**: 768px+
- **Desktop**: 1024px+

## 🎯 Các Chức Năng Chính

### Admin Dashboard
```javascript
// Tìm kiếm người dùng
const search = document.querySelector('input[placeholder="Search anything..."]');
search.addEventListener('input', (e) => {
  // Tìm kiếm trong bảng
});
```

### Shopping Cart
```javascript
// Áp dụng mã giảm giá
const coupon = 'SAVE10';
// Lưu vào localStorage

// Xử lý thanh toán
const total = calculateTotal();
```

### Profile
```javascript
// Lưu hồ sơ
localStorage.setItem('userProfile', JSON.stringify(data));

// Load hồ sơ
const profile = JSON.parse(localStorage.getItem('userProfile'));
```

## 🔐 Security Tips

1. **Không lưu sensitive data** trong localStorage
2. **Validate input** trước khi xử lý
3. **Escape HTML** để tránh XSS
4. **HTTPS** khi deploy lên production

## 📊 File Structure

```
stitch_lms_dashboard/
├── bảng_điều_khiển_giảng_viên/       (Instructor)
├── bảng_điều_khiển_học_viên/         (Student)
├── bảng_quản_trị/                    (Admin)
├── trang_danh_mục_khóa_học/          (Courses)
├── trang_chi_tiết_khóa_học/          (Course Detail)
├── trình_phát_khóa_học_/             (Player)
├── giỏ_hàng_&_thanh_toán/            (Cart)
├── cộng_đồng_/                       (Community)
├── hồ_sơ_&_cài_đặt_tài_khoản/        (Profile)
├── hỗ_trợ_/                          (Help)
├── pháp_lý_/                         (Legal)
└── README.md
```

## 🚀 Deployment

### Để Deploy Lên Internet

1. **Static Hosting** (Recommended)
   - Netlify, Vercel, GitHub Pages
   - Chỉ cần push code
   - Miễn phí SSL

2. **Traditional Hosting**
   - Upload files via FTP
   - Cần web server (Apache, Nginx)

3. **Server VPS**
   - Full control
   - Cần cấu hình server

## 📈 Tối Ưu Hóa

### Performance
- Minify CSS/JS
- Compress images
- Use CDN
- Enable caching

### SEO
- Add meta tags
- Use semantic HTML
- Add descriptions
- Optimize images

## 🐛 Troubleshooting

### Vấn đề: Dark mode không hoạt động
**Giải pháp**: Thêm class `.dark` vào `<html>` tag

### Vấn đề: Dữ liệu mất sau refresh
**Giải pháp**: Dữ liệu được lưu trong localStorage, kiểm tra browser settings

### Vấn đề: Icon không hiển thị
**Giải pháp**: Kiểm tra Material Symbols CDN link

## 📞 Support

- 📧 Email: support@vianacademy.com
- 💬 Forum: https://vianacademy.com/community
- 🆘 Help: `/hỗ_trợ_/index.html`

## 📝 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## 🎓 Dành Cho Developers

### Thêm Khóa Học Mới

```javascript
const newCourse = {
  id: 7,
  title: 'New Course',
  instructor: 'John Doe',
  price: 99.99,
  rating: 4.8,
  students: 1000,
  category: 'Programming',
  level: 'Intermediate'
};

this.courses.push(newCourse);
```

### Thêm Chức Năng Mới

1. Tạo class JavaScript
2. Thêm event listeners
3. Xử lý data
4. Cập nhật UI

### Debug

```javascript
// Browser Console
console.log('Debug message');

// Check localStorage
console.log(localStorage);

// Check specific data
console.log(localStorage.getItem('cart'));
```

## 🎉 Bắt Đầu Ngay

1. Mở terminal
2. Vào thư mục project
3. Mở file HTML trong browser
4. Bắt đầu explore!

```bash
cd stitch_lms_dashboard
# Mở file HTML của bạn
```

## 📚 Học Thêm

- [Tailwind CSS Docs](https://tailwindcss.com)
- [Material Icons](https://fonts.google.com/icons)
- [JavaScript MDN](https://developer.mozilla.org)
- [HTML5 Spec](https://html.spec.whatwg.org/)

---

**Version**: 1.0.0  
**Last Updated**: 13/11/2024  
**License**: © 2024 VIAN Academy

Happy Learning! 🎓✨
