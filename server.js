const { createClient } = require('@supabase/supabase-js');
const { Telegraf, Markup } = require('telegraf');
const http = require('http'); // إضافة مكتبة الويب

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- إضافة خادم ويب بسيط لمنع الـ Timeout ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});
server.listen(10000, () => console.log('Web server is running on port 10000'));

// --- وظيفة تسجيل المكافأة ---
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
    } catch (err) { console.error(err); }
}

bot.start(async (ctx) => {
    // ... (نفس كود قائمة البدء السابق) ...
    ctx.reply('مرحباً بك في Obsidian Genesis!', Markup.inlineKeyboard([
        [Markup.button.callback('⛏ تعدين $OBSD', 'mine_menu')],
        [Markup.button.url('🛒 شراء $OBSD', 'https://dapp.quickswap.exchange/swap?type=best&from=ETH&to=0x2a2C206aC686eDD7D5b8Cf1cf325dE5261cD446F')]
    ]));
});// إضافة لوحة تحكم الأدمن
bot.command('admin', async (ctx) => {
    const adminId = 'ضع_رقم_الـ_ID_الخاص_بك_هنا'; // ضع رقم الـ ID الخاص بك هنا
    if (ctx.from.id.toString() !== adminId) return;

    ctx.reply('مرحباً بك يا أدمن في لوحة التحكم:', Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ تعديل مكافأة المهام', 'edit_reward')],
        [Markup.button.callback('📅 تغيير مدة العقود', 'edit_duration')],
        [Markup.button.callback('📊 إحصائيات المشروع', 'stats_view')]
    ]));
});

// مثال: معالجة زر إحصائيات المشروع
bot.action('stats_view', async (ctx) => {
    const { count } = await supabase.from('users').select('*', { count: 'exact' });
    ctx.reply(`📊 عدد المستخدمين المسجلين: ${count}`);
});bot.hears('id', (ctx) => {
    ctx.reply(`رقم الـ ID الخاص بك هو: ${ctx.from.id}`);
});

bot.launch();
