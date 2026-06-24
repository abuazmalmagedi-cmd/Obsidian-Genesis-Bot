require('dotenv').config();
const { Telegraf } = require('telegraf');
const http = require('http');

// تفعيل البوت باستخدام التوكن من ملف البيئة
const bot = new Telegraf(process.env.BOT_TOKEN);

// كود أوامر وتفاعلات البوت الخاص بك يوضع هنا
bot.start((ctx) => {
    ctx.reply('مرحباً بك في بوت Obsidian Genesis ($OBSD)!');
});

// تشغيل البوت واستقبال البيانات
bot.launch().then(() => {
    console.log("🚀 تم تشغيل بوت OBSD بنجاح وهو جاهز تماماً!");
}).catch((err) => {
    console.error("خطأ في تشغيل البوت:", err);
});

// إيقاف آمن عند إغلاق السيرفر
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// إعداد سيرفر الويب وتحديد المنفذ لـ Render ومنع الـ Port Scan Timeout
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OBSD Bot Web Service is Running...\n');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Web server is listening on port ${PORT}`);
});