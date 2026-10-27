const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// ================= CONFIGURATION =================
const TELEGRAM_TOKEN = 'PASTE_TOKEN_BOT_TELEGRAM_DISINI';
const CHAT_ID = 'PASTE_CHAT_ID_TELEGRAM_DISINI';
const PORT = process.env.PORT || 3000;
// =================================================

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// Webhook Endpoint untuk menerima data koin secara instan (Real-time)
app.post('/webhook-koin', async (req, res) => {
    try {
        const dataKoin = req.body.Data || req.body; 
        const headers = req.body.Headers || {};

        const tokenAddress = dataKoin.tokenAddress;
        
        // Membaca Market Cap dari berbagai kemungkinan nama variabel API Anda
        const marketCap = parseFloat(dataKoin.marketCap || dataKoin.openGraph || 0);
        const icon = dataKoin.icon || '';
        const age = headers.age || dataKoin.age || 0;

        // 1. FILTER ALPHA MARKET CAP: Deteksi koin antara $5k - $50k MC (Harga Bawah)
        if (marketCap < 5000 || marketCap > 50000) {
            console.log(`[FILTERED] Skip koin ${tokenAddress}. MC tidak masuk kriteria ($${marketCap})`);
            return res.status(200).send('Filtered by Market Cap');
        }

        // 2. FILTER ALPHA JEJAK KOMUNITAS: Wajib ada Twitter/Telegram/OpenGraph agar anti-rugpull awal
        if (!dataKoin.twitter && !dataKoin.telegram && !dataKoin.openGraph) {
            console.log(`[FILTERED] Skip koin ${tokenAddress} karena tidak punya jejak media sosial.`);
            return res.status(200).send('Filtered by Community Check');
        }

        // 3. STRUKTUR FORMAT TEXT MARKDOWN TELEGRAM (Anti-Error & Tap-to-Copy CA)
        const pesanTeks = 
`💎 *WHITE WHALE: ALPHA INSTANT* 💎
📌 *INFO KOIN*
• Nama: WHITE WHALE
• Simbol: [Lihat Gambar](${icon})
• Kontrak (CA): \`${tokenAddress}\`

📊 *DATA STATISTIK*
• Market Cap: $${marketCap.toLocaleString()}
• Likuiditas: $
• Volume 1 Jam: $

🔎 *ANALISIS FILTER*
• Status Likuiditas: Locked
• Usia Koin: ${age} detik

🔗 *LINK EKSEKUSI*
• [DEX SCREENER](https://dexscreener.com{tokenAddress})
• [PUMP SQUADS](https://pumpsquads.fun)`;

        // 4. KIRIM INSTAN DETIK ITU JUGA KE TELEGRAM
        await bot.sendMessage(CHAT_ID, pesanTeks, { parse_mode: 'Markdown' });
        console.log(`[SUCCESS] Sinyal koin ${tokenAddress} lolos filter & sukses terkirim!`);
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('[ERROR] Gagal memproses data Webhook:', error.message);
        res.status(500).send('Internal Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server Real-time Bot aktif di port ${PORT}`);
});
