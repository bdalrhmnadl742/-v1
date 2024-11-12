const TelegramBot = require('node-telegram-bot-api');
const token = '7532426677:AAGX5DMa_uD2FsIs7SjiCDrdZb0dTkqot6I';
const bot = new TelegramBot(token, { polling: true });

const ADMIN_ID = 6812536224;
const CHANNEL_USERNAME = "@HakirAldarkVIP";
const BOT_LINK = "https://t.me/HAKIRALDARK_bot";

const countries = {
    "سوريا 🇸🇾": [
        "http://5.134.200.95:60001", "http://82.137.209.190:80", "http://82.137.224.84:60001",
        "http://82.137.227.98:80", "http://82.137.227.101:60001", "http://82.137.229.216:89",
        "http://178.253.109.79:60001", "http://178.253.109.115:60001", "http://82.137.251.1:80"
    ],
    "السعودية 🇸🇦": [
        "http://185.137.246.170:60001", "http://80.120.193.106:80"
    ],
    "إيران 🇮🇷": [
        "http://178.253.109.79:60001", "http://178.253.109.115:60001", "http://82.137.209.190:80",
        "http://82.137.224.84:60001", "http://82.137.229.216:89", "http://82.137.227.98:80",
        "http://82.137.227.101:60001", "http://5.134.200.95:60001"
    ],
    "الجزائر 🇩🇿": [
        "http://196.41.245.108:80"
    ],
    "تونس 🇹🇳": [
        "http://41.226.165.107:8080", "http://41.225.15.226:8001"
    ]
};

const developerRights = "\n\nحقوق المطور: @HAKIRALDARK";
let userAttempts = {};
let userPoints = {};
let approvedUsers = new Set();
let vipUsers = new Set();
let bannedUsers = new Set();
let allUsers = new Set();

// Command handler for /start
bot.onText(/\/start/, (msg) => {
    const userId = msg.from.id;
    allUsers.add(userId);
    if (!userPoints[userId]) userPoints[userId] = 0;
    if (!userAttempts[userId]) userAttempts[userId] = 0;

    const options = {
        reply_markup: {
            inline_keyboard: [
                ...Object.keys(countries).map(country => [{ text: country, callback_data: country }]),
                [{ text: "🎯 تجميع النقاط", callback_data: "collect_points" }],
                [{ text: "🎁 العروض أو الهدايا", callback_data: "offers" }],
                [{ text: "🔢 عرض نفاذ المحاولات", callback_data: "attempts_left" }],
                ...(userId === ADMIN_ID ? [
                    [{ text: "⚙️ لوحة التحكم", callback_data: "admin_panel" }],
                    [{ text: "👑 قسم VIP", callback_data: "vip_section" }],
                    [{ text: "📋 قائمة المستخدمين", callback_data: "list_users" }]
                ] : [])
            ]
        }
    };

    bot.sendMessage(msg.chat.id, "اختر دولة:", options);
});

// Callback query handler
bot.on('callback_query', (query) => {
    const userId = query.from.id;

    if (query.data === "admin_panel") {
        if (userId === ADMIN_ID) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "➕ إضافة مستخدم إلى VIP", callback_data: "add_vip" }],
                        [{ text: "➖ إزالة مستخدم من VIP", callback_data: "remove_vip" }],
                        [{ text: "🚫 حظر مستخدم", callback_data: "ban_user" }],
                        [{ text: "🔓 إزالة حظر مستخدم", callback_data: "unban_user" }]
                    ]
                }
            };
            bot.sendMessage(query.message.chat.id, "مرحبا بك في لوحة التحكم!", options);
        } else {
            bot.answerCallbackQuery(query.id, "ليس لديك إذن للوصول إلى لوحة التحكم.");
        }
    }

    // User attempts left
    if (query.data === "attempts_left") {
        const attemptsLeft = 5 - (userAttempts[userId] || 0);
        bot.sendMessage(query.message.chat.id, `عدد المحاولات المتبقية: ${attemptsLeft}`);
    }

    // VIP Section
    if (query.data === "vip_section") {
        if (vipUsers.size > 0) {
            let vipList = [...vipUsers].map(user => `ID: ${user}`).join("\n");
            bot.sendMessage(query.message.chat.id, `قائمة مستخدمي VIP:\n${vipList}`);
        } else {
            bot.sendMessage(query.message.chat.id, "لا يوجد مستخدمون في قسم VIP.");
        }
    }

    // Show country links
    if (countries[query.data]) {
        let countryLinks = countries[query.data].join("\n");
        bot.sendMessage(query.message.chat.id, `تم العثور على الروابط:\n${countryLinks}${developerRights}`);
    }

    // Handle VIP and Ban Actions
    if (query.data === "add_vip" || query.data === "remove_vip" || query.data === "ban_user" || query.data === "unban_user") {
        bot.sendMessage(query.message.chat.id, `يرجى إرسال ID المستخدم الذي تريد ${query.data === "add_vip" ? 'إضافته' : query.data === "remove_vip" ? 'إزالته' : query.data === "ban_user" ? 'حظره' : 'إزالة حظر'}`);
        bot.on('message', handleAction(query.data));
    }
});

// Handle Add/Remove Ban/Unban actions
function handleAction(action) {
    return (message) => {
        const userId = message.text.trim();
        switch (action) {
            case "add_vip":
                vipUsers.add(userId);
                bot.replyTo(message, `تمت إضافة المستخدم ID ${userId} بنجاح إلى قسم VIP.`);
                break;
            case "remove_vip":
                vipUsers.delete(userId);
                bot.replyTo(message, `تمت إزالة المستخدم ID ${userId} من قسم VIP.`);
                break;
            case "ban_user":
                bannedUsers.add(userId);
                bot.replyTo(message, `تم حظر المستخدم ID ${userId}.`);
                break;
            case "unban_user":
                bannedUsers.delete(userId);
                bot.replyTo(message, `تمت إزالة حظر المستخدم ID ${userId}.`);
                break;
            default:
                break;
        }
    };
}

// Handle other actions (collect points, offers, etc.)
bot.onText(/\/collect_points/, (msg) => {
    bot.sendMessage(msg.chat.id, "سيتم توفير خاصية تجميع النقاط قريبًا.");
});

bot.onText(/\/offers/, (msg) => {
    bot.sendMessage(msg.chat.id, "انتظر المطور لإنشاء مسابقة لتحصل على هدايا.");
});

bot.onText(/\/list_users/, (msg) => {
    const userList = [...allUsers].map(user => `ID: ${user}`).join("\n");
    bot.sendMessage(msg.chat.id, `قائمة المستخدمين:\n${userList}`);
});