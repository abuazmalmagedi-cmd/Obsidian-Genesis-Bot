const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

const taskLinks = {
    'task_group': 'https://t.me/OBSD_Vault',
    'task_follow': 'https://x.com/ObsdVault',
    'task_referral': 'https://t.me/OBSD_mining_bot/app'
};

// معالج المهام مع تسجيل البيانات في الجداول
bot.action(/task_/, async (ctx) => {
    try {
        const taskType = ctx.match.input;
        const telegram_id = ctx.from.id;
        const link = taskLinks[taskType] || taskLinks['task_referral'];

        // 1. تحديث أو تسجيل المستخدم في جدول users
        await supabase.from('users').upsert({ 
            telegram_id: telegram_id,
            is_registered: true 
        }, { onConflict: 'telegram_id' });

        // 2. تسجيل حركة في جدول mining_actions (للتوثيق)
        await supabase.from('mining_actions').insert({
            telegram_id: telegram_id,
            action_type: `TASK_${taskType.toUpperCase()}`,
            reward_amount: 0.5 // المكافأة الافتراضية
        });

        // 3. عرض الرابط للمستخدم
        await ctx.reply('🚀 اضغط الزر أدناه لتنفيذ المهمة، وسيتم تحديث رصيدك تلقائياً:', Markup.inlineKeyboard([
            [Markup.button.url('🔗 تنفيذ المهمة الآن', link)]
        ]));

        await ctx.answerCbQuery();
    } catch (err) {
        console.error("خطأ في الربط مع Supabase:", err);
        ctx.reply('حدث خطأ في النظام، يرجى المحاولة لاحقاً.');
    }
});

// معالج بسيط للتأكد من حالة العقود (مثال للربط مع جدول contracts)
bot.command('status', async (ctx) => {
    const { data } = await supabase
        .from('contracts')
        .select('*')
        .eq('telegram_id', ctx.from.id)
        .eq('is_active', true);
        
    if (data && data.length > 0) {
        ctx.reply(`لديك ${data.length} عقود نشطة حالياً.`);
    } else {
        ctx.reply('لا توجد عقود نشطة في حسابك.');
    }
});

bot.launch();
