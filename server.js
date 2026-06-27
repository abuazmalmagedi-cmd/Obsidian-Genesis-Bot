const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

const taskLinks = {
    'task_group': 'https://t.me/OBSD_Vault',
    'task_follow': 'https://x.com/ObsdVault',
    'task_referral': 'https://t.me/share/url?url=https://t.me/YourBotUsername'
};

// 1. معالج رسالة البداية (تصحيح الروابط)
bot.start((ctx) => {
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة من القائمة أدناه:', Markup.inlineKeyboard([
        [Markup.button.url('📢 انضمام للمجموعة', taskLinks['task_group'])],
        [Markup.button.url('🐦 متابعة X', taskLinks['task_follow'])],
        [Markup.button.url('👥 نظام الإحالات', taskLinks['task_referral'])]
    ]));
});

// 2. معالج المهام (يعمل في الخلفية عند الحاجة)
bot.action(/task_/, async (ctx) => {
    try {
        const taskType = ctx.match[0];
        const telegram_id = ctx.from.id;

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

        await ctx.answerCbQuery('تم تسجيل محاولتك!');
    } catch (err) {
        console.error("خطأ في تنفيذ المهمة:", err);
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
        ctx.reply(data && data.length > 0 ? `لديك ${data.length} عقود نشطة حالياً.` : 'لا توجد عقود نشطة في حسابك حالياً.');
    } catch (err) {
        console.error("خطأ في جلب بيانات العقود:", err);
    }
});

bot.launch().then(() => console.log('Bot is running successfully!'));
