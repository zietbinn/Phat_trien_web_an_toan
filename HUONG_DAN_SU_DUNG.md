# 📖 Hướng Dẫn Sử Dụng Chi Tiết

## 🎯 Mục Đích

File này hướng dẫn chi tiết cách sử dụng dự án từ đầu đến cuối, bao gồm:
- Cài đặt và khởi động
- Chạy các loại tấn công khác nhau
- Đọc và hiểu kết quả
- Troubleshooting

---

## 📦 BƯỚC 1: CÀI ĐẶT

### Yêu cầu hệ thống:
- **Node.js**: Phiên bản 14.x trở lên
- **npm**: Đi kèm với Node.js
- **Trình duyệt**: Để xem dashboard

### Cài đặt:

```bash
# 1. Di chuyển vào thư mục dự án
cd Ddos

# 2. Cài đặt dependencies
npm install
```

**Kết quả mong đợi:**
```
added 50 packages in 5s
```

---

## 🚀 BƯỚC 2: KHỞI ĐỘNG SERVER

### Chạy server:

```bash
npm start
```

### Kết quả:

Bạn sẽ thấy output như sau:
```
╔══════════════════════════════════════════════════════════╗
║     Server Demo Giảm Thiểu DDoS - Express.js            ║
╚══════════════════════════════════════════════════════════╝
🚀 Server đang chạy tại http://localhost:3000
📊 Dashboard: http://localhost:3000/dashboard
📈 API Thống kê: http://localhost:3000/api/stats
🔒 API được bảo vệ: http://localhost:3000/api/data
⚡ Kiểm tra tải: http://localhost:3000/api/load

Giới hạn Rate Limiting:
  - Trang chủ (/): 30 requests/phút
  - API (/api/data, /api/load): 10 requests/phút

💡 Chạy script mô phỏng tấn công: node attack-simulator.js
```

### Kiểm tra server hoạt động:

Mở trình duyệt và truy cập: `http://localhost:3000`

Bạn sẽ thấy JSON response:
```json
{
  "message": "Chào mừng đến với DDoS Mitigation Demo Server",
  "status": "đang hoạt động",
  "yourIP": "::1",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "info": "Server này được bảo vệ bởi rate limiting..."
}
```

---

## 📊 BƯỚC 3: XEM DASHBOARD

### Truy cập Dashboard:

Mở trình duyệt: `http://localhost:3000/dashboard`

### Giao diện Dashboard:

**4 Cards thống kê:**
1. **Trạng Thái Server**: Hiển thị "Bình thường" hoặc "ĐANG BỊ TẤN CÔNG"
2. **Tổng Requests**: Tổng số requests từ khi server khởi động
3. **Requests Được Cho Phép**: Số requests vượt qua rate limiting
4. **Requests Bị Chặn**: Số requests bị chặn (HTTP 429)

**Bảng Top IP Addresses:**
- Hiển thị top 10 IP addresses
- Thông tin: Tổng requests, Cho phép, Bị chặn, Tỷ lệ chặn

**Controls:**
- **Làm Mới Ngay**: Refresh thủ công
- **Reset Thống Kê**: Xóa tất cả counters
- **Auto-refresh**: Tự động làm mới mỗi 2 giây

---

## 💥 BƯỚC 4: CHẠY TẤN CÔNG

### Mở Terminal mới:

**Quan trọng**: Giữ server đang chạy ở terminal đầu tiên, mở terminal mới để chạy attack simulator.

### 4.1. Tấn Công Chậm (Slow Attack) - Mặc định

```bash
node attack-simulator.js
```

**Hoặc:**
```bash
ATTACK_TYPE=slow node attack-simulator.js
```

**Đặc điểm:**
- Gửi requests từ từ, tăng dần
- Mỗi 500ms gửi một batch
- **Mục đích**: Demo rate limiting phát hiện và chặn từ từ

**Output mẫu:**
```
╔══════════════════════════════════════════════════════════╗
║      Mô Phỏng Tấn Công DDoS - Express.js Demo           ║
╚══════════════════════════════════════════════════════════╝

Mục tiêu: http://localhost:3000/api/data
Loại tấn công: slow
Đồng thời: 5
Thời gian: 30 giây

✓ Server đã sẵn sàng!

🐌 Bắt đầu TẤN CÔNG CHẬM (tăng dần)...
✓ Request 1: THÀNH CÔNG (200) - 15ms
✓ Request 2: THÀNH CÔNG (200) - 12ms
...
✗ Request 11: BỊ CHẶN (429) - Bị giới hạn tốc độ!
✗ Request 12: BỊ CHẶN (429) - Bị giới hạn tốc độ!
```

### 4.2. Tấn Công Nhanh (Rapid Attack)

```bash
ATTACK_TYPE="rapid", node attack-simulator.js
```

**Đặc điểm:**
- Gửi nhiều requests cùng lúc (burst)
- 20 requests/giây
- **Mục đích**: Demo khả năng chống burst attacks

**Output mẫu:**
```
⚡ Bắt đầu TẤN CÔNG NHANH (burst requests)...
✓ Request 1: THÀNH CÔNG (200) - 10ms
✓ Request 2: THÀNH CÔNG (200) - 11ms
...
✗ Request 11: BỊ CHẶN (429) - Bị giới hạn tốc độ!
```

### 4.3. Tấn Công Hỗn Hợp (Mixed Attack)

```bash
ATTACK_TYPE=mixed node attack-simulator.js
```

**Đặc điểm:**
- Kết hợp slow attack liên tục + rapid bursts định kỳ
- Thực tế hơn
- **Mục đích**: Demo tấn công phức tạp

**Output mẫu:**
```
💥 Bắt đầu TẤN CÔNG HỖN HỢP (chậm + nhanh)...
💣 Đợt tấn công nhanh #1...
💣 Đợt tấn công nhanh #2...
```

---

## 📈 BƯỚC 5: ĐỌC KẾT QUẢ

### 5.1. Kết Quả từ Attack Simulator

Sau khi tấn công xong, bạn sẽ thấy:

```
============================================================
📊 KẾT QUẢ MÔ PHỎNG TẤN CÔNG
============================================================
Thời gian: 30.00 giây
Tổng số Requests đã gửi: 150
Requests/Giây: 5.00
Thành công: 10 (6.67%)
Bị chặn (Rate Limited): 140 (93.33%)
Lỗi: 0
============================================================

💡 Xem dashboard tại http://localhost:3000/dashboard
💡 Xem API thống kê tại http://localhost:3000/api/stats
```

**Giải thích:**
- **Thành công (6.67%)**: 10 requests đầu tiên vượt qua rate limiting
- **Bị chặn (93.33%)**: 140 requests còn lại bị chặn vì vượt quá 10 requests/phút
- **Kết luận**: Rate limiting hoạt động tốt!

### 5.2. Kết Quả trên Dashboard

**Trước khi tấn công:**
- Trạng thái: "Bình thường" (màu xanh)
- Tổng requests: 0
- Requests bị chặn: 0

**Trong khi tấn công:**
- Trạng thái: "ĐANG BỊ TẤN CÔNG" (màu đỏ, nhấp nháy)
- Tổng requests: Tăng liên tục
- Requests bị chặn: Tăng nhanh
- Top IP: Hiển thị IP tấn công với tỷ lệ chặn cao (>90%)

**Sau khi tấn công:**
- Trạng thái: Vẫn "ĐANG BỊ TẤN CÔNG" (có thể reset)
- Thống kê: Giữ nguyên cho đến khi reset

---

## 🔧 TÙY CHỈNH

### Các Biến Môi Trường:

```bash
# URL server (mặc định: http://localhost:3000)
TARGET_URL=http://localhost:3000

# Loại tấn công: slow, rapid, mixed (mặc định: slow)
ATTACK_TYPE=slow

# Số requests đồng thời (mặc định: 5)
CONCURRENT=5

# Thời gian tấn công - giây (mặc định: 30)
DURATION=30

# Endpoint tấn công (mặc định: /api/data)
ENDPOINT=/api/data
```

### Ví dụ sử dụng:

```bash
# Tấn công nhanh trong 60 giây
ATTACK_TYPE=rapid DURATION=60 node attack-simulator.js

# Tấn công hỗn hợp với 10 requests đồng thời
ATTACK_TYPE=mixed CONCURRENT=10 node attack-simulator.js

# Tấn công endpoint khác
ENDPOINT=/api/load node attack-simulator.js
```

---

## 🧪 TEST THỦ CÔNG

### Test với curl (Linux/Mac):

```bash
# Gửi 1 request
curl http://localhost:3000/api/data

# Gửi nhiều requests nhanh (sẽ bị chặn)
for i in {1..20}; do curl http://localhost:3000/api/data; done
```

### Test với PowerShell (Windows):

```powershell
# Gửi 1 request
Invoke-WebRequest -Uri http://localhost:3000/api/data

# Gửi nhiều requests nhanh
1..20 | ForEach-Object { Invoke-WebRequest -Uri http://localhost:3000/api/data }
```

### Test với trình duyệt:

1. Mở `http://localhost:3000/api/data`
2. Nhấn F5 nhiều lần (refresh)
3. Sau 10 lần, bạn sẽ thấy HTTP 429

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Cannot connect to server"

**Nguyên nhân**: Server chưa chạy hoặc chạy sai port

**Giải pháp:**
1. Kiểm tra server có đang chạy không
2. Kiểm tra port (mặc định: 3000)
3. Thử truy cập `http://localhost:3000/health`

### Lỗi: "Module not found"

**Nguyên nhân**: Chưa cài dependencies

**Giải pháp:**
```bash
npm install
```

### Dashboard không cập nhật

**Nguyên nhân**: Auto-refresh bị tắt

**Giải pháp:**
1. Bật checkbox "Tự động làm mới"
2. Hoặc nhấn "Làm Mới Ngay"

### Không thấy requests bị chặn

**Nguyên nhân**: Chưa vượt quá rate limit

**Giải pháp:**
1. Tăng số requests (CONCURRENT)
2. Tăng thời gian (DURATION)
3. Hoặc dùng rapid attack

---

## 📚 TÀI LIỆU THAM KHẢO

- [README.md](./README.md) - Tài liệu chính
- [YEU_CAU_DE_BAI.md](./YEU_CAU_DE_BAI.md) - Giải thích yêu cầu đề bài
- [TINH_NANG.md](./TINH_NANG.md) - Giải thích các tính năng
- [QUICKSTART.md](./QUICKSTART.md) - Hướng dẫn chạy nhanh

---

## ✅ CHECKLIST

Trước khi báo cáo, đảm bảo:

- [ ] Server chạy thành công
- [ ] Dashboard hiển thị đúng
- [ ] Đã test ít nhất 1 loại tấn công
- [ ] Đã thấy requests bị chặn (HTTP 429)
- [ ] Dashboard hiển thị "ĐANG BỊ TẤN CÔNG"
- [ ] Đã đọc và hiểu kết quả

---



