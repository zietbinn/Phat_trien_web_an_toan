const http = require('http');

// Cấu hình
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const ATTACK_TYPE = process.env.ATTACK_TYPE || 'slow'; // 'slow', 'rapid', 'mixed'
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT || '5');
const DURATION = parseInt(process.env.DURATION || '30'); // seconds
const ENDPOINT = process.env.ENDPOINT || '/api/data';

// Thống kê
const stats = {
    sent: 0,
    success: 0,
    blocked: 0,
    errors: 0,
    startTime: Date.now()
};

// Màu sắc cho console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Tạo một request
function makeRequest(endpoint, delay = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const startTime = Date.now();
            const url = new URL(endpoint, TARGET_URL);
            
            const req = http.request(url, {
                method: 'GET',
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    stats.sent++;
                    
                    if (res.statusCode === 200) {
                        stats.success++;
                        log(`✓ Request ${stats.sent}: THÀNH CÔNG (${res.statusCode}) - ${responseTime}ms`, 'green');
                    } else if (res.statusCode === 429) {
                        stats.blocked++;
                        log(`✗ Request ${stats.sent}: BỊ CHẶN (${res.statusCode}) - Bị giới hạn tốc độ!`, 'red');
                    } else {
                        stats.errors++;
                        log(`✗ Request ${stats.sent}: LỖI (${res.statusCode})`, 'yellow');
                    }
                    
                    resolve();
                });
            });
            
            req.on('error', (err) => {
                stats.sent++;
                stats.errors++;
                log(`✗ Request ${stats.sent}: LỖI - ${err.message}`, 'red');
                resolve();
            });
            
            req.on('timeout', () => {
                stats.sent++;
                stats.errors++;
                req.destroy();
                log(`✗ Request ${stats.sent}: HẾT THỜI GIAN CHỜ`, 'yellow');
                resolve();
            });
            
            req.end();
        }, delay);
    });
}

// Tấn công chậm - gửi request từ từ nhưng liên tục
async function slowAttack() {
    log('\n🐌 Bắt đầu TẤN CÔNG CHẬM (tăng dần)...', 'cyan');
    
    const interval = setInterval(() => {
        for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
            makeRequest(ENDPOINT, Math.random() * 100);
        }
    }, 500); // Mỗi 500ms gửi một batch
    
    setTimeout(() => {
        clearInterval(interval);
        printStats();
    }, DURATION * 1000);
}

// Tấn công nhanh - gửi nhiều request cùng lúc
async function rapidAttack() {
    log('\n⚡ Bắt đầu TẤN CÔNG NHANH (burst requests)...', 'cyan');
    
    const promises = [];
    const requestsPerSecond = 20;
    
    for (let i = 0; i < DURATION; i++) {
        setTimeout(() => {
            for (let j = 0; j < requestsPerSecond; j++) {
                promises.push(makeRequest(ENDPOINT));
            }
        }, i * 1000);
    }
    
    setTimeout(() => {
        Promise.all(promises).then(() => {
            printStats();
        });
    }, (DURATION + 5) * 1000);
}

// Tấn công hỗn hợp - kết hợp cả hai
async function mixedAttack() {
    log('\n💥 Bắt đầu TẤN CÔNG HỖN HỢP (chậm + nhanh)...', 'cyan');
    
    let rapidCount = 0;
    
    // Slow attack liên tục
    const slowInterval = setInterval(() => {
        for (let i = 0; i < 3; i++) {
            makeRequest(ENDPOINT, Math.random() * 200);
        }
    }, 1000);
    
    // Rapid bursts định kỳ
    const rapidInterval = setInterval(() => {
        rapidCount++;
        log(`\n💣 Đợt tấn công nhanh #${rapidCount}...`, 'yellow');
        for (let i = 0; i < 15; i++) {
            makeRequest(ENDPOINT);
        }
    }, 5000);
    
    setTimeout(() => {
        clearInterval(slowInterval);
        clearInterval(rapidInterval);
        setTimeout(() => {
            printStats();
        }, 2000);
    }, DURATION * 1000);
}

// In thống kê
function printStats() {
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    const successRate = stats.sent > 0 ? ((stats.success / stats.sent) * 100).toFixed(2) : 0;
    const blockRate = stats.sent > 0 ? ((stats.blocked / stats.sent) * 100).toFixed(2) : 0;
    const requestsPerSecond = (stats.sent / duration).toFixed(2);
    
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 KẾT QUẢ MÔ PHỎNG TẤN CÔNG', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`Thời gian: ${duration} giây`, 'blue');
    log(`Tổng số Requests đã gửi: ${stats.sent}`, 'blue');
    log(`Requests/Giây: ${requestsPerSecond}`, 'blue');
    log(`Thành công: ${stats.success} (${successRate}%)`, 'green');
    log(`Bị chặn (Rate Limited): ${stats.blocked} (${blockRate}%)`, 'red');
    log(`Lỗi: ${stats.errors}`, 'yellow');
    log('='.repeat(60), 'cyan');
    log('\n💡 Xem dashboard tại http://localhost:3000/dashboard', 'cyan');
    log('💡 Xem API thống kê tại http://localhost:3000/api/stats\n', 'cyan');
    
    process.exit(0);
}

// Main
log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
log('║      Mô Phỏng Tấn Công DDoS - Express.js Demo           ║', 'cyan');
log('╚══════════════════════════════════════════════════════════╝', 'cyan');
log(`\nMục tiêu: ${TARGET_URL}${ENDPOINT}`, 'blue');
log(`Loại tấn công: ${ATTACK_TYPE}`, 'blue');
log(`Đồng thời: ${CONCURRENT_REQUESTS}`, 'blue');
log(`Thời gian: ${DURATION} giây\n`, 'blue');

// Kiểm tra server có sẵn sàng không
const testReq = http.request(new URL('/health', TARGET_URL), (res) => {
    if (res.statusCode === 200) {
        log('✓ Server đã sẵn sàng!\n', 'green');
        
        // Bắt đầu tấn công
        switch (ATTACK_TYPE.toLowerCase()) {
            case 'slow':
                slowAttack();
                break;
            case 'rapid':
                rapidAttack();
                break;
            case 'mixed':
                mixedAttack();
                break;
            default:
                log(`Không biết loại tấn công: ${ATTACK_TYPE}. Sử dụng 'slow'`, 'yellow');
                slowAttack();
        }
    } else {
        log('✗ Server không phản hồi đúng', 'red');
        process.exit(1);
    }
});

testReq.on('error', (err) => {
    log(`✗ Không thể kết nối đến server: ${err.message}`, 'red');
    log(`Đảm bảo server đang chạy tại ${TARGET_URL}`, 'yellow');
    process.exit(1);
});

testReq.end();

// Xử lý Ctrl+C
process.on('SIGINT', () => {
    log('\n\n⚠️  Tấn công bị ngắt bởi người dùng', 'yellow');
    printStats();
});

