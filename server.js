<div id="mining-container" style="background-color: #0d0d0d; color: #ffffff; font-family: sans-serif; text-align: center; padding: 20px; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; direction: rtl;">
    <div>
        <div style="background-color: #1a1a1a; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #333;">
            <h2 style="margin: 0; font-size: 16px; color: #aaaaaa;">رصيدك الحالي</h2>
            <div style="font-size: 32px; font-weight: bold; color: #ff3366; margin: 5px 0;">
                <span id="obsd-balance">0.00</span> <span style="font-size: 18px;">OBSD</span>
            </div>
            <p id="user-display" style="margin: 0; font-size: 14px; color: #888;">جاري جلب حسابك من الشبكة...</p>
        </div>
    </div>

    <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 40px 0;">
        <button id="mine-btn" onclick="startMiningProcess()" style="width: 180px; height: 180px; border-radius: 50%; background: linear-gradient(145deg, #ff3366, #cc0033); border: 5px solid #222; color: #fff; font-size: 20px; font-weight: bold; box-shadow: 0 0 20px rgba(255, 51, 102, 0.4); cursor: pointer; transition: transform 0.2s;">
            ابدأ التعدين
        </button>
        <div id="timer-display" style="margin-top: 20px; font-size: 24px; font-weight: bold; display: none; color: #00ffcc;">24:00:00</div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="background-color: #161616; padding: 12px; border-radius: 10px; border: 1px solid #292929;">
            <span style="display: block; font-size: 12px; color: #777;">الإحالات</span>
            <span id="referrals-count" style="font-size: 18px; font-weight: bold;">0</span>
        </div>
        <div style="background-color: #161616; padding: 12px; border-radius: 10px; border: 1px solid #292929;">
            <span style="display: block; font-size: 12px; color: #777;">حالة التعدين</span>
            <span id="status-text" style="font-size: 14px; color: #ff3366;">متوقف</span>
        </div>
    </div>
</div>

<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script>
    const API_BASE = "https://obsidian-genesis-bot-huw2.onrender.com";
    let currentUserId = null;

    function initAppConfiguration() {
        const userElement = document.getElementById("user-display");
        const balanceElement = document.getElementById("obsd-balance");
        const referralElement = document.getElementById("referrals-count");
        
        let tg = window.Telegram?.WebApp;
        if (!tg && window.parent && window.parent.Telegram) {
            tg = window.parent.Telegram.WebApp;
        }

        if (tg) {
            try {
                tg.ready();
                tg.expand();
                const user = tg.initDataUnsafe?.user;
                if (user) {
                    currentUserId = user.id;
                    const username = user.username ? `@${user.username}` : user.first_name;
                    if (userElement) userElement.innerText = `المستخدم: ${username}`;
                    
                    // سحب البيانات الحقيقية من سيرفر Render
                    fetch(`${API_BASE}/api/user?userId=${currentUserId}`)
                        .then(res => res.json())
                        .then(data => {
                            if(data) {
                                if(balanceElement) balanceElement.innerText = parseFloat(data.balance || 0).toFixed(2);
                                if(referralElement) referralElement.innerText = data.referrals || 0;
                            }
                        }).catch(err => console.error("Error loading user data:", err));
                    return; 
                }
            } catch (e) { console.error(e); }
        }
        if (userElement) userElement.innerText = `المستخدم: تعدين OBSD`;
    }

    document.addEventListener("DOMContentLoaded", initAppConfiguration);

    function startMiningProcess() {
        if (!currentUserId) {
            alert("عذراً، لم يتم التعرف على حساب تليجرام الخاص بك لتوثيق التعدين.");
            return;
        }

        const btn = document.getElementById('mine-btn');
        const timer = document.getElementById('timer-display');
        const status = document.getElementById('status-text');
        const balance = document.getElementById('obsd-balance');

        btn.disabled = true;
        btn.style.background = '#333';
        btn.innerText = 'جاري التعدين...';
        status.innerText = 'نشط حالياً';
        status.style.color = '#00ffcc';
        timer.style.display = 'block';

        let totalSeconds = 86400; // 24 ساعة

        const countdown = setInterval(() => {
            totalSeconds--;
            let hrs = Math.floor(totalSeconds / 3600);
            let mins = Math.floor((totalSeconds % 3600) / 60);
            let secs = totalSeconds % 60;

            timer.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            let currentBal = parseFloat(balance.innerText);
            if(!isNaN(currentBal)) {
                let newBalance = (currentBal + 0.01).toFixed(2);
                balance.innerText = newBalance;

                // إرسال التحديث كل دقيقة للسيرفر لحفظ الرصيد أولاً بأول
                if (totalSeconds % 60 === 0 || totalSeconds <= 1) {
                    fetch(`${API_BASE}/api/mine`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUserId, balance: newBalance })
                    }).catch(e => console.error("Sync error:", e));
                }
            }

            if (totalSeconds <= 0) {
                clearInterval(countdown);
                btn.disabled = false;
                btn.style.background = 'linear-gradient(145deg, #ff3366, #cc0033)';
                btn.innerText = 'ابدأ التعدين';
                timer.style.display = 'none';
                status.innerText = 'متوقف';
                status.style.color = '#ff3366';
            }
        }, 1000);
    }
</script>
