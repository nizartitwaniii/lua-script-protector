# Lua Script Protection Bot

نظام حماية سكربتات Lua مع بوت تليجرام ولوحة تحكم ويب لحماية وتوزيع السكربتات بأمان.

## المميزات

- 🤖 **بوت تليجرام** - حماية السكربتات باللغة العربية
- 🛡️ **حماية متقدمة** - فحص User-Agent للتأكد من الوصول عبر Roblox فقط
- 📊 **لوحة تحكم** - مراقبة النشاط والإحصائيات
- 🔒 **روابط آمنة** - توليد روابط فريدة لكل سكربت
- 📈 **إحصائيات مفصلة** - تتبع التحميلات والنشاط

## التثبيت

### 1. استنساخ المستودع
```bash
git clone https://github.com/yourusername/lua-script-protector.git
cd lua-script-protector
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. إعداد متغيرات البيئة
```bash
# إنشاء ملف .env
cp .env.example .env

# تعديل الملف بالمعلومات الصحيحة
TELEGRAM_BOT_TOKEN=your_bot_token_here
KOYEB_PUBLIC_DOMAIN=https://your-app.koyeb.app
```

### 4. تشغيل التطبيق
```bash
# التطوير
npm run dev

# الإنتاج
npm run build
npm start
```

## النشر على KOYEB

### الطريقة 1: استخدام GitHub
1. رفع المشروع إلى GitHub
2. ربط KOYEB بالمستودع
3. إضافة متغيرات البيئة في إعدادات KOYEB

### الطريقة 2: استخدام Koyeb CLI
```bash
# تثبيت Koyeb CLI
npm install -g @koyeb/cli

# تسجيل الدخول
koyeb login

# نشر التطبيق
koyeb app deploy --name lua-script-protector .
```

## الأوامر المتاحة

### أوامر البوت
- `/start` - بدء استخدام البوت
- `/حماية [كود السكربت]` - حماية سكربت جديد
- `/قائمتي` - عرض قائمة السكربتات
- `/معلومات [معرف السكربت]` - عرض معلومات سكربت
- `/احصائيات` - عرض إحصائيات البوت

### أوامر NPM
- `npm run dev` - تشغيل التطوير
- `npm run build` - بناء التطبيق للإنتاج
- `npm start` - تشغيل الإنتاج
- `npm run db:push` - تحديث قاعدة البيانات (إذا كانت متاحة)

## البنية التقنية

### الخادم (Backend)
- **Node.js + Express** - خادم API
- **TypeScript** - للنوع الآمن
- **node-telegram-bot-api** - تكامل تليجرام
- **Drizzle ORM** - إدارة قاعدة البيانات

### العميل (Frontend)
- **React 18** - واجهة المستخدم
- **Vite** - أداة البناء
- **Tailwind CSS** - تصميم الواجهة
- **shadcn/ui** - مكونات الواجهة
- **TanStack Query** - إدارة البيانات

## المتغيرات المطلوبة

```env
# إجباري
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# اختياري
KOYEB_PUBLIC_DOMAIN=https://your-app.koyeb.app
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=5000
```

## الأمان

- ✅ فحص User-Agent للتأكد من الوصول عبر Roblox
- ✅ معرفات فريدة لكل سكربت
- ✅ حماية من الوصول غير المصرح
- ✅ تسجيل جميع الأنشطة
- ✅ التحقق من المستخدمين

## الدعم

للحصول على المساعدة:
1. تحقق من قسم Issues في GitHub
2. اطلع على الوثائق في المستودع
3. تواصل مع المطور

## الرخصة

MIT License - يمكن استخدام المشروع بحرية مع الإشارة للمصدر.