const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 8372337964;

http.createServer((req, res) => res.end('Bot Active')).listen(10000);

// روابط المهام (استبدل الروابط أدناه بروابطك الحقيقية)
const taskLinks = {
    'task_group': 'https://t.me/your_group_link',
    'task_follow': 'https://x.com/your_account',
    'task_like': 'https://x.com/your_post/status/123456789',
    'task_retweet': 'https://x.com/your_post/status/123456789',
    'task_reply': 'https://x.com/your_post/status/123456789',
    'task_referral': 'https://t.me/your_bot_link?start=ref'
};

async function getTaskReward() {
    const { data, error } = await supabase.from('settings').select('task_reward').eq('id', 1).single();
    return error ? 0.05 : data.task_reward;
}

bot.start(async (ctx) => {
    await supabase.from('users').upsert([{ 
        telegram_id: ctx.from.id, 
        username: ctx.from.first_name, 
        balance: 0,
        tasks_completed: [] 
    }], { onConflict: 'telegram_id' });
    
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة للبدء:', Markup.inlineKeyboard([
        [Markup.button.callback('📢 انضمام للمجموعة', 'task_group')],
        [Markup.button.callback('🐦 متابعة X', 'task_follow'), Markup.button.callback('❤️ إعجاب X', 'task_like')],
        [Markup.button.callback('🔄 إعادة نشر', 'task_retweet'), Markup.button.callback('💬 رد', 'task_reply')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

// 1. مرحلة التوجيه للرابط
bot.action(/task_/, async (ctx) => {
    const taskType = ctx.match.input;
    const link = taskLinks[taskType] || 'https://x.com';

    ctx.reply(`🚀 اضغط على الزر أدناه لتنفيذ المهمة. 
بعد الانتهاء، اضغط "✅ تم التنفيذ" للحصول على المكافأة.`, 
    Markup.inlineKeyboard([
        [Markup.button.url('🔗 تنفيذ المهمة', link)],
        [Markup.button.callback(`✅ تم التنفيذ (${taskType})`, `verify_${taskType}`)]
    ]));
    ctx.answerCbQuery();
});

// 2. مرحلة التحقق من التنفيذ (إضافة الرصيد)
bot.action(/verify_task_/, async (ctx) => {
    const userId = ctx.from.id;
    const taskType = ctx.match.input.replace('verify_', ''); // تحويل verify_task_x إلى task_x

    const { data: user, error } = await supabase
        .from('users')
        .select('balance, tasks_completed')
        .eq('telegram_id', userId)
        .single();

    if (error || !user) return ctx.answerCbQuery('خطأ في جلب بياناتك!');

    let tasks = user.tasks_completed || [];
    if (tasks.includes(taskType)) {
        return ctx.answerCbQuery('لقد أتممت هذه المهمة مسبقاً!');
    }

    const reward = await getTaskReward();
    const newBalance = (user.balance || 0) + reward;
    
    await supabase.from('users').update({ 
        balance: newBalance,
        tasks_completed: [...tasks, taskType] 
    }).eq('telegram_id', userId);

    ctx.answerCbQuery(`رائع! تم إضافة ${reward} $OBSD لرصيدك.`);
    ctx.reply(`✅ تم التحقق! أضفنا ${reward} $OBSD لرصيدك.`);
});

// [بقية كود الأدمن كما هو...]
bot.command('admin', async (ctx) => { if (ctx.from.id !== ADMIN_ID) return; /* ... */ });
bot.action('edit_reward', (ctx) => { /* ... */ });
bot.action('view_stats', async (ctx) => { /* ... */ });
bot.on('text', async (ctx) => { /* ... */ });

bot.launch();
