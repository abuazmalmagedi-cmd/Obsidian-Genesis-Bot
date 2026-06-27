const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

// التأكد من أن المتغيرات مقروءة من Render
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

const taskLinks = {
    'task_group': 'https://t.me/OBSD_Vault',
    'task_follow': 'https://x.com/ObsdVault',
    'task_referral': 'https://t.me/OBSD_mining_bot/app'
};

// 1. معالج رسالة البداية
bot.start((ctx) => {
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة من القائمة أدناه:', Markup.inlineKeyboard([
        [Markup.button.callback('📢 انضمام للمجموعة', 'task_group')],
        [Markup.button.callback('🐦 متابعة X', 'task_follow')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

// 2. معالج المهام (تم تصحيح الأقواس هنا لضمان عدم وجود أخطاء في السطر 57)
bot.action(/task_/, async (ctx) => {
    try {
        const taskType = ctx.match[0]; // تم تعديلها لتكون أكثر دقة
        const telegram_id = ctx.from.id;
        const link = taskLinks[taskType] || taskLinks['task_referral'];

        // تسجيل البيانات في Supabase
        await supabase.from('users').upsert({ 
            telegram_id: telegram_id,
            is_registered: true 
        }, { onConflict: 'telegram_id' });

        await supabase.from('mining_actions').insert({
            telegram_id: telegram_id,
            action_type: `TASK_${taskType.toUpperCase()}`,
            reward_amount: 0.5 
        });

        // الرد بزر فتح الرابط
        await ctx.reply('🚀 اضغط الزر أدناه لتنفيذ المهمة:', Markup.inlineKeyboard([
            [Markup.button.url('🔗 تنفيذ المهمة الآن', link)]
        ]));

        await ctx.answerCbQuery();
    } catch (err) {
        console.error("خطأ في تنفيذ المهمة:", err);
        ctx.reply('حدث خطأ في النظام، يرجى المحاولة لاحقاً.');
    }
});

// 3. معالج حالة العقود
bot.command('status', async (ctx) => {
    try {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('telegram_id', ctx.from.id)
            .eq('is_active', true);
            
        if (error) throw error;

        if (data && data.length > 0) {
            ctx.reply(`لديك ${data.length} عقود نشطة حالياً.`);
        } else {
            ctx.reply('لا توجد عقود نشطة في حسابك حالياً.');
        }
    } catch (err) {
        console.error("خطأ في جلب بيانات العقود:", err);
        ctx.reply('عذراً، لم نتمكن من جلب حالة عقودك حالياً.');
    }
});

// تشغيل البوت
bot.launch()
    .then(() => console.log('Bot is running successfully!'))
    .catch((err) => console.error('Failed to launch bot:', err));
