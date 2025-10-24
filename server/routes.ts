import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { transformMT103 } from "./transformers/mt103";
import { transformNACHA } from "./transformers/nacha";
import { analyzeFraud } from "./fraud-detection";
import { transformRequestSchema, type TransformResponse } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Transform payment endpoint
  app.post("/api/transform", async (req, res) => {
    try {
      const validatedData = transformRequestSchema.parse(req.body);
      const { format, content, customerId, customerAge } = validatedData;

      let xml: string;
      let amount: number = 0;
      let currency: string = "USD";
      let senderName: string = "";
      let recipientName: string = "";
      let recipientAccount: string = "";
      let remittanceInfo: string = "";
      let transactionId: string = "";

      // Transform based on format
      if (format === "MT103") {
        const result = transformMT103(content);
        xml = result.xml;
        transactionId = result.data.transactionReference || `MT103-${Date.now()}`;
        amount = parseFloat(result.data.amount || "0");
        currency = result.data.currency || "USD";
        senderName = result.data.orderingCustomer?.split('\n')[0] || "";
        recipientName = result.data.beneficiary?.split('\n')[0] || "";
        remittanceInfo = result.data.remittanceInfo || "";
      } else if (format === "NACHA") {
        const result = transformNACHA(content);
        xml = result.xml;
        transactionId = result.data.entryDetail?.traceNumber || `NACHA-${Date.now()}`;
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
        customerAge
      );

      // Store transaction
      const transaction = await storage.createTransaction({
        transactionId,
        customerId,
        customerAge,
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

  // Get all transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Get recent transactions
  app.get("/api/transactions/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Get recent transactions error:", error);
      res.status(500).json({ error: "Failed to fetch recent transactions" });
    }
  });

  // Get transaction by ID
  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Get transaction error:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  // Get dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      
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

  // Get all fraud patterns
  app.get("/api/fraud-patterns", async (req, res) => {
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
