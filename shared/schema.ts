import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  telegramId: text("telegram_id").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  scriptId: text("script_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  title: text("title"),
  description: text("description"),
  downloadCount: integer("download_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  scriptId: integer("script_id").references(() => scripts.id),
  action: text("action").notNull(), // 'script_created', 'script_downloaded', 'script_accessed', etc.
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  telegramId: true,
  displayName: true,
});

export const insertScriptSchema = createInsertSchema(scripts).pick({
  scriptId: true,
  userId: true,
  content: true,
  title: true,
  description: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  scriptId: true,
  action: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Additional types for API responses
export type ScriptWithUser = Script & {
  user: Pick<User, 'username' | 'displayName'>;
};

export type DashboardStats = {
  totalScripts: number;
  activeUsers: number;
  todayRequests: number;
  uptime: string;
};

export type BotStatus = {
  isConnected: boolean;
  botUsername: string;
  lastActivity: string;
  token: string;
};
