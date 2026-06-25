const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');

// التأكد من وجود المتغيرات
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("Missing Supabase configuration");
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// تسجيل المهام
async function recordAction(userId, actionType, reward) {
    try {
        await supabase.from('mining_actions').insert([{ 
            telegram_id: userId, 
            action_type: actionType, 
            reward_amount: reward 
        }]);

        const { data: user } = await supabase.from('users').select('balance').eq('telegram_id', userId).single();
        const newBalance = (user?.balance || 0) + reward;
        await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', userId);
    } catch (err) {
        console.error('Error in recordAction:', err);
    }
}

bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const { data: user } = await supabase.from('users').select('is_registered').eq('telegram_id', userId).single();
    
    if (!user || !user.is_registered) {
        ctx.reply('مرحباً بك! لإتمام التسجيل والحصول على مكافأتك الأولى، يرجى القيام بالتالي:', Markup.inlineKeyboard([
            [Markup.button.url('تابعنا على X', 'https://x.com/@ObsdVault')],
            [Markup.button.url('انضم لمجموعتنا', 'https://t.me/OBSD_Vault')],
            [Markup.button.callback('تمت المهام', 'check_registration')]
        ]));
    } else {
        ctx.reply('القائمة الرئيسية:', Markup.inlineKeyboard([
            [Markup.button.callback('⛏ تعدين $OBSD', 'mine_menu')],
            [Markup.button.url('🛒 شراء $OBSD', 'https://dapp.quickswap.exchange/swap?type=best&from=ETH&to=0x2a2C206aC686eDD7D5b8Cf1cf325dE5261cD446F')],
            [Markup.button.callback('💰 الخزنة والعقود', 'contracts_menu')]
        ]));
    }
});

bot.action('check_registration', async (ctx) => {
    await supabase.from('users').update({ is_registered: true }).eq('telegram_id', ctx.from.id);
    ctx.answerCbQuery('تم التسجيل بنجاح!');
    ctx.reply('أنت الآن مسجل رسمياً. يمكنك التعدين الآن.');
});

bot.launch();
