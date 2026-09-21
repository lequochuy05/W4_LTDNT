# VKU Field Survey 🏫

VKU Field Survey là một ứng dụng di động đa nền tảng được thiết kế cho việc kiểm tra, khảo sát cơ sở vật chất tại khuôn viên trường Đại học Việt Hàn (VKU). 

Ứng dụng được xây dựng theo kiến trúc **Offline-First PWA** kết hợp với **Capacitor** để biên dịch thành một ứng dụng Android hoàn chỉnh (Native Android App) nhưng vẫn có thể chạy độc lập như một trang web (Web App).

---

## 🌟 Tính năng nổi bật

1. **Khảo sát & Kiểm tra Phòng học:**
   - Đánh giá tình trạng cơ sở vật chất (Condition: Excellent, Good, Fair, Poor).
   - Thêm ghi chú chi tiết.
   - Chụp ảnh minh họa (Sử dụng Native Camera trên Android hoặc Input File trên Web).
   - Định vị GPS (Tọa độ tự động).

2. **Kiến trúc Offline-First (Không cần mạng vẫn hoạt động):**
   - Mọi form khảo sát đang viết dở được tự động lưu nháp (Auto-save) vào `IndexedDB`.
   - Nếu bị mất mạng lúc gửi, khảo sát sẽ tự động vào **Hàng đợi đồng bộ (Sync Queue)**.
   - Ngay khi có mạng trở lại, hệ thống (thông qua Background Sync hoặc Event Listener) sẽ tự động đẩy dữ liệu lên máy chủ.

3. **Xác thực Đa Nền Tảng:**
   - Hỗ trợ đăng nhập mặc định (Tài khoản thử nghiệm).
   - **Đăng nhập bằng Google (Social Login)** tương thích với cả Web và Android Capacitor.

---

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

Yêu cầu môi trường: Cài sẵn `Node.js` (>= 18), `npm`, và `Android Studio` (nếu muốn build Android).

### 1. Cài đặt thư viện
Mở Terminal tại thư mục gốc của dự án (`W4`) và chạy:
```bash
npm install
```

### 2. Chạy ứng dụng trên Trình duyệt (Web / PWA)
Chạy lệnh sau để khởi động môi trường phát triển:
```bash
npm run dev
```
- Mở `http://localhost:5173/login` trên trình duyệt (Khuyên dùng Google Chrome).
- **Tài khoản test:** Email `test@vku.udn.vn` | Password `password` (Hoặc dùng nút Google Login).

### 3. Chạy ứng dụng trên Android (Native)
Nếu bạn muốn build ra file `.apk` hoặc chạy thử trên máy ảo Android:

1. Build code Web ra thư mục `dist`:
   ```bash
   npm run build
   ```
2. Đồng bộ code Web sang thư mục Native Android của Capacitor:
   ```bash
   npx cap sync android
   ```
3. Mở mã nguồn Android bằng Android Studio:
   ```bash
   npx cap open android
   ```
4. Khi Android Studio mở lên, đợi Gradle load xong. Chọn thiết bị giả lập (Emulator) hoặc cắm điện thoại Android vào và bấm nút **▶ Run** trên thanh công cụ để cài app.

---

## 🧪 Hướng dẫn Test Tính năng Offline (Ngắt mạng)

Để kiểm chứng tính năng Offline-First của ứng dụng, hãy làm theo kịch bản sau trên Google Chrome:

1. Mở trang Web `http://localhost:5173` và đăng nhập.
2. Mở trình công cụ **Chrome DevTools** (Nhấn F12).
3. Chuyển sang tab **Network** (Mạng).
4. Ở menu xổ xuống (đang để chữ "No throttling" hoặc "Fast 3G"), hãy chọn **"Offline"**. Hoặc bạn có thể bấm vào nút Trạng thái mạng ảo góc trên bên phải thanh Navbar của ứng dụng.
5. Ứng dụng sẽ hiện thông báo "Offline".
6. Tiến hành điền thông tin và bấm Submit một khảo sát bất kỳ.
7. Bạn sẽ thấy khảo sát đó hiện trạng thái **"Pending Sync ⏳"** ở ngoài Dashboard.
8. Bật lại mạng thành **"Online"**. Hệ thống sẽ ngay lập tức phát hiện và tự động chuyển trạng thái của khảo sát đó thành **"Synced ✅"**!

---

## 🏗️ Cấu trúc thư mục chính

- `src/features/` : Chứa logic và giao diện cho từng chức năng (Surveys, Facilities, Auth).
- `src/db/indexeddb.ts` : Quản lý cơ sở dữ liệu nội bộ (Drafts & SyncQueue) để phục vụ Offline.
- `public/sw.js` : Service Worker cài đặt các chiến lược Caching (Cache-First, Network-First...).
- `capacitor.config.ts` : File cấu hình thiết lập Capacitor và Google Auth Plugin.
- `android/` : Thư mục chứa mã nguồn Java/Kotlin native được sinh tự động bởi Capacitor.
