const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// البيانات الأساسية
const CONTRACT_ADDRESS = "0x2a2c206ac686edd7d5b8cf1cf325de5261cd446f";
const QUICKSWAP_LINK = `https://quickswap.exchange/#/swap?outputCurrency=${CONTRACT_ADDRESS}`;
const MARKETING_TEXT = "انضم إلى بوت تعدين أوبيسيديان البسيط وحقق أكثر من 700 دولار شهرياً!";

// معالج البداية مع دمج النص التسويقي
bot.start(async (ctx) => {
    await ctx.reply(MARKETING_TEXT);
    await ctx.reply("اختر من القائمة:", Markup.inlineKeyboard([
        [Markup.button.callback('⛏️ بدء التعدين', 'start_mining')],
        [Markup.button.url('🛒 شراء OBSD من QuickSwap', QUICKSWAP_LINK)]
    ]));
});

// معالج المهام المتقدم
bot.action('start_mining', async (ctx) => {
    // 1. تسجيل حالة البدء
    await supabase.from('mining_actions').insert({ telegram_id: ctx.from.id, status: 'mining' });
    
    await ctx.reply("بدأ التعدين.. انتظر ساعة لتحصل على 0.20$");
    
    // محاكاة انتهاء الساعة
    setTimeout(async () => {
        await ctx.reply("✅ انتهى التعدين! رصيدك 0.20$. أكمل المهام الإجبارية:", Markup.inlineKeyboard([
            [Markup.button.url('📢 المجموعة', 'https://t.me/OBSD_Vault')],
            [Markup.button.url('🐦 متابعة X', 'https://x.com/ObsdVault')],
            [Markup.button.callback('✅ التحقق من المهام', 'verify_tasks')]
        ]));
    }, 5000); // للتجربة فقط، عدلها لـ 3600000 (ساعة)
});

// معالج التحقق من المهام في Supabase
bot.action('verify_tasks', async (ctx) => {
    const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('telegram_id', ctx.from.id)
        .eq('is_completed', true);

    if (data && data.length >= 2) {
        await ctx.reply("ممتاز! أنت الآن مؤهل للمضاعفة. اشترِ ما قيمته 3$ واحتفظ بها لـ 24 ساعة.");
    } else {
        await ctx.reply("لم تكمل جميع المهام الإجبارية بعد.");
    }
});

bot.launch().then(() => console.log('Bot is running...'));
