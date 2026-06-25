const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 8372337964;

// خادم للحفاظ على تشغيل البوت
http.createServer((req, res) => res.end('Bot Active')).listen(10000);

// دالة لجلب مكافأة المهمة الحالية من قاعدة البيانات
async function getTaskReward() {
    const { data, error } = await supabase.from('settings').select('task_reward').single();
    return error ? 0.05 : data.task_reward; // القيمة الافتراضية 0.05 إذا حدث خطأ
}

// لوحة التحكم
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const currentReward = await getTaskReward();
    ctx.reply(`🛠 لوحة التحكم الإدارية (المكافأة الحالية: ${currentReward}):`, Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ تعديل مكافأة المهام', 'edit_reward')],
        [Markup.button.callback('📊 إحصائيات النظام', 'view_stats')]
    ]));
});

// تنفيذ المهمة الاختيارية
bot.action('task_twitter', async (ctx) => {
    const reward = await getTaskReward(); // جلب القيمة ديناميكياً
    // ... هنا نضع منطق التسجيل (recordAction) ...
    ctx.answerCbQuery(`تمت المهمة! حصلت على ${reward} $OBSD`);
});// معالج زر تعديل المكافأة
bot.action('edit_reward', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('يرجى إرسال القيمة الجديدة للمكافأة كرقم فقط (مثلاً: 0.10)');
});

// معالج زر الإحصائيات
bot.action('view_stats', async (ctx) => {
    ctx.answerCbQuery();
    const { count, error } = await supabase.from('users').select('*', { count: 'exact' });
    if (error) return ctx.reply('حدث خطأ في جلب البيانات');
    ctx.reply(`📊 إجمالي عدد المستخدمين المسجلين: ${count}`);
});

bot.launch();
