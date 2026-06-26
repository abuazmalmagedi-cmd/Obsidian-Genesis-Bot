const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 8372337964;

http.createServer((req, res) => res.end('Bot Active')).listen(10000);

async function getTaskReward() {
    const { data, error } = await supabase.from('settings').select('task_reward').single();
    return error ? 0.05 : data.task_reward;
}

bot.start(async (ctx) => {
    await supabase.from('users').upsert([{ telegram_id: ctx.from.id, username: ctx.from.first_name, balance: 0 }], { onConflict: 'telegram_id' });
    
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة للبدء:', Markup.inlineKeyboard([
        [Markup.button.callback('📢 انضمام للمجموعة (إجباري)', 'task_group')],
        [Markup.button.callback('🐦 متابعة X (اختياري)', 'task_follow'), Markup.button.callback('❤️ إعجاب X (اختياري)', 'task_like')],
        [Markup.button.callback('🔄 إعادة نشر (اختياري)', 'task_retweet'), Markup.button.callback('💬 رد (اختياري)', 'task_reply')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

// معالج المهام
bot.action(/task_/, async (ctx) => {
    const reward = await getTaskReward();
    const taskType = ctx.match.input;
    
    // هنا نضيف منطق التحقق (يمكن ربطه بـ API لاحقاً)
    ctx.answerCbQuery(`تم تسجيل الطلب! ستحصل على ${reward} $OBSD بعد التحقق.`);
    ctx.reply(`✅ تم استلام طلبك لـ ${taskType.replace('task_', '')}. سيتم إضافة ${reward} $OBSD لرصيدك فور التأكد.`);
});

// لوحة التحكم وبقية الأكواد (نفس الكود السابق)
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const currentReward = await getTaskReward();
    ctx.reply(`🛠 لوحة التحكم (المكافأة: ${currentReward}):`, Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ تعديل المكافأة', 'edit_reward'), Markup.button.callback('📊 الإحصائيات', 'view_stats')]
    ]));
});

bot.action('edit_reward', (ctx) => { ctx.answerCbQuery(); ctx.reply('أرسل الرقم الجديد للمكافأة:'); });
bot.action('view_stats', async (ctx) => { ctx.answerCbQuery(); const { count } = await supabase.from('users').select('*', { count: 'exact' }); ctx.reply(`📊 عدد المستخدمين: ${count}`); });

bot.on('text', async (ctx) => {
    if (!isNaN(ctx.message.text) && ctx.from.id === ADMIN_ID) {
        await supabase.from('settings').update({ task_reward: parseFloat(ctx.message.text) }).eq('id', 1);
        ctx.reply(`✅ تم تحديث المكافأة إلى: ${ctx.message.text}`);
    }
});bot.action('task_referral', async (ctx) => {
    const userId = ctx.from.id;

    // 1. تحقق: هل أتم المستخدم هذه المهمة من قبل؟
    const { data: user } = await supabase.from('users').select('tasks_completed').eq('telegram_id', userId).single();
    
    // تأكد أن tasks_completed عبارة عن مصفوفة (Array)
    let tasks = user.tasks_completed || [];
    
    if (tasks.includes('task_referral')) {
        return ctx.answerCbQuery('لقد أتممت هذه المهمة مسبقاً!');
    }

    // 2. إذا لم يقم بها، أضف الرصيد وسجل المهمة
    await supabase.from('users').update({ 
        balance: user.balance + 0.05,
        tasks_completed: [...tasks, 'task_referral'] 
    }).eq('telegram_id', userId);

    ctx.answerCbQuery('تم إضافة 0.05$ لرصيدك!');
    ctx.reply('تم بنجاح! الرصيد مضاف.');
});

bot.launch();
