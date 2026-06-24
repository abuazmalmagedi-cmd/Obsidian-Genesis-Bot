require('dotenv').config();
const { Telegraf } = require('telegraf');
const http = require('http');

// تفعيل البوت باستخدام التوكن
const bot = new Telegraf(process.env.BOT_TOKEN);

// رابط السيرفر الخاص بك على Render
const RENDER_URL = 'https://obsidian-genesis-bot-huw2.onrender.com';

// ذاكرة مؤقتة لحفظ أرصدة وأوقات تعدين المستخدمين
const localDatabase = {};

bot.start((ctx) => {
    ctx.reply('مرحباً بك في بوت Obsidian Genesis ($OBSD)!\nاضغط على الزر لفتح تطبيق التعدين.');
});

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // تفعيل الـ CORS لتسمح لموقع Softr بإرسال واستقبال البيانات بدون حظر أمني
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 1. مسار جلب بيانات ورصيد المستخدم من تليجرام باستخدام تفكيك النص العادي المضمون
    if (req.url.startsWith('/api/user') && req.method === 'GET') {
        const queryString = req.url.split('?')[1] || '';
        const params = new URLSearchParams(queryString);
        const userId = params.get('userId');

        if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing userId' }));
            return;
        }

        if (!localDatabase[userId]) {
            localDatabase[userId] = { balance: "0.00", lastMininingTime: null, referrals: 0 };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(localDatabase[userId]));
        return;
    }

    // 2. مسار تحديث الرصيد عند التعدين
    if (req.url === '/api/mine' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const { userId, balance } = data;

                if (userId) {
                    if (!localDatabase[userId]) {
                        localDatabase[userId] = { referrals: 0 };
                    }
                    localDatabase[userId].balance = parseFloat(balance || 0).toFixed(2);
                    localDatabase[userId].lastMininingTime = new Date().getTime();

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: localDatabase[userId] }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid userId' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
        return;
    }

    // ربط طلبات تليجرام بالـ Webhook
    if (req.url === `/bot${process.env.BOT_TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                bot.handleUpdate(JSON.parse(body || '{}'), res);
            } catch (err) {
                if (!res.writableEnded) {
                    res.writeHead(500);
                    res.end('Webhook Error');
                }
            }
        });
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OBSD Bot Web Service with Mining API is Running...\n');
});

// تشغيل السيرفر وتفعيل الـ Webhook
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Web server is listening on port ${PORT}`);
    try {
        await bot.telegram.setWebhook(`${RENDER_URL}/bot${process.env.BOT_TOKEN}`);
        console.log("✅ Telegram Webhook has been set successfully!");
    } catch (err) {
        console.error("❌ Failed to set Telegram Webhook:", err);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
