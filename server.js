const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 8372337964;

http.createServer((req, res) => res.end('Bot Active')).listen(10000);

// روابط المهام الخاصة بك - ضع روابطك هنا
const taskLinks = {
    'task_group': 'https://t.me/ObsidianGenesisGroup', // ضع رابط مجموعتك
    'task_follow': 'https://x.com/ObsidianGenesis',   // ضع رابط حسابك X
    'task_like': 'https://x.com/ObsidianGenesis/status/12345',
    'task_retweet': 'https://x.com/ObsidianGenesis/status/12345',
    'task_reply': 'https://x.com/ObsidianGenesis/status/12345',
    'task_referral': 'https://t.me/ObsidianGenesisBot'
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
        [Markup.button.callback('📢 انضمام للمجموعة', https://t.me/OBSD_Vault')],
        [Markup.button.callback('🐦 متابعة X', https://x.com/@ObsdVault ), Markup.button.callback('❤️ إعجاب X', 'task_like')],
        [Markup.button.callback('🔄 إعادة نشر', 'https://x.com/@ObsdVault'), Markup.button.callback('💬 رد', 'task_reply')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

// معالج التوجيه: عند الضغط على المهمة يفتح الرابط
bot.action(/task_/, async (ctx) => {
    const taskType = ctx.match.input;
    const link = taskLinks[taskType] || 'https://x.com';

    await ctx.answerCbQuery(); // إغلاق حالة التحميل
    
    ctx.reply(`🚀 اضغط على الزر أدناه لتنفيذ المهمة:`, 
    Markup.inlineKeyboard([
        [Markup.button.url('🔗 تنفيذ المهمة الآن', link)],
        [Markup.button.callback('✅ تم التنفيذ (تحقق)', `verify_${taskType}`)]
    ]));
});

// معالج التحقق: عند الضغط على "تم التنفيذ" يضيف الرصيد
bot.action(/verify_task_/, async (ctx) => {
    const userId = ctx.from.id;
    const taskType = ctx.match.input.replace('verify_', ''); 

    const { data: user, error } = await supabase.from('users').select('balance, tasks_completed').eq('telegram_id', userId).single();
    if (error || !user) return ctx.answerCbQuery('حدث خطأ، حاول مرة أخرى.');

    let tasks = user.tasks_completed || [];
    if (tasks.includes(taskType)) return ctx.answerCbQuery('لقد أتممت هذه المهمة مسبقاً!');

    const reward = await getTaskReward();
    await supabase.from('users').update({ 
        balance: (user.balance || 0) + reward,
        tasks_completed: [...tasks, taskType] 
    }).eq('telegram_id', userId);

    ctx.answerCbQuery(`تم إضافة ${reward} $OBSD لرصيدك!`);
    ctx.reply(`✅ تم التحقق بنجاح! تم إضافة ${reward} $OBSD.`);
});

// إعدادات الأدمن
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.reply('🛠 لوحة التحكم:', Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ تعديل المكافأة', 'edit_reward'), Markup.button.callback('📊 الإحصائيات', 'view_stats')]
    ]));
});

bot.action('edit_reward', (ctx) => { ctx.answerCbQuery(); ctx.reply('أرسل الرقم الجديد للمكافأة:'); });
bot.action('view_stats', async (ctx) => { 
    const { count } = await supabase.from('users').select('*', { count: 'exact' }); 
    ctx.reply(`📊 عدد المستخدمين: ${count}`); 
});

bot.on('text', async (ctx) => {
    if (!isNaN(ctx.message.text) && ctx.from.id === ADMIN_ID) {
        await supabase.from('settings').update({ task_reward: parseFloat(ctx.message.text) }).eq('id', 1);
        ctx.reply(`✅ تم تحديث المكافأة إلى: ${ctx.message.text}`);
    }
});

bot.launch();
