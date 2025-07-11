import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import crypto from 'crypto';

class TelegramBotService {
  private bot: TelegramBot;
  private isConnected = false;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN || '7619814993:AAFSs9zig8B0vzqTmWpRPUNsYVXQ8QOEunM';
    this.bot = new TelegramBot(token, { polling: { interval: 1000, autoStart: true } });
    this.setupEventHandlers();
    this.initializeBot();
  }

  private async initializeBot() {
    try {
      const me = await this.bot.getMe();
      this.isConnected = true;
      
      await storage.updateBotStatus({
        isConnected: true,
        botUsername: `@${me.username}`,
        lastActivity: new Date().toISOString()
      });
      
      console.log(`🤖 Bot connected successfully: @${me.username}`);
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      this.isConnected = false;
    }
  }

  private setupEventHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const welcomeMessage = `
🛡️ **مرحباً بك في بوت حماية السكربتات!**

**الأوامر المتاحة:**

📝 **/حماية** \`كود_السكربت\` - حماية وحفظ سكربت جديد
📜 **/قائمتي** - عرض قائمة سكربتاتك المحفوظة
📄 **/معلومات** \`معرف_السكربت\` - عرض معلومات سكربت معين
📊 **/احصائيات** - عرض إحصائيات البوت
ℹ️ **/مساعدة** - عرض هذه الرسالة

**مثال:**
\`/حماية print("Hello World")\`

سيتم إنشاء رابط محمي لسكربتك يمكن استخدامه في Roblox!

🌐 **رابط الخدمة:** ${process.env.KOYEB_PUBLIC_DOMAIN || 'http://localhost:5000'}
`;

      await this.bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
      await this.logActivity(msg.from?.id, null, 'bot_start', 'User started the bot');
    });

    // Protect script command
    this.bot.onText(/\/حماية (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const scriptContent = match?.[1];

      if (!scriptContent) {
        await this.bot.sendMessage(chatId, '❌ يرجى إدخال كود السكربت بعد الأمر /حماية');
        return;
      }

      try {
        // Get or create user
        let user = await storage.getUserByTelegramId(userId!.toString());
        if (!user) {
          user = await storage.createUser({
            username: msg.from?.username || `user_${userId}`,
            telegramId: userId!.toString(),
            displayName: msg.from?.first_name || msg.from?.username
          });
        }

        // Check for duplicate script
        const existingScripts = await storage.getScriptsByUserId(user.id);
        const isDuplicate = existingScripts.some(script => script.content === scriptContent);
        
        if (isDuplicate) {
          await this.bot.sendMessage(chatId, '⚠️ هذا السكربت موجود بالفعل في قائمتك!');
          return;
        }

        // Create new script
        const scriptId = storage.generateScriptId();
        const script = await storage.createScript({
          scriptId,
          userId: user.id,
          content: scriptContent,
          title: `Script ${scriptId}`,
          description: `Script created by ${user.displayName || user.username}`
        });

        const domain = process.env.KOYEB_PUBLIC_DOMAIN || `https://${process.env.REPLIT_DEV_DOMAIN}` || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        const link = `${domain}/s/${scriptId}`;
        const date = script.createdAt.toLocaleString('ar-EG');

        const message = `✅ **تم حماية السكربت بنجاح!**

📋 **Loadstring:**
\`\`\`
loadstring(game:HttpGet("${link}"))()
\`\`\`

🔗 **المعرف:** \`${scriptId}\`
📅 **التاريخ:** ${date}
📊 **الحجم:** ${scriptContent.length} حرف

🛡️ **ملاحظة:** هذا الرابط محمي ويعمل مع Roblox فقط!`;

        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        await this.logActivity(user.id, script.id, 'script_created', `Script ${scriptId} created`);
        
      } catch (error) {
        console.error('Error protecting script:', error);
        await this.bot.sendMessage(chatId, '❌ حدث خطأ أثناء حماية السكربت. يرجى المحاولة مرة أخرى.');
      }
    });

    // My scripts command
    this.bot.onText(/\/قائمتي/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;

      try {
        const user = await storage.getUserByTelegramId(userId!.toString());
        if (!user) {
          await this.bot.sendMessage(chatId, '❌ لم يتم العثور على حسابك. استخدم /start للبدء.');
          return;
        }

        const scripts = await storage.getScriptsByUserId(user.id);
        if (scripts.length === 0) {
          await this.bot.sendMessage(chatId, '📝 لا توجد سكربتات محفوظة حالياً. استخدم /حماية لإضافة سكربت جديد.');
          return;
        }

        let message = `📜 **قائمة سكربتاتك (${scripts.length}):**\n\n`;
        scripts.slice(0, 10).forEach((script, index) => {
          const date = script.createdAt.toLocaleString('ar-EG');
          message += `${index + 1}. **${script.scriptId}**\n`;
          message += `   📅 ${date}\n`;
          message += `   📊 ${script.downloadCount} تحميل\n`;
          message += `   📝 ${script.content.length} حرف\n\n`;
        });

        if (scripts.length > 10) {
          message += `... و ${scripts.length - 10} سكربت آخر`;
        }

        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        await this.logActivity(user.id, null, 'scripts_listed', 'User viewed their scripts');
        
      } catch (error) {
        console.error('Error fetching scripts:', error);
        await this.bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب قائمة السكربتات.');
      }
    });

    // Script info command
    this.bot.onText(/\/معلومات (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const scriptId = match?.[1];

      if (!scriptId) {
        await this.bot.sendMessage(chatId, '❌ يرجى إدخال معرف السكربت بعد الأمر /معلومات');
        return;
      }

      try {
        const user = await storage.getUserByTelegramId(userId!.toString());
        if (!user) {
          await this.bot.sendMessage(chatId, '❌ لم يتم العثور على حسابك. استخدم /start للبدء.');
          return;
        }

        const script = await storage.getScriptByScriptId(scriptId);
        if (!script || script.userId !== user.id) {
          await this.bot.sendMessage(chatId, '🔒 هذا السكربت لا ينتمي إليك أو غير موجود.');
          return;
        }

        const domain = process.env.KOYEB_PUBLIC_DOMAIN || `https://${process.env.REPLIT_DEV_DOMAIN}` || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        const link = `${domain}/s/${scriptId}`;
        const date = script.createdAt.toLocaleString('ar-EG');

        const message = `📄 **معلومات السكربت:**

🔗 **المعرف:** \`${scriptId}\`
📅 **تاريخ الإنشاء:** ${date}
👤 **المستخدم:** ${user.displayName || user.username}
📊 **حجم السكربت:** ${script.content.length} حرف
📥 **عدد التحميلات:** ${script.downloadCount}

📋 **Loadstring:**
\`\`\`
loadstring(game:HttpGet("${link}"))()
\`\`\`

📝 **السكربت:**
\`\`\`lua
${script.content.substring(0, 500)}${script.content.length > 500 ? '\n...' : ''}
\`\`\``;

        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        await this.logActivity(user.id, script.id, 'script_info_viewed', `Script ${scriptId} info viewed`);
        
      } catch (error) {
        console.error('Error fetching script info:', error);
        await this.bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب معلومات السكربت.');
      }
    });

    // Statistics command
    this.bot.onText(/\/احصائيات/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;

      try {
        const stats = await storage.getDashboardStats();
        const user = await storage.getUserByTelegramId(userId!.toString());
        const userScripts = user ? await storage.getScriptsByUserId(user.id) : [];

        const message = `📊 **إحصائيات البوت:**

📜 إجمالي السكربتات: **${stats.totalScripts}**
👥 إجمالي المستخدمين: **${stats.activeUsers}**
📝 سكربتاتك: **${userScripts.length}**
📥 طلبات اليوم: **${stats.todayRequests}**
🚀 حالة البوت: **متصل**
⏰ وقت التشغيل: **${stats.uptime}** ثانية`;

        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        await this.logActivity(user?.id || null, null, 'stats_viewed', 'User viewed statistics');
        
      } catch (error) {
        console.error('Error fetching statistics:', error);
        await this.bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب الإحصائيات.');
      }
    });

    // Help command
    this.bot.onText(/\/مساعدة/, async (msg) => {
      // Reuse the start command logic
      this.bot.emit('text', msg, [msg.text, '/start']);
    });

    // Handle unknown messages
    this.bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;

      const helpMessage = `❓ لم أفهم رسالتك. أرسل /start لعرض قائمة الأوامر المتاحة.`;
      await this.bot.sendMessage(msg.chat.id, helpMessage);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
      this.isConnected = false;
    });
  }

  private async logActivity(userId: number | null, scriptId: number | null, action: string, details: string) {
    try {
      await storage.createActivityLog({
        userId,
        scriptId,
        action,
        details,
        ipAddress: null,
        userAgent: null
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async sendMessage(chatId: number, message: string, options?: any) {
    return this.bot.sendMessage(chatId, message, options);
  }

  public async updateLastActivity() {
    await storage.updateBotStatus({
      lastActivity: new Date().toISOString()
    });
  }
}

export const telegramBot = new TelegramBotService();
