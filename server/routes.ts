import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { transformMT103 } from "./transformers/mt103";
import { transformNACHA } from "./transformers/nacha";
import { analyzeFraud } from "./fraud-detection";
import { transformRequestSchema, type TransformResponse, insertCallbackRequestSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth middleware
  await setupAuth(app);

  // Auth endpoints
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Callback request endpoints
  app.post("/api/callbacks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const validatedData = insertCallbackRequestSchema.parse(req.body);
      const callback = await storage.createCallbackRequest({
        ...validatedData,
        customerId: userId,
        customerName: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.email || "Unknown",
      });
      
      res.json(callback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Callback request error:", error);
      res.status(500).json({ message: "Failed to create callback request" });
    }
  });

  app.get("/api/callbacks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const callbacks = await storage.getCallbackRequestsByCustomerId(userId);
      res.json(callbacks);
    } catch (error) {
      console.error("Error fetching callbacks:", error);
      res.status(500).json({ message: "Failed to fetch callback requests" });
    }
  });

  app.patch("/api/callbacks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership before updating
      const existing = await storage.getCallbackRequest(id);
      if (!existing) {
        return res.status(404).json({ message: "Callback request not found" });
      }
      if (existing.customerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateCallbackRequest(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating callback:", error);
      res.status(500).json({ message: "Failed to update callback request" });
    }
  });
  
  // Batch transform endpoint (parallel processing)
  app.post("/api/transform/batch", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!Array.isArray(req.body.files)) {
        return res.status(400).json({ message: "Expected 'files' array" });
      }

      // Process all files in parallel using Promise.all
      const results = await Promise.all(
        req.body.files.map(async (file: any) => {
          try {
            const validatedData = transformRequestSchema.parse({
              ...file,
              customerId: userId,
              customerAge: user?.age || 65
            });
            
            const { format, content } = validatedData;
            let xml: string;
            let amount: number = 0;
            let currency: string = "USD";
            let senderName: string = "";
            let recipientName: string = "";
            let recipientAccount: string = "";
            let remittanceInfo: string = "";
            let transactionId: string = "";

            if (format === "MT103") {
              const result = transformMT103(content);
              xml = result.xml;
              transactionId = result.data.transactionReference || `MT103-${Date.now()}-${Math.random()}`;
              amount = parseFloat(result.data.amount || "0");
              currency = result.data.currency || "USD";
              senderName = result.data.orderingCustomer?.split('\n')[0] || "";
              recipientName = result.data.beneficiary?.split('\n')[0] || "";
              remittanceInfo = result.data.remittanceInfo || "";
            } else {
              const result = transformNACHA(content);
              xml = result.xml;
              transactionId = result.data.entryDetail?.traceNumber || `NACHA-${Date.now()}-${Math.random()}`;
              const amountStr = result.data.entryDetail?.amount || "0";
              amount = parseInt(amountStr) / 100;
              senderName = result.data.batchHeader?.companyName || "";
              recipientName = result.data.entryDetail?.individualName || "";
              recipientAccount = result.data.entryDetail?.dfiAccountNumber || "";
              remittanceInfo = result.data.batchHeader?.entryDescription || "";
            }

            const fraudAnalysis = await analyzeFraud(amount, remittanceInfo, recipientName, user?.age || 65);
            
            const transaction = await storage.createTransaction({
              transactionId,
              customerId: userId,
              customerAge: user?.age || 65,
              amount,
              currency,
              senderName,
              recipientName,
              recipientAccount,
              remittanceInfo,
              sourceFormat: format,
              iso20022Xml: xml,
              fraudScore: fraudAnalysis.fraudScore,
              fraudFlag: fraudAnalysis.fraudFlag,
              fraudType: fraudAnalysis.detectedScams[0]?.name,
              fraudSignals: fraudAnalysis.signals,
              status: fraudAnalysis.fraudFlag ? "reviewing" : "approved"
            });

            return {
              success: true,
              fileName: file.fileName || transactionId,
              transactionId: transaction.transactionId,
              fraudScore: fraudAnalysis.fraudScore,
              fraudFlag: fraudAnalysis.fraudFlag
            };
          } catch (error) {
            return {
              success: false,
              fileName: file.fileName || "Unknown",
              error: error instanceof Error ? error.message : "Processing failed"
            };
          }
        })
      );

      res.json({ 
        results, 
        total: req.body.files.length, 
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    } catch (error) {
      console.error("Batch transform error:", error);
      res.status(500).json({ message: "Batch processing failed" });
    }
  });

  // Transform payment endpoint (protected)
  app.post("/api/transform", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const validatedData = transformRequestSchema.parse(req.body);
      const { format, content } = validatedData;

      let xml: string;
      let amount: number = 0;
      let currency: string = "USD";
      let senderName: string = "";
      let recipientName: string = "";
      let recipientAccount: string = "";
      let remittanceInfo: string = "";
      let transactionId: string = "";

      // Transform based on format
      // Always generate unique transaction ID to avoid duplicates
      transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      if (format === "MT103") {
        const result = transformMT103(content);
        xml = result.xml;
        amount = parseFloat(result.data.amount || "0");
        currency = result.data.currency || "USD";
        senderName = result.data.orderingCustomer?.split('\n')[0] || "";
        recipientName = result.data.beneficiary?.split('\n')[0] || "";
        remittanceInfo = result.data.remittanceInfo || "";
      } else if (format === "NACHA") {
        const result = transformNACHA(content);
        xml = result.xml;
        const amountStr = result.data.entryDetail?.amount || "0";
        amount = parseInt(amountStr) / 100;
        senderName = result.data.batchHeader?.companyName || "";
        recipientName = result.data.entryDetail?.individualName || "";
        recipientAccount = result.data.entryDetail?.dfiAccountNumber || "";
        remittanceInfo = result.data.batchHeader?.entryDescription || "";
      } else {
        return res.status(400).json({
          success: false,
          errors: ["Unsupported format. Use MT103 or NACHA."]
        });
      }

      // Analyze for fraud
      const fraudAnalysis = await analyzeFraud(
        amount,
        remittanceInfo,
        recipientName,
        user?.age || 65
      );

      // Store transaction
      const transaction = await storage.createTransaction({
        transactionId,
        customerId: userId,
        customerAge: user?.age || 65,
        amount,
        currency,
        senderName,
        recipientName,
        recipientAccount,
        remittanceInfo,
        sourceFormat: format,
        iso20022Xml: xml,
        fraudScore: fraudAnalysis.fraudScore,
        fraudFlag: fraudAnalysis.fraudFlag,
        fraudType: fraudAnalysis.detectedScams[0]?.name,
        fraudSignals: fraudAnalysis.signals,
        status: fraudAnalysis.fraudFlag ? "reviewing" : "approved"
      });

      const response: TransformResponse = {
        success: true,
        transactionId: transaction.transactionId,
        iso20022Xml: xml,
        fraudScore: fraudAnalysis.fraudScore,
        fraudFlag: fraudAnalysis.fraudFlag,
        fraudType: fraudAnalysis.detectedScams[0]?.name,
        fraudSignals: fraudAnalysis.signals,
        detectedScams: fraudAnalysis.detectedScams,
        amount,
        recipientName,
        remittanceInfo,
        warnings: fraudAnalysis.fraudFlag 
          ? [`This transaction has been flagged for potential fraud (${fraudAnalysis.fraudScore}% risk)`]
          : undefined
      };

      res.json(response);

    } catch (error) {
      console.error("Transform error:", error);
      
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          errors: [validationError.message]
        });
      }

      res.status(500).json({
        success: false,
        errors: ["An error occurred during transformation. Please check your input."]
      });
    }
  });

  // Get all transactions (user-scoped)
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTransactions = await storage.getTransactionsByCustomerId(userId);
      res.json(userTransactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Get recent transactions (user-scoped)
  app.get("/api/transactions/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const userTransactions = await storage.getRecentTransactionsByCustomerId(userId, limit);
      res.json(userTransactions);
    } catch (error) {
      console.error("Get recent transactions error:", error);
      res.status(500).json({ error: "Failed to fetch recent transactions" });
    }
  });

  // Get transaction by ID (user-scoped and authenticated)
  app.get("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transaction = await storage.getTransaction(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Verify the transaction belongs to the requesting user
      if (transaction.customerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Get transaction error:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  // Get dashboard statistics (user-scoped)
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactionsByCustomerId(userId);
      
      const totalTransactions = transactions.length;
      const flaggedTransactions = transactions.filter(tx => tx.fraudFlag).length;
      const totalFraudScore = transactions.reduce((sum, tx) => sum + (tx.fraudScore || 0), 0);
      const averageFraudScore = totalTransactions > 0 
        ? totalFraudScore / totalTransactions 
        : 0;

      res.json({
        totalTransactions,
        flaggedTransactions,
        averageFraudScore: Math.round(averageFraudScore * 100) / 100
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Get all fraud patterns (authenticated)
  app.get("/api/fraud-patterns", isAuthenticated, async (req, res) => {
    try {
      const patterns = await storage.getAllFraudPatterns();
      res.json(patterns);
    } catch (error) {
      console.error("Get fraud patterns error:", error);
      res.status(500).json({ error: "Failed to fetch fraud patterns" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
