const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

// إعدادات الاتصال
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf('أدخل_التوكن_الجديد_هنا'); 

const taskLinks = {
    'task_group': 'https://t.me/OBSD_Vault',
    'task_follow': 'https://x.com/ObsdVault',
    'task_referral': 'https://t.me/OBSD_mining_bot/app'
};

// رسالة البداية
bot.start((ctx) => {
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة من القائمة:', Markup.inlineKeyboard([
        [Markup.button.callback('📢 انضمام للمجموعة', 'task_group')],
        [Markup.button.callback('🐦 متابعة X', 'task_follow')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

// معالج المهام
bot.action(/task_/, async (ctx) => {
    try {
        const taskType = ctx.match.input;
        const telegram_id = ctx.from.id;
        const link = taskLinks[taskType] || taskLinks['task_referral'];

        // 1. تحديث بيانات المستخدم
        await supabase.from('users').upsert({ 
            telegram_id: telegram_id,
            is_registered: true 
        }, { onConflict: 'telegram_id' });

        // 2. تسجيل حركة التعدين
        await supabase.from('mining_actions').insert({
            telegram_id: telegram_id,
            action_type: `TASK_${taskType.toUpperCase()}`,
            reward_amount: 0.5 
        });

        // 3. زر التنفيذ
        await ctx.reply('🚀 اضغط الزر أدناه لتنفيذ المهمة:', Markup.inlineKeyboard([
            [Markup.button.url('🔗 تنفيذ المهمة الآن', link)]
        ]));

        await ctx.answerCbQuery();
    } catch (err) {
        console.error("خطأ في النظام:", err);
        ctx.reply('حدث خطأ تقني، يرجى المحاولة لاحقاً.');
    }
});

// تشغيل البوت
bot.launch().then(() => console.log('Bot is running...'));
const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

// تأكد من استخدام process.env لقراءة المتغيرات من إعدادات Render
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
