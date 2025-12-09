const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Lưu trữ thống kê
const stats = {
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    requestsByIP: {},
    startTime: new Date(),
    attackDetected: false
};

// Rate Limiter nghiêm ngặt cho API endpoints
const strictLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 10, // Tối đa 10 requests mỗi phút
    message: {
        error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
        retryAfter: '60 giây'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        stats.blockedRequests++;
        const ip = req.ip || req.connection.remoteAddress;
        if (!stats.requestsByIP[ip]) {
            stats.requestsByIP[ip] = { count: 0, blocked: 0, allowed: 0 };
        }
        stats.requestsByIP[ip].blocked++;
        stats.requestsByIP[ip].count++;
        
        // Phát hiện tấn công nếu có nhiều request bị chặn
        if (stats.requestsByIP[ip].blocked > 5) {
            stats.attackDetected = true;
            console.log(`⚠️  ATTACK DETECTED from IP: ${ip}`);
        }
        
        res.status(429).json({
            error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
            retryAfter: '60 giây',
            yourIP: ip,
            message: 'Bạn đã vượt quá giới hạn 10 requests/phút. Vui lòng đợi một chút.'
        });
    }
});

// Rate Limiter nhẹ hơn cho trang chủ
const normalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 30, // Tối đa 30 requests mỗi phút
    message: {
        error: 'Quá nhiều yêu cầu, vui lòng chậm lại.'
    }
});

// Middleware để log và đếm requests
app.use((req, res, next) => {
    stats.totalRequests++;
    const ip = req.ip || req.connection.remoteAddress;
    if (!stats.requestsByIP[ip]) {
        stats.requestsByIP[ip] = { count: 0, blocked: 0, allowed: 0 };
    }
    stats.requestsByIP[ip].count++;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${ip}`);
    next();
});

// Routes
app.get('/', normalLimiter, (req, res) => {
    stats.allowedRequests++;
    const ip = req.ip || req.connection.remoteAddress;
    stats.requestsByIP[ip].allowed++;
    
    res.json({
        message: 'Chào mừng đến với DDoS Mitigation Demo Server',
        status: 'đang hoạt động',
        yourIP: ip,
        timestamp: new Date().toISOString(),
        info: 'Server này được bảo vệ bởi rate limiting. Hãy thử gửi quá nhiều requests để xem nó hoạt động!',
        gioiHan: 'Trang chủ: 30 requests/phút'
    });
});

// API endpoint với rate limiting nghiêm ngặt
app.get('/api/data', strictLimiter, (req, res) => {
    stats.allowedRequests++;
    const ip = req.ip || req.connection.remoteAddress;
    stats.requestsByIP[ip].allowed++;
    
    res.json({
        data: 'Đây là dữ liệu API được bảo vệ',
        timestamp: new Date().toISOString(),
        yourIP: ip,
        message: 'Endpoint này có rate limiting nghiêm ngặt (10 requests/phút)',
        gioiHan: '10 requests/phút'
    });
});

// Endpoint để test load
app.get('/api/load', strictLimiter, (req, res) => {
    stats.allowedRequests++;
    const ip = req.ip || req.connection.remoteAddress;
    stats.requestsByIP[ip].allowed++;
    
    // Simulate some processing
    const start = Date.now();
    while (Date.now() - start < 50) {} // 50ms delay
    
    res.json({
        message: 'Endpoint kiểm tra tải',
        processingTime: '50ms',
        timestamp: new Date().toISOString(),
        gioiHan: '10 requests/phút'
    });
});

// Dashboard để xem thống kê
app.get('/api/stats', (req, res) => {
    const uptime = Math.floor((new Date() - stats.startTime) / 1000);
    const blockedPercentage = stats.totalRequests > 0 
        ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(2) 
        : 0;
    
    res.json({
        server: {
            uptime: `${uptime} seconds`,
            startTime: stats.startTime.toISOString(),
            status: stats.attackDetected ? '⚠️ ĐANG BỊ TẤN CÔNG' : '✅ Bình thường'
        },
        requests: {
            total: stats.totalRequests,
            allowed: stats.allowedRequests,
            blocked: stats.blockedRequests,
            blockedPercentage: `${blockedPercentage}%`
        },
        topIPs: Object.entries(stats.requestsByIP)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([ip, data]) => ({
                ip,
                totalRequests: data.count,
                allowed: data.allowed,
                blocked: data.blocked,
                blockRate: data.count > 0 ? ((data.blocked / data.count) * 100).toFixed(2) + '%' : '0%'
            })),
        timestamp: new Date().toISOString()
    });
});

// Endpoint để reset stats (chỉ dùng cho demo)
app.post('/api/reset-stats', (req, res) => {
    stats.totalRequests = 0;
    stats.blockedRequests = 0;
    stats.allowedRequests = 0;
    stats.requestsByIP = {};
    stats.startTime = new Date();
    stats.attackDetected = false;
    
    res.json({
        message: 'Đã reset thống kê thành công',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'khỏe mạnh',
        timestamp: new Date().toISOString(),
        message: 'Server đang hoạt động bình thường'
    });
});

// Serve dashboard HTML
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║     Server Demo Giảm Thiểu DDoS - Express.js            ║
╚══════════════════════════════════════════════════════════╝
🚀 Server đang chạy tại http://localhost:${PORT}
📊 Dashboard: http://localhost:${PORT}/dashboard
📈 API Thống kê: http://localhost:${PORT}/api/stats
🔒 API được bảo vệ: http://localhost:${PORT}/api/data
⚡ Kiểm tra tải: http://localhost:${PORT}/api/load

Giới hạn Rate Limiting:
  - Trang chủ (/): 30 requests/phút
  - API (/api/data, /api/load): 10 requests/phút

💡 Chạy script mô phỏng tấn công: node attack-simulator.js
    `);
});

