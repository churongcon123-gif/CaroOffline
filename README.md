# 🎮 CaroOnline - Hệ thống chơi cờ Caro Multiplayer & Vs AI

Chào mừng đến với **CaroOnline**, một ứng dụng web chơi cờ Caro hiện đại, mang phong cách giao diện Steam tối giản, cao cấp và mượt mà. Dự án hỗ trợ chơi online trực tuyến giữa các người chơi, đấu tập với trí tuệ nhân tạo (CaroBot) tự động chỉnh độ khó theo Elo, và chơi cục bộ 2 người trên cùng một thiết bị.

---

## ✨ Tính năng nổi bật

### 🌐 Hệ thống Chơi Online (Multiplayer)
- **Sảnh Lobby trực quan**: Xem danh sách phòng đang chờ hoặc đang chơi kèm thông tin Elo của chủ phòng và thời gian tạo.
- **Tìm trận nhanh (Quick Match)**: Tự động ghép cặp với đối thủ có điểm Elo gần nhất đang chờ trong sảnh mà không cần nhập mật khẩu.
- **Phòng riêng tư**: Đặt mật khẩu khi tạo phòng để đấu giao hữu riêng với bạn bè.
- **Spectator Mode (Người xem)**: Tham gia xem trực tiếp các trận đấu đang diễn ra khi phòng đã đủ người chơi.
- **Đồng hồ đếm ngược per-turn**: Giới hạn 30 giây cho mỗi lượt đi, tự động xử thua khi hết giờ để chống "câu giờ".
- **Hệ thống chơi lại (Rematch)**: Đề xuất và chấp nhận đấu lại ngay sau khi trận đấu kết thúc, tự động đổi quân đi trước.
- **Xử lý ngắt kết nối**: Tự động phát hiện khi đối thủ đóng tab/mất kết nối và xử thắng cho người chơi còn lại.

### 🤖 Đấu với Máy (Vs AI Mode)
- **AI thông minh**: Động cơ AI tự động thay đổi độ khó và hành vi dựa trên điểm Elo hiện tại của bạn.
- **Tự động tính Elo**: Điểm Elo được tính toán lại theo công thức chuẩn Elo quốc tế sau mỗi ván thắng hoặc thua.

### 🏆 Bảng Xếp Hạng (Leaderboard)
- **Xếp hạng toàn cục**: Hiển thị danh sách các kỳ thủ hàng đầu sắp xếp theo Elo và tỉ lệ thắng.
- **Thanh tiến trình Elo**: Trực quan hóa khoảng cách Elo của các người chơi so với người đứng đầu bảng.
- **Phân trang hoàn chỉnh (Pagination)**: Tải danh sách mượt mà với 10 người chơi mỗi trang.
- **Highlight người dùng**: Tự động định vị và làm nổi bật vị trí xếp hạng của chính bạn trên bảng đấu.

### 👤 Trang cá nhân (Profile)
- **Avatar & Elo badge**: Thẻ thông tin cá nhân bắt mắt hiển thị thứ hạng của bạn.
- **Thống kê chi tiết**: Tổng hợp số trận thắng, số trận thua, tỉ lệ phần trăm thắng kèm biểu đồ thanh tỉ lệ xanh/đỏ trực quan.

### 🔔 Hệ thống thông báo (Toasts System)
- **Thông báo nổi**: Hệ thống Toasts thay thế hoàn toàn cho các hộp thoại `alert()` mặc định của trình duyệt, hiển thị mượt mà ở góc màn hình.

---

## 🛠️ Công nghệ sử dụng

- **Frontend**:
  - React (Vite)
  - Zustand (Quản lý trạng thái xác thực và thông báo nổi)
  - Axios (Tương tác REST API)
  - Socket.io-client (Đồng bộ thời gian thực)
  - Vanilla CSS (Steam-style UI design)

- **Backend**:
  - Node.js & Express
  - Socket.io (Hệ thống socket quản lý phòng đấu)
  - PostgreSQL (Lưu trữ dữ liệu tài khoản, Elo và chỉ số)

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Yêu cầu hệ thống
- Đã cài đặt **Node.js** (Phiên bản 18+) và **PostgreSQL** trên máy tính.

### 2. Thiết lập cơ sở dữ liệu
- Tạo một database mới trong PostgreSQL (Ví dụ: `postgres_caro`).
- Chạy các câu lệnh SQL trong file [backend/schema.sql](file:///c:/Hungg/CaroOnline/backend/schema.sql) để khởi tạo cấu trúc bảng `users`.
- *Lưu ý*: Server backend sẽ tự động đọc và thực thi file `schema.sql` để kiểm tra/tạo bảng khi khởi chạy.

### 3. Cấu hình & Chạy Backend
1. Truy cập thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` dựa theo file [.env.example](file:///c:/Hungg/CaroOnline/backend/.env.example):
   ```env
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=postgres_caro
   DB_PASSWORD=mật_khẩu_database
   DB_PORT=5432
   JWT_SECRET=khóa_bí_mật_tùy_chọn
   FRONTEND_URL=http://localhost:5173
   ```
4. Khởi chạy server ở chế độ phát triển:
   ```bash
   npm run dev
   ```

### 4. Cấu hình & Chạy Frontend
1. Truy cập thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Vite dev server):
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập: `http://localhost:5173`

---

## ⚔️ Luật chơi cờ Caro (Gomoku Rules)
1. **Quân cờ**: Người chơi 1 là **X** (màu xanh dương), Người chơi 2 hoặc AI là **O** (màu cam).
2. **Cách thắng**: Tạo thành một đường thẳng liên tục gồm đúng hoặc nhiều hơn **5 quân cờ cùng loại** theo hàng dọc, hàng ngang hoặc đường chéo.
3. **Luật chặn**: Không áp dụng luật chặn hai đầu (nếu đường 5 quân bị chặn ở cả hai đầu bởi quân đối phương, bạn vẫn giành chiến thắng).