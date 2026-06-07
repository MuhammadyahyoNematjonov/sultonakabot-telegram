# 🤖 Telegram Bot — NestJS + Prisma + SQLite

## ⚡ O'RNATISH

### 1. Kutubxonalarni o'rnatish
```bash
npm install
```

### 2. .env faylini yaratish
```bash
cp .env.example .env
```

`.env` faylini oching va to'ldiring:
```env
TELEGRAM_BOT_TOKEN=7xxxxxxxxx:AAFxxxxxxxxxxxxxxxxx
ADMIN_IDS=123456789
ADMIN_LOGIN=admin
ADMIN_PASSWORD=StrongP@ss123
DATABASE_URL="file:./bot.db"
```

### 3. Database yaratish
```bash
npx prisma generate
npx prisma db push
```

### 4. Ishga tushirish

**Development (hot-reload):**
```bash
npm run start:dev
```

**Production:**
```bash
npm run build
npm run start:prod
```

---

## 🆔 TOKEN VA ID OLISH

| Nima kerak | Qayerdan |
|-----------|---------|
| Bot Token | @BotFather → `/newbot` |
| Telegram ID | @userinfobot → `/start` yuboring |

---

## 🔄 BOT OQIMI

```
Foydalanuvchi:
  /start
    ↓
  Ism Familiya yozadi
    ↓
  Telefon raqam yuboradi (tugma yoki qo'lda)
    ↓
  Asosiy menyu:
    [📝 Ariza berish]  [🔑 Login (Admin)]
    ↓
  Bo'lim tanlaydi (6 ta)
    ↓
  Ichki bo'lim tanlaydi (2-3 ta)
    ↓
  Ariza matnini yozadi
    ↓
  ✅ "Qabul qilindi" + Admin ga avtomatik boradi

Admin:
  [🔑 Login] → login → parol
    ↓
  Admin panel:
    [📋 Barcha Arizalar]
    [⏳ Javob kutayotganlar]
    ↓
  Ariza tanlaydi → [✍️ Javob yozish]
    ↓
  ✅ Foydalanuvchiga avtomatik boradi
```

---

## ☁️ PM2 BILAN SERVERDA ISHLATISH

```bash
npm install -g pm2
npm run build
pm2 start dist/main.js --name telegram-bot
pm2 save
pm2 startup
```

---

## 🗃️ DATABASE KO'RISH

```bash
npx prisma studio
# http://localhost:5555 da vizual interfeys ochiladi
```

---

## 📂 LOYIHA TUZILMASI

```
telegram-bot/
├── src/
│   ├── bot/
│   │   ├── bot.update.ts       ← Barcha bot handlerlari
│   │   ├── bot.module.ts       ← Bot moduli
│   │   ├── bot.constants.ts    ← Bo'limlar, klaviaturalar
│   │   └── session.service.ts  ← Foydalanuvchi holati (xotira)
│   ├── database/
│   │   ├── database.service.ts ← Prisma client
│   │   └── database.module.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
└── tsconfig.json
```
