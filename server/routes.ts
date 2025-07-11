import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramBot } from "./services/telegram-bot";
import { insertScriptSchema, insertActivityLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // API Routes
  
  // Get dashboard statistics
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Get recent scripts
  app.get("/api/scripts/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const scripts = await storage.getRecentScripts(limit);
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching recent scripts:", error);
      res.status(500).json({ error: "Failed to fetch recent scripts" });
    }
  });

  // Get script by ID (for serving to Roblox) - New route format
  app.get("/s/:scriptId", async (req: Request, res: Response) => {
    try {
      const { scriptId } = req.params;
      const script = await storage.getScriptByScriptId(scriptId);
      
      if (!script) {
        return res.status(404).send("السكربت غير موجود");
      }

      // Check User-Agent for Roblox
      const userAgent = req.headers["user-agent"] || "";
      const isRoblox = userAgent.includes("Roblox") ||
                      userAgent.includes("HttpGet") ||
                      userAgent.includes("RobloxStudio") ||
                      userAgent.includes("RCC") ||
                      userAgent.toLowerCase().includes("roblox");

      if (!isRoblox) {
        // Log suspicious access attempt
        await storage.createActivityLog({
          userId: null,
          scriptId: script.id,
          action: "access_blocked",
          details: `Blocked access from non-Roblox user agent: ${userAgent}`,
          ipAddress: req.ip,
          userAgent: userAgent
        });
        
        return res.status(403).send("غير مسموح بالوصول من هذا المصدر");
      }

      // Increment download count
      await storage.incrementDownloadCount(scriptId);
      
      // Log successful access
      await storage.createActivityLog({
        userId: script.userId,
        scriptId: script.id,
        action: "script_downloaded",
        details: `Script ${scriptId} downloaded successfully`,
        ipAddress: req.ip,
        userAgent: userAgent
      });

      // Update bot last activity
      await telegramBot.updateLastActivity();

      res.setHeader("Content-Type", "text/plain");
      res.send(script.content);
      
    } catch (error) {
      console.error("Error serving script:", error);
      res.status(500).send("خطأ في الخادم");
    }
  });

  // Get script by ID (for serving to Roblox) - API format
  app.get("/api/scripts/:scriptId", async (req: Request, res: Response) => {
    try {
      const { scriptId } = req.params;
      const script = await storage.getScriptByScriptId(scriptId);
      
      if (!script) {
        return res.status(404).send("السكربت غير موجود");
      }

      // Check User-Agent for Roblox
      const userAgent = req.headers["user-agent"] || "";
      const isRoblox = userAgent.includes("Roblox") ||
                      userAgent.includes("HttpGet") ||
                      userAgent.includes("RobloxStudio") ||
                      userAgent.includes("RCC") ||
                      userAgent.toLowerCase().includes("roblox");

      if (!isRoblox) {
        // Log suspicious access attempt
        await storage.createActivityLog({
          userId: null,
          scriptId: script.id,
          action: "access_blocked",
          details: `Blocked access from non-Roblox user agent: ${userAgent}`,
          ipAddress: req.ip,
          userAgent: userAgent
        });
        
        return res.status(403).send("غير مسموح بالوصول من هذا المصدر");
      }

      // Increment download count
      await storage.incrementDownloadCount(scriptId);
      
      // Log successful access
      await storage.createActivityLog({
        userId: script.userId,
        scriptId: script.id,
        action: "script_downloaded",
        details: `Script ${scriptId} downloaded successfully`,
        ipAddress: req.ip,
        userAgent: userAgent
      });

      // Update bot last activity
      await telegramBot.updateLastActivity();

      res.setHeader("Content-Type", "text/plain");
      res.send(script.content);
      
    } catch (error) {
      console.error("Error serving script:", error);
      res.status(500).send("خطأ في الخادم");
    }
  });

  // Get script details
  app.get("/api/scripts/:scriptId/details", async (req: Request, res: Response) => {
    try {
      const { scriptId } = req.params;
      const script = await storage.getScriptWithUser(scriptId);
      
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      
      res.json(script);
    } catch (error) {
      console.error("Error fetching script details:", error);
      res.status(500).json({ error: "Failed to fetch script details" });
    }
  });

  // Delete script
  app.delete("/api/scripts/:scriptId", async (req: Request, res: Response) => {
    try {
      const { scriptId } = req.params;
      const script = await storage.getScriptByScriptId(scriptId);
      
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      
      const deleted = await storage.deleteScript(script.id);
      
      if (deleted) {
        // Log deletion
        await storage.createActivityLog({
          userId: script.userId,
          scriptId: script.id,
          action: "script_deleted",
          details: `Script ${scriptId} deleted`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null
        });
        
        res.json({ message: "Script deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete script" });
      }
    } catch (error) {
      console.error("Error deleting script:", error);
      res.status(500).json({ error: "Failed to delete script" });
    }
  });

  // Get activity logs
  app.get("/api/activity-logs", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Get bot status
  app.get("/api/bot/status", async (req: Request, res: Response) => {
    try {
      const status = await storage.getBotStatus();
      const isConnected = telegramBot.getConnectionStatus();
      
      res.json({
        ...status,
        isConnected
      });
    } catch (error) {
      console.error("Error fetching bot status:", error);
      res.status(500).json({ error: "Failed to fetch bot status" });
    }
  });

  // Restart bot (placeholder - would need actual restart logic)
  app.post("/api/bot/restart", async (req: Request, res: Response) => {
    try {
      // Log restart action
      await storage.createActivityLog({
        userId: null,
        scriptId: null,
        action: "bot_restart",
        details: "Bot restart requested from dashboard",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null
      });
      
      res.json({ message: "Bot restart initiated" });
    } catch (error) {
      console.error("Error restarting bot:", error);
      res.status(500).json({ error: "Failed to restart bot" });
    }
  });

  // Get users count
  app.get("/api/users/count", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json({ count: stats.activeUsers });
    } catch (error) {
      console.error("Error fetching users count:", error);
      res.status(500).json({ error: "Failed to fetch users count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
