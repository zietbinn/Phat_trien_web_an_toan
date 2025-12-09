# 🚀 Giải Thích Chi Tiết Các Tính Năng Đã Triển Khai

## 📋 Tổng Quan

Dự án này triển khai một hệ thống hoàn chỉnh để:
1. **Mô phỏng** các cuộc tấn công DDoS
2. **Bảo vệ** server bằng rate limiting
3. **Theo dõi** và hiển thị thống kê real-time

---

## 🛡️ PHẦN 1: SERVER VỚI RATE LIMITING

### 1.1. Express.js Server (`server.js`)

#### **Tính năng chính:**

##### ✅ **Rate Limiting với 2 mức độ**

**a) Rate Limiter cho Trang Chủ (`normalLimiter`)**
```javascript
windowMs: 1 * 60 * 1000,  // Cửa sổ thời gian: 1 phút
max: 30                    // Tối đa 30 requests/phút
```
- **Mục đích**: Cho phép traffic bình thường
- **Áp dụng cho**: Route `/`
- **Lý do**: Trang chủ thường có nhiều traffic hợp lệ

**b) Rate Limiter cho API (`strictLimiter`)**
```javascript
windowMs: 1 * 60 * 1000,  // Cửa sổ thời gian: 1 phút
max: 10                    // Tối đa 10 requests/phút
```
- **Mục đích**: Bảo vệ API endpoints khỏi abuse
- **Áp dụng cho**: Routes `/api/data`, `/api/load`
- **Lý do**: API thường cần bảo vệ nghiêm ngặt hơn

#### **Cách hoạt động:**
1. Server đếm số requests từ mỗi IP trong cửa sổ thời gian (1 phút)
2. Nếu vượt quá giới hạn → Trả về HTTP 429 (Too Many Requests)
3. Client phải đợi đến khi cửa sổ thời gian reset
4. Server tiếp tục tracking để phát hiện patterns tấn công

---

### 1.2. Tracking & Logging

#### ✅ **Theo dõi Requests theo IP**

```javascript
stats = {
    totalRequests: 0,        // Tổng số requests
    blockedRequests: 0,     // Số requests bị chặn
    allowedRequests: 0,      // Số requests được cho phép
    requestsByIP: {},       // Chi tiết theo từng IP
    attackDetected: false   // Cờ phát hiện tấn công
}
```

**Chức năng:**
- Đếm tổng số requests
- Phân loại requests (cho phép/chặn)
- Lưu trữ chi tiết theo IP address
- Phát hiện tấn công tự động

#### ✅ **Tự động phát hiện tấn công**

```javascript
if (stats.requestsByIP[ip].blocked > 5) {
    stats.attackDetected = true;
    console.log(`⚠️ ATTACK DETECTED from IP: ${ip}`);
}
```

**Logic:**
- Nếu một IP có > 5 requests bị chặn → Coi là tấn công
- Cập nhật trạng thái server thành "ĐANG BỊ TẤN CÔNG"
- Hiển thị cảnh báo trên dashboard

---

### 1.3. API Endpoints

#### ✅ **GET /** - Trang chủ
- Rate limit: 30 requests/phút
- Trả về thông tin server và IP của client
- Dùng để test rate limiting nhẹ

#### ✅ **GET /api/data** - API được bảo vệ
- Rate limit: 10 requests/phút (nghiêm ngặt)
- Trả về dữ liệu mẫu
- **Mục đích**: Demo rate limiting hoạt động

#### ✅ **GET /api/load** - Endpoint kiểm tra tải
- Rate limit: 10 requests/phút
- Có delay 50ms để simulate processing
- **Mục đích**: Test khả năng xử lý tải

#### ✅ **GET /api/stats** - API thống kê
- **Không có rate limiting** (để luôn có thể xem stats)
- Trả về:
  - Tổng số requests
  - Số requests bị chặn/cho phép
  - Top 10 IP addresses
  - Trạng thái server
  - Thời gian hoạt động

#### ✅ **POST /api/reset-stats** - Reset thống kê
- Reset tất cả counters
- Dùng để bắt đầu test mới

#### ✅ **GET /dashboard** - Web Dashboard
- Trả về file HTML dashboard
- Hiển thị thống kê real-time

---

## 💥 PHẦN 2: SCRIPT MÔ PHỎNG TẤN CÔNG

### 2.1. Attack Simulator (`attack-simulator.js`)

#### ✅ **3 Loại Tấn Công**

##### **a) Slow Attack (Tấn công chậm)**
```javascript
// Gửi requests từ từ, tăng dần
setInterval(() => {
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        makeRequest(ENDPOINT, Math.random() * 100);
    }
}, 500); // Mỗi 500ms
```

**Đặc điểm:**
- Gửi requests từ từ, không đột ngột
- Tăng dần số lượng
- **Mục đích**: Demo rate limiting phát hiện và chặn từ từ

##### **b) Rapid Attack (Tấn công nhanh)**
```javascript
// Gửi nhiều requests cùng lúc
for (let j = 0; j < requestsPerSecond; j++) {
    promises.push(makeRequest(ENDPOINT));
}
```

**Đặc điểm:**
- Gửi nhiều requests cùng lúc (burst)
- 20 requests/giây
- **Mục đích**: Demo khả năng chống burst attacks

##### **c) Mixed Attack (Tấn công hỗn hợp)**
```javascript
// Kết hợp slow + rapid bursts
// Slow attack liên tục
setInterval(() => { /* slow */ }, 1000);
// Rapid bursts định kỳ
setInterval(() => { /* rapid */ }, 5000);
```

**Đặc điểm:**
- Kết hợp cả hai loại
- Thực tế hơn
- **Mục đích**: Demo tấn công phức tạp

---

### 2.2. Thống Kê và Báo Cáo

#### ✅ **Tracking kết quả**

```javascript
stats = {
    sent: 0,      // Tổng requests đã gửi
    success: 0,   // Requests thành công (200)
    blocked: 0,   // Requests bị chặn (429)
    errors: 0     // Requests lỗi
}
```

#### ✅ **Báo cáo chi tiết**

Sau khi tấn công xong, hiển thị:
- Thời gian tấn công
- Tổng số requests đã gửi
- Requests/giây
- Tỷ lệ thành công/bị chặn
- Số lỗi

**Ví dụ output:**
```
📊 KẾT QUẢ MÔ PHỎNG TẤN CÔNG
============================================================
Thời gian: 30.00 giây
Tổng số Requests đã gửi: 150
Requests/Giây: 5.00
Thành công: 10 (6.67%)
Bị chặn (Rate Limited): 140 (93.33%)
Lỗi: 0
```

---

### 2.3. Tùy Chỉnh qua Environment Variables

```bash
TARGET_URL=http://localhost:3000  # URL server
ATTACK_TYPE=slow                  # Loại tấn công
CONCURRENT=5                      # Số requests đồng thời
DURATION=30                       # Thời gian (giây)
ENDPOINT=/api/data                # Endpoint tấn công
```

**Ví dụ sử dụng:**
```bash
# Tấn công nhanh trong 60 giây
ATTACK_TYPE=rapid DURATION=60 node attack-simulator.js

# Tấn công hỗn hợp với 10 requests đồng thời
ATTACK_TYPE=mixed CONCURRENT=10 node attack-simulator.js
```

---

## 📊 PHẦN 3: DASHBOARD MONITORING

### 3.1. Web Dashboard (`public/dashboard.html`)

#### ✅ **Thống Kê Real-time**

**4 Cards chính:**
1. **Trạng Thái Server**
   - Hiển thị: "Bình thường" hoặc "ĐANG BỊ TẤN CÔNG"
   - Thời gian hoạt động (uptime)
   - Badge màu xanh/đỏ

2. **Tổng Requests**
   - Tổng số requests từ khi server khởi động
   - Tăng liên tục

3. **Requests Được Cho Phép**
   - Số requests vượt qua rate limiting
   - Màu xanh

4. **Requests Bị Chặn**
   - Số requests bị chặn (HTTP 429)
   - Tỷ lệ phần trăm
   - Màu đỏ

#### ✅ **Bảng Top IP Addresses**

Hiển thị top 10 IP addresses với:
- Địa chỉ IP
- Tổng số requests
- Số requests được cho phép
- Số requests bị chặn
- Tỷ lệ chặn (%)

**Sắp xếp:** Theo tổng số requests (giảm dần)

#### ✅ **Auto-refresh**

- Tự động làm mới mỗi 2 giây
- Có thể bật/tắt
- Hiển thị thời gian cập nhật cuối

#### ✅ **Controls**

- **Làm Mới Ngay**: Refresh thủ công
- **Reset Thống Kê**: Xóa tất cả counters
- **Auto-refresh**: Bật/tắt tự động làm mới

---

### 3.2. Giao Diện

#### ✅ **Thiết Kế**

- **Màu sắc**: Gradient tím/xanh
- **Cards**: Trắng với shadow
- **Hover effects**: Cards nâng lên khi hover
- **Responsive**: Tự động điều chỉnh theo màn hình

#### ✅ **Trạng Thái Visual**

- **Bình thường**: Badge xanh, không nhấp nháy
- **Bị tấn công**: Badge đỏ, nhấp nháy (animation pulse)

---

## 🔧 PHẦN 4: CÁC TÍNH NĂNG BỔ SUNG

### 4.1. Health Check

**GET /health**
- Kiểm tra server có hoạt động không
- Trả về status "khỏe mạnh"
- Dùng để test kết nối trước khi tấn công

### 4.2. Logging

**Console logs:**
- Mỗi request được log với timestamp
- Format: `[timestamp] METHOD /path from IP`
- Giúp debug và theo dõi

### 4.3. Error Handling

- Xử lý timeout (5 giây)
- Xử lý lỗi kết nối
- Xử lý lỗi server
- Hiển thị thông báo rõ ràng

---

## 📈 LUỒNG HOẠT ĐỘNG

### Kịch bản 1: Request bình thường

```
1. Client gửi request → Server
2. Middleware đếm request
3. Kiểm tra rate limit
4. Nếu < limit → Cho phép (200 OK)
5. Cập nhật stats (allowedRequests++)
```

### Kịch bản 2: Request vượt quá limit

```
1. Client gửi request → Server
2. Middleware đếm request
3. Kiểm tra rate limit
4. Nếu >= limit → Chặn (429 Too Many Requests)
5. Cập nhật stats (blockedRequests++)
6. Kiểm tra nếu > 5 blocked → Phát hiện tấn công
```

### Kịch bản 3: Tấn công DDoS

```
1. Attack simulator gửi nhiều requests
2. Server nhận requests
3. Rate limiter chặn các requests vượt quá limit
4. Stats được cập nhật real-time
5. Dashboard hiển thị "ĐANG BỊ TẤN CÔNG"
6. Top IPs hiển thị IP tấn công với tỷ lệ chặn cao
```

---

## 🎯 TÓM TẮT CÁC TÍNH NĂNG

| Tính Năng | Mô Tả | File |
|-----------|-------|------|
| **Rate Limiting** | Giới hạn requests theo IP | `server.js` |
| **IP Tracking** | Theo dõi requests theo IP | `server.js` |
| **Attack Detection** | Tự động phát hiện tấn công | `server.js` |
| **API Stats** | API trả về thống kê | `server.js` |
| **Slow Attack** | Tấn công chậm, tăng dần | `attack-simulator.js` |
| **Rapid Attack** | Tấn công nhanh, burst | `attack-simulator.js` |
| **Mixed Attack** | Kết hợp cả hai | `attack-simulator.js` |
| **Dashboard** | Web interface monitoring | `public/dashboard.html` |
| **Auto-refresh** | Tự động làm mới stats | `public/dashboard.html` |
| **Health Check** | Kiểm tra server | `server.js` |

---

## 💡 LỢI ÍCH CỦA CÁC TÍNH NĂNG

1. **Rate Limiting**: Bảo vệ server khỏi quá tải
2. **IP Tracking**: Phát hiện và theo dõi attackers
3. **Attack Detection**: Cảnh báo sớm khi có tấn công
4. **Dashboard**: Dễ dàng theo dõi và phân tích
5. **Multiple Attack Types**: Demo đầy đủ các kịch bản
6. **Real-time Stats**: Cập nhật ngay lập tức

---

**Kết luận:** Dự án này triển khai đầy đủ các tính năng cần thiết để mô phỏng tấn công DDoS và bảo vệ server bằng rate limiting, với giao diện monitoring trực quan và dễ sử dụng.

