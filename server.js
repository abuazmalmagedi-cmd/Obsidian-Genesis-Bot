const { createClient } = require('@supabase/supabase-js');
const { Telegraf } = require('telegraf');

// إعداد الاتصال بـ Supabase باستخدام متغيرات البيئة من Render
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// متغير الذاكرة المؤقتة الحالي
let localDatabase = {};

// دالة تحديث الرصيد في Supabase
async function updateBalanceInDb(userId, balance) {
    const { error } = await supabase
        .from('users')
        .update({ balance: balance })
        .eq('telegram_id', userId);
    
    if (error) console.error('Supabase Error:', error);
}

// معالجة طلبات التعدين
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/api/mine' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body || '{}');
                const { userId, balance } = data;
                
                if (userId) {
                    // تحديث القاعدة أولاً
                    await updateBalanceInDb(userId, balance);
                    // تحديث الذاكرة
                    if (!localDatabase[userId]) localDatabase[userId] = { referrals: 0 };
                    localDatabase[userId].balance = balance;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        });
    } else {
        res.writeHead(200);
        res.end('Bot is running');
    }
});

server.listen(10000, () => {
    console.log('Server is running on port 10000');
    bot.launch();
});
