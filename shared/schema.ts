import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Transaction schema for payment transformations
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull().unique(),
  customerId: text("customer_id"),
  customerAge: integer("customer_age"),
  
  // Transaction details
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  // Parties
  senderName: text("sender_name"),
  recipientName: text("recipient_name"),
  recipientAccount: text("recipient_account"),
  remittanceInfo: text("remittance_info"),
  
  // Format info
  sourceFormat: text("source_format").notNull(), // 'MT103' or 'NACHA'
  iso20022Xml: text("iso20022_xml"),
  
  // Fraud detection
  fraudScore: real("fraud_score").default(0.0),
  fraudFlag: boolean("fraud_flag").default(false),
  fraudType: text("fraud_type"),
  fraudSignals: json("fraud_signals").$type<string[]>(),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, approved, blocked, reviewing
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Fraud pattern schema
export const fraudPatterns = pgTable("fraud_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scamName: text("scam_name").notNull().unique(),
  triggerWords: json("trigger_words").$type<string[]>().notNull(),
  typicalAmountMin: real("typical_amount_min"),
  typicalAmountMax: real("typical_amount_max"),
  confidenceThreshold: real("confidence_threshold").notNull(),
  description: text("description").notNull(),
  preventionTips: json("prevention_tips").$type<string[]>().notNull(),
  targetAgeGroup: text("target_age_group"),
});

export const insertFraudPatternSchema = createInsertSchema(fraudPatterns).omit({
  id: true,
});

export type InsertFraudPattern = z.infer<typeof insertFraudPatternSchema>;
export type FraudPattern = typeof fraudPatterns.$inferSelect;

// Customer schema
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: text("customer_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age"),
  email: text("email"),
  phone: text("phone"),
  
  // Profile
  personaType: text("persona_type"), // 'retiree', 'business', 'consumer', 'student'
  techProficiency: text("tech_proficiency"), // 'low', 'medium', 'high'
  vulnerabilityScore: real("vulnerability_score").default(0.0),
  
  // Preferences
  accessibilitySettings: json("accessibility_settings").$type<Record<string, any>>(),
  notificationPreferences: json("notification_preferences").$type<Record<string, any>>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Pension payment schema
export const pensionPayments = pgTable("pension_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: text("payment_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  
  amount: real("amount").notNull(),
  source: text("source").notNull(), // 'Social Security', 'Pension Fund', etc.
  
  // Timeline
  sentTime: timestamp("sent_time"),
  receivedTime: timestamp("received_time"),
  clearedTime: timestamp("cleared_time"),
  availableTime: timestamp("available_time"),
  
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("FedNow"),
});

export const insertPensionPaymentSchema = createInsertSchema(pensionPayments).omit({
  id: true,
});

export type InsertPensionPayment = z.infer<typeof insertPensionPaymentSchema>;
export type PensionPayment = typeof pensionPayments.$inferSelect;

// Transform request/response types
export const transformRequestSchema = z.object({
  format: z.enum(['MT103', 'NACHA']),
  content: z.string(),
  customerId: z.string().optional(),
  customerAge: z.number().optional(),
});

export type TransformRequest = z.infer<typeof transformRequestSchema>;

export const transformResponseSchema = z.object({
  success: z.boolean(),
  transactionId: z.string(),
  iso20022Xml: z.string().optional(),
  fraudScore: z.number(),
  fraudFlag: z.boolean(),
  fraudType: z.string().optional(),
  fraudSignals: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export type TransformResponse = z.infer<typeof transformResponseSchema>;

// Fraud analysis types
export const fraudAnalysisSchema = z.object({
  transactionId: z.string(),
  amount: z.number(),
  remittanceInfo: z.string(),
  recipientName: z.string().optional(),
  customerAge: z.number().optional(),
});

export type FraudAnalysis = z.infer<typeof fraudAnalysisSchema>;

export const fraudResultSchema = z.object({
  fraudScore: z.number(),
  fraudFlag: z.boolean(),
  detectedScams: z.array(z.object({
    name: z.string(),
    confidence: z.number(),
    description: z.string(),
    preventionTips: z.array(z.string()),
    matchedTriggers: z.array(z.string()),
  })),
  signals: z.array(z.string()),
});

export type FraudResult = z.infer<typeof fraudResultSchema>;
