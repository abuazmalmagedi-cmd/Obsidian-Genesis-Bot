const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 8372337964;

http.createServer((req, res) => res.end('Bot Active')).listen(10000);

// الروابط المحدثة
const taskLinks = {
    'task_group': 'https://t.me/OBSD_Vault',
    'task_follow': 'https://x.com/ObsdVault',
    'task_like': 'https://x.com/ObsdVault',
    'task_retweet': 'https://x.com/ObsdVault',
    'task_reply': 'https://x.com/ObsdVault',
    'task_referral': 'https://t.me/OBSD_mining_bot/app'
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

// معالج المهام المحدث لفتح الروابط مباشرة
bot.action(/task_/, async (ctx) => {
    const taskType = ctx.match.input;
    const link = taskLinks[taskType] || 'https://t.me/OBSD_mining_bot/app';
    
    await ctx.answerCbQuery();

    let buttonText = '🔗 تنفيذ المهمة الآن';
    let messageText = `🚀 اضغط على الزر أدناه لتنفيذ المهمة:`;

    // تعديل نص رابط الإحالات
    if (taskType === 'task_referral') {
        messageText = `💰 انضم الى بوت تعدين OBSD السهل وحقق اكثر من 700 دولار شهريا\nJoin the easy OBSD mining bot and earn over $700 monthly!`;
        buttonText = '🚀 ابدأ التعدين الآن';
    }

    ctx.reply(messageText, Markup.inlineKeyboard([
        [Markup.button.url(buttonText, link)],
        [Markup.button.callback('✅ تم التنفيذ (تحقق)', `verify_${taskType}`)]
    ]));
});

// معالج التحقق
bot.action(/verify_task_/, async (ctx) => {
    const userId = ctx.from.id;
    const taskType = ctx.match.input.replace('verify_', '');

    const { data: user } = await supabase.from('users').select('balance, tasks_completed').eq('telegram_id', userId).single();
    if (!user) return ctx.answerCbQuery('يرجى الضغط على /start أولاً!');

    let tasks = user.tasks_completed || [];
    if (tasks.includes(taskType)) return ctx.answerCbQuery('لقد أتممت هذه المهمة مسبقاً!');

    const reward = await getTaskReward();
    await supabase.from('users').update({ 
        balance: (user.balance || 0) + reward,
        tasks_completed: [...tasks, taskType] 
    }).eq('telegram_id', userId);

    ctx.answerCbQuery(`تمت الإضافة!`);
    ctx.reply(`✅ تم التحقق بنجاح! تم إضافة ${reward} $OBSD لرصيدك.`);
});

bot.launch();
