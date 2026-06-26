const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 8372337964;

// إنشاء خادم بسيط لخدمة Render ليبقى البوت نشطاً
http.createServer((req, res) => res.end('Bot Active')).listen(10000);

// دالة لجلب قيمة المكافأة
async function getTaskReward() {
    const { data, error } = await supabase.from('settings').select('task_reward').eq('id', 1).single();
    return error ? 0.05 : data.task_reward;
}

// أمر البدء
bot.start(async (ctx) => {
    await supabase.from('users').upsert([{ 
        telegram_id: ctx.from.id, 
        username: ctx.from.first_name, 
        balance: 0,
        tasks_completed: [] 
    }], { onConflict: 'telegram_id' });
    
    ctx.reply('مرحباً بك في Obsidian Genesis! اختر مهمة للبدء:', Markup.inlineKeyboard([
        [Markup.button.callback('📢 انضمام للمجموعة (إجباري)', 'task_group')],
        [Markup.button.callback('🐦 متابعة X (اختياري)', 'task_follow'), Markup.button.callback('❤️ إعجاب X (اختياري)', 'task_like')],
        [Markup.button.callback('🔄 إعادة نشر (اختياري)', 'task_retweet'), Markup.button.callback('💬 رد (اختياري)', 'task_reply')],
        [Markup.button.callback('👥 نظام الإحالات', 'task_referral')]
    ]));
});

// معالج المهام الموحد (يمنع التكرار ويضيف الرصيد)
bot.action(/task_/, async (ctx) => {
    const userId = ctx.from.id;
    const taskType = ctx.match.input; // يحمل اسم المهمة (مثلاً task_referral)

    // 1. جلب بيانات المستخدم
    const { data: user, error } = await supabase
        .from('users')
        .select('balance, tasks_completed')
        .eq('telegram_id', userId)
        .single();

    if (error || !user) return ctx.answerCbQuery('خطأ في جلب بياناتك!');

    // 2. التحقق من التكرار
    let tasks = user.tasks_completed || [];
    if (tasks.includes(taskType)) {
        return ctx.answerCbQuery('لقد أتممت هذه المهمة مسبقاً!');
    }

    // 3. إضافة الرصيد وتحديث المهام
    const reward = await getTaskReward();
    const newBalance = (user.balance || 0) + reward;
    
    const { error: updateError } = await supabase
        .from('users')
        .update({ 
            balance: newBalance,
            tasks_completed: [...tasks, taskType] 
        })
        .eq('telegram_id', userId);

    if (updateError) return ctx.answerCbQuery('حدث خطأ أثناء تحديث رصيدك!');

    ctx.answerCbQuery(`تم إضافة ${reward} $OBSD لرصيدك!`);
    ctx.reply(`✅ تم بنجاح! تم إضافة ${reward} $OBSD لرصيدك الحالي ليصبح ${newBalance.toFixed(2)}.`);
});

// لوحة تحكم الأدمن
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const currentReward = await getTaskReward();
    ctx.reply(`🛠 لوحة التحكم (المكافأة الحالية: ${currentReward}):`, Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ تعديل المكافأة', 'edit_reward'), Markup.button.callback('📊 الإحصائيات', 'view_stats')]
    ]));
});

bot.action('edit_reward', (ctx) => { ctx.answerCbQuery(); ctx.reply('أرسل الرقم الجديد للمكافأة (مثلاً 0.05):'); });

bot.action('view_stats', async (ctx) => { 
    ctx.answerCbQuery(); 
    const { count } = await supabase.from('users').select('*', { count: 'exact' }); 
    ctx.reply(`📊 عدد المستخدمين المسجلين: ${count}`); 
});

// معالج تغيير المكافأة
bot.on('text', async (ctx) => {
    if (!isNaN(ctx.message.text) && ctx.from.id === ADMIN_ID) {
        await supabase.from('settings').update({ task_reward: parseFloat(ctx.message.text) }).eq('id', 1);
        ctx.reply(`✅ تم تحديث المكافأة إلى: ${ctx.message.text}`);
    }
});

bot.launch();
