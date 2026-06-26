const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

http.createServer((req, res) => res.end('Bot Active')).listen(10000);

const taskLinks = {
    'task_group': 'https://t.me/OBSD_Vault',
    'task_follow': 'https://x.com/ObsdVault',
    'task_like': 'https://x.com/ObsdVault',
    'task_retweet': 'https://x.com/ObsdVault',
    'task_reply': 'https://x.com/ObsdVault',
    'task_referral': 'https://t.me/OBSD_mining_bot/app'
};

bot.start(async (ctx) => {
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة للبدء:', Markup.inlineKeyboard([
        [Markup.button.callback('📢 انضمام للمجموعة', 'task_group')],
        [Markup.button.callback('🐦 متابعة X', 'task_follow')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

bot.action(/task_/, async (ctx) => {
    const taskType = ctx.match.input;
    const link = taskLinks[taskType] || 'https://t.me/OBSD_mining_bot/app';
    
    let msg = taskType === 'task_referral' 
        ? '💰 انضم الى بوت تعدين OBSD السهل وحقق اكثر من 700 دولار شهريا\nJoin the easy OBSD mining bot and earn over $700 monthly!'
        : '🚀 اضغط الزر أدناه لتنفيذ المهمة:';

    ctx.reply(msg, Markup.inlineKeyboard([
        [Markup.button.url('🔗 تنفيذ المهمة', link)]
    ]));
});

bot.launch();
