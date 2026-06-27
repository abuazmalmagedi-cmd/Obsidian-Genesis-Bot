const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

// التأكد من المتغيرات الأساسية
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf('YOUR_TOKEN_HERE'); 

const taskLinks = {
    'task_group': 'https://t.me/OBSD_Vault',
    'task_follow': 'https://x.com/ObsdVault',
    'task_referral': 'https://t.me/OBSD_mining_bot/app'
};

// معالج البداية لتفعيل البوت
bot.start((ctx) => {
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة من القائمة:', Markup.inlineKeyboard([
        [Markup.button.callback('📢 انضمام للمجموعة', 'task_group')],
        [Markup.button.callback('🐦 متابعة X', 'task_follow')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

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

        // 2. تسجيل حركة في جدول mining_actions
        await supabase.from('mining_actions').insert({
            telegram_id: telegram_id,
            action_type: `TASK_${taskType.toUpperCase()}`,
            reward_amount: 0.5 
        });

        // 3. عرض الرابط للمستخدم
        await ctx.reply('🚀 اضغط الزر أدناه لتنفيذ المهمة:', Markup.inlineKeyboard([
            [Markup.button.url('🔗 تنفيذ المهمة الآن', link)]
        ]));

        await ctx.answerCbQuery();
    } catch (err) {
        console.error("خطأ في الربط مع Supabase:", err);
        ctx.reply('حدث خطأ في النظام، يرجى المحاولة لاحقاً.');
    }
});

// معالج حالة العقود
bot.command('status', async (ctx) => {
    try {
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
    } catch (err) {
        console.error("خطأ في جلب بيانات العقود:", err);
    }
});

bot.launch();
