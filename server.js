const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 8372337964; // رقم الـ ID الخاص بك

// خادم لمنع التوقف
http.createServer((req, res) => res.end('Bot Active')).listen(10000);

// لوحة تحكم الأدمن
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.reply('عذراً، أنت لست الأدمن.');
    ctx.reply('🛠 لوحة التحكم الإدارية:', Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ تعديل مكافأة المهام', 'edit_reward')],
        [Markup.button.callback('📊 إحصائيات النظام', 'view_stats')]
    ]));
});

// معالجة تغيير المكافأة (مثال بسيط)
bot.action('edit_reward', async (ctx) => {
    ctx.reply('أرسل القيمة الجديدة للمكافأة (مثلاً: 0.10):');
    // سنضيف هنا منطق حفظ القيمة في قاعدة البيانات لاحقاً
});

bot.action('view_stats', async (ctx) => {
    const { count } = await supabase.from('users').select('*', { count: 'exact' });
    ctx.reply(`📊 إجمالي المستخدمين: ${count}`);
});

bot.start(async (ctx) => {
    ctx.reply('أهلاً بك في Obsidian Genesis!', Markup.inlineKeyboard([
        [Markup.button.callback('⛏ تعدين $OBSD', 'mine_menu')],
        [Markup.button.url('🛒 شراء $OBSD', 'https://dapp.quickswap.exchange/swap?type=best&from=ETH&to=0x2a2C206aC686eDD7D5b8Cf1cf325dE5261cD446F')]
    ]));
});

bot.launch();
