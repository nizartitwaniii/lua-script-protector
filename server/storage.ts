import { users, scripts, activityLogs, type User, type Script, type ActivityLog, type InsertUser, type InsertScript, type InsertActivityLog, type ScriptWithUser, type DashboardStats, type BotStatus } from "@shared/schema";
import crypto from "crypto";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Script operations
  getScript(id: number): Promise<Script | undefined>;
  getScriptByScriptId(scriptId: string): Promise<Script | undefined>;
  getScriptWithUser(scriptId: string): Promise<ScriptWithUser | undefined>;
  createScript(script: InsertScript): Promise<Script>;
  updateScript(id: number, updates: Partial<Script>): Promise<Script | undefined>;
  deleteScript(id: number): Promise<boolean>;
  getScriptsByUserId(userId: number): Promise<Script[]>;
  getRecentScripts(limit?: number): Promise<ScriptWithUser[]>;
  incrementDownloadCount(scriptId: string): Promise<void>;
  
  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByUserId(userId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Statistics
  getDashboardStats(): Promise<DashboardStats>;
  getTodayRequestCount(): Promise<number>;
  
  // Bot status
  getBotStatus(): Promise<BotStatus>;
  updateBotStatus(status: Partial<BotStatus>): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private scripts: Map<number, Script> = new Map();
  private activityLogs: Map<number, ActivityLog> = new Map();
  private botStatus: BotStatus = {
    isConnected: false,
    botUsername: '@LuaProtectionBot',
    lastActivity: new Date().toISOString(),
    token: '7619814993:AAF***'
  };
  
  private userIdCounter = 1;
  private scriptIdCounter = 1;
  private activityLogIdCounter = 1;
  private startTime = Date.now();

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.telegramId === telegramId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.userIdCounter++,
      ...insertUser,
      displayName: insertUser.displayName || null,
      createdAt: new Date(),
      isActive: true
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Script operations
  async getScript(id: number): Promise<Script | undefined> {
    return this.scripts.get(id);
  }

  async getScriptByScriptId(scriptId: string): Promise<Script | undefined> {
    return Array.from(this.scripts.values()).find(script => script.scriptId === scriptId);
  }

  async getScriptWithUser(scriptId: string): Promise<ScriptWithUser | undefined> {
    const script = await this.getScriptByScriptId(scriptId);
    if (!script) return undefined;
    
    const user = await this.getUser(script.userId);
    if (!user) return undefined;
    
    return {
      ...script,
      user: {
        username: user.username,
        displayName: user.displayName
      }
    };
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const script: Script = {
      id: this.scriptIdCounter++,
      ...insertScript,
      title: insertScript.title || null,
      description: insertScript.description || null,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    this.scripts.set(script.id, script);
    return script;
  }

  async updateScript(id: number, updates: Partial<Script>): Promise<Script | undefined> {
    const script = this.scripts.get(id);
    if (!script) return undefined;
    
    const updatedScript = { ...script, ...updates, updatedAt: new Date() };
    this.scripts.set(id, updatedScript);
    return updatedScript;
  }

  async deleteScript(id: number): Promise<boolean> {
    return this.scripts.delete(id);
  }

  async getScriptsByUserId(userId: number): Promise<Script[]> {
    return Array.from(this.scripts.values()).filter(script => script.userId === userId);
  }

  async getRecentScripts(limit: number = 10): Promise<ScriptWithUser[]> {
    const scripts = Array.from(this.scripts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const scriptsWithUser: ScriptWithUser[] = [];
    for (const script of scripts) {
      const user = await this.getUser(script.userId);
      if (user) {
        scriptsWithUser.push({
          ...script,
          user: {
            username: user.username,
            displayName: user.displayName
          }
        });
      }
    }
    
    return scriptsWithUser;
  }

  async incrementDownloadCount(scriptId: string): Promise<void> {
    const script = await this.getScriptByScriptId(scriptId);
    if (script) {
      await this.updateScript(script.id, { 
        downloadCount: script.downloadCount + 1 
      });
    }
  }

  // Activity log operations
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: this.activityLogIdCounter++,
      ...insertLog,
      userId: insertLog.userId || null,
      scriptId: insertLog.scriptId || null,
      details: insertLog.details || null,
      ipAddress: insertLog.ipAddress || null,
      userAgent: insertLog.userAgent || null,
      createdAt: new Date()
    };
    this.activityLogs.set(log.id, log);
    return log;
  }

  async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getActivityLogsByUserId(userId: number, limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const totalScripts = this.scripts.size;
    const activeUsers = new Set(Array.from(this.scripts.values()).map(s => s.userId)).size;
    const todayRequests = await this.getTodayRequestCount();
    const uptime = ((Date.now() - this.startTime) / 1000).toFixed(0);
    
    return {
      totalScripts,
      activeUsers,
      todayRequests,
      uptime
    };
  }

  async getTodayRequestCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.activityLogs.values())
      .filter(log => log.createdAt >= today && log.action === 'script_downloaded')
      .length;
  }

  // Bot status
  async getBotStatus(): Promise<BotStatus> {
    return this.botStatus;
  }

  async updateBotStatus(status: Partial<BotStatus>): Promise<void> {
    this.botStatus = { ...this.botStatus, ...status };
  }

  // Utility method to generate unique script ID
  generateScriptId(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}

export const storage = new MemStorage();
