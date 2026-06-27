const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// معالج المهام مع الحماية (try-catch)
bot.action(/task_/, async (ctx) => {
    try {
        const taskType = ctx.match.input;
        const telegram_id = ctx.from.id;

        // التحقق من وجود المهمة في الرابط (تجنب الخطأ)
        const links = {
            'task_group': 'https://t.me/OBSD_Vault',
            'task_follow': 'https://x.com/ObsdVault',
            'task_referral': 'https://t.me/OBSD_mining_bot/app'
        };

        const link = links[taskType] || 'https://t.me/OBSD_mining_bot/app';

        // إرسال زر يفتح الرابط فوراً
        await ctx.reply('🚀 اضغط الزر أدناه لتنفيذ المهمة:', Markup.inlineKeyboard([
            [Markup.button.url('🔗 تنفيذ المهمة الآن', link)]
        ]));

        await ctx.answerCbQuery();
    } catch (err) {
        console.error("خطأ في معالجة المهمة:", err);
        ctx.reply('عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى.');
    }
});

bot.launch();
