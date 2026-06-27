const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// معالج المهام المحدث ليعمل مع اسم العمود الجديد telegram_id
bot.action(/task_/, async (ctx) => {
    const telegram_id = ctx.from.id; // نستخدم معرف التيليجرام مباشرة
    const taskType = ctx.match.input;
    
    // هنا البوت سيقوم بالاستعلام باستخدام telegram_id فقط
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('telegram_id', telegram_id); // الربط الجديد

    if (error) {
        console.error("Error fetching data:", error);
        return ctx.answerCbQuery('خطأ في الاتصال بقاعدة البيانات!');
    }

    ctx.answerCbQuery();
    ctx.reply('🚀 جاري تنفيذ المهمة...');
});

bot.launch();
