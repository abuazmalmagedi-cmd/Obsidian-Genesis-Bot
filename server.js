require('dotenv').config();
const { Telegraf } = require('telegraf');
const http = require('http');

// تفعيل البوت باستخدام التوكن
const bot = new Telegraf(process.env.BOT_TOKEN);

// رابط السيرفر الخاص بك على Render (تأكد من كتابته بشكل صحيح)
const RENDER_URL = 'https://obsidian-genesis-bot-huw2.onrender.com';

// كود أوامر وتفاعلات البوت
bot.start((ctx) => {
    ctx.reply('مرحباً بك في بوت Obsidian Genesis ($OBSD)!');
});

// إعداد سيرفر الويب وتحديد المنفذ لـ Render
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // هذا السطر يربط طلبات تليجرام القادمة بالـ Webhook الخاص بالبوت
    if (req.url === `/bot${process.env.BOT_TOKEN}`) {
        bot.handleUpdate(JSON.parse(req.body || '{}'), res);
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OBSD Bot Web Service is Running...\n');
});

// تشغيل السيرفر وتفعيل الـ Webhook برمجياً مع تليجرام
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Web server is listening on port ${PORT}`);
    try {
        await bot.telegram.setWebhook(`${RENDER_URL}/bot${process.env.BOT_TOKEN}`);
        console.log("✅ Telegram Webhook has been set successfully!");
    } catch (err) {
        console.error("❌ Failed to set Telegram Webhook:", err);
    }
});

// إوقف آمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));