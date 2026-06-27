const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// الرابط المباشر لـ QuickSwap
const QUICKSWAP_LINK = "https://dapp.quickswap.exchange/swap?type=best&from=ETH&to=0x2a2C206aC686eDD7D5b8Cf1cf325dE5261cD446F";
const MARKETING_TEXT = "انضم إلى بوت تعدين أوبيسيديان البسيط وحقق أكثر من 700 دولار شهرياً!";

// معالج البداية
bot.start(async (ctx) => {
    await ctx.reply(MARKETING_TEXT);
    await ctx.reply("اختر من القائمة أدناه:", Markup.inlineKeyboard([
        [Markup.button.callback('⛏️ بدء التعدين', 'start_mining')],
        [Markup.button.url('🛒 شراء OBSD مباشرة (QuickSwap)', QUICKSWAP_LINK)]
    ]));
});

// معالج بدء التعدين
bot.action('start_mining', async (ctx) => {
    // تسجيل العملية في قاعدة البيانات
    await supabase.from('mining_actions').insert({ telegram_id: ctx.from.id, status: 'mining' });
    
    await ctx.reply("⏳ جاري التعدين.. انتظر ساعة لتحصل على 0.20$.");
    
    // بعد انتهاء الساعة (محاكاة)
    setTimeout(async () => {
        await ctx.reply("✅ انتهى التعدين! رصيدك 0.20$. أكمل المهام لتفعيل خيار السحب:", Markup.inlineKeyboard([
            [Markup.button.url('📢 انضمام للمجموعة', 'https://t.me/OBSD_Vault')],
            [Markup.button.url('🐦 متابعة X', 'https://x.com/ObsdVault')],
            [Markup.button.callback('✅ التحقق من المهام', 'verify_tasks')]
        ]));
    }, 60000); // عدلها إلى 3600000 للعمل الفعلي (ساعة)
});

// معالج التحقق من المهام
bot.action('verify_tasks', async (ctx) => {
    const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('telegram_id', ctx.from.id)
        .eq('is_completed', true);

    if (data && data.length >= 2) {
        await ctx.reply("ممتاز! أنت الآن مؤهل للمضاعفة. قم بشراء OBSD عبر الرابط واحتفظ بها لـ 24 ساعة.", 
        Markup.inlineKeyboard([[Markup.button.url('🛒 شراء OBSD', QUICKSWAP_LINK)]]));
    } else {
        await ctx.reply("⚠️ لم تكمل جميع المهام الإجبارية بعد.");
    }
});

bot.launch().then(() => console.log('Bot is running with QuickSwap link!'));
