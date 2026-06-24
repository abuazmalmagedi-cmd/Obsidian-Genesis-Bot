const { Telegraf, Markup } = require('telegraf')
const { createClient } = require('@supabase/supabase-js');

// المفاتيح المباشرة للتشغيل المستقر محلياً وسحابياً
const SUPABASE_URL = "https://wrxwkotohlkctltbxpui.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PfCXKYdU6a2sNI9Jnp3rQg_zboSU_A6";
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_TOKEN;

// ربط قاعدة البيانات والبوت
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// أمر التشغيل الرئيسي /start
bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || 'No_Username';

    try {
        // 1. التحقق من وجود المستخدم في قاعدة البيانات
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        // 2. إذا كان مستخدم جديد، نقوم بتسجيله فوراً
        if (!user && !error) {
            await supabase
                .from('users')
                .insert([{ 
                    telegram_id: telegramId, 
                    x_username: username,
                    mining_status: 'NOT_STARTED',
                    referral_count: 0
                }]);
        }

        // 3. إرسال رسالة الترحيب مع زر رابط عادي (تجاوزاً لخطأ تيليجرام المؤقت)
        ctx.reply(`أهلاً بك في بوت تعدين عملة OBSD! 🚀\n\nاضغط على الزر أدناه للانتقال إلى واجهة التعدين الرسمية وبدء جمع النقاط.`, 
            Markup.inlineKeyboard([
                [Markup.button.url('🪓 ابدأ التعدين الآن', 'https://t.me/OBSD_mining_bot/app')]
            ])
        );

    } catch (err) {
        console.error("حدث خطأ أثناء المعالجة:", err);
    }
});

// تشغيل البوت واستقبال البيانات
bot.launch().then(() => {
    console.log("🚀 تم تشغيل بوت OBSD بنجاح وهو جاهز تماماً!");
});

// إيقاف آمن عند إغلاق السيرفر
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));// خادم وهمي لحل مشكلة الـ Port في Render ومنع إيقاف البوت
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OBSD Bot is Running...\n');
}).listen(PORT, () => {
    console.log(`📡 Web server is listening on port ${PORT}`);
});