import {
  type Transaction,
  type InsertTransaction,
  type FraudPattern,
  type InsertFraudPattern,
  type Customer,
  type InsertCustomer,
  type PensionPayment,
  type InsertPensionPayment,
  type CallbackRequest,
  type InsertCallbackRequest,
  type User,
  type UpsertUser,
  transactions,
  fraudPatterns,
  customers,
  pensionPayments,
  callbackRequests,
  users
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // User operations (REQUIRED for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  getRecentTransactions(limit: number): Promise<Transaction[]>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Fraud pattern operations
  createFraudPattern(pattern: InsertFraudPattern): Promise<FraudPattern>;
  getFraudPattern(scamName: string): Promise<FraudPattern | undefined>;
  getAllFraudPatterns(): Promise<FraudPattern[]>;

  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(customerId: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;

  // Pension payment operations
  createPensionPayment(payment: InsertPensionPayment): Promise<PensionPayment>;
  getPensionPayment(paymentId: string): Promise<PensionPayment | undefined>;
  getPensionPaymentsByCustomer(customerId: string): Promise<PensionPayment[]>;
  updatePensionPayment(id: string, updates: Partial<PensionPayment>): Promise<PensionPayment | undefined>;

  // Callback request operations
  createCallbackRequest(request: InsertCallbackRequest): Promise<CallbackRequest>;
  getCallbackRequest(id: string): Promise<CallbackRequest | undefined>;
  getAllCallbackRequests(): Promise<CallbackRequest[]>;
  getCallbackRequestsByStatus(status: string): Promise<CallbackRequest[]>;
  updateCallbackRequest(id: string, updates: Partial<CallbackRequest>): Promise<CallbackRequest | undefined>;
}

export class DbStorage implements IStorage {
  // User operations (REQUIRED for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values([insertTransaction]).returning();
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.transactionId, transactionId));
    return transaction;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.timestamp));
  }

  async getTransactionsByCustomerId(customerId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.customerId, customerId))
      .orderBy(desc(transactions.timestamp));
  }

  async getRecentTransactions(limit: number): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.timestamp)).limit(limit);
  }

  async getRecentTransactionsByCustomerId(customerId: string, limit: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.customerId, customerId))
      .orderBy(desc(transactions.timestamp))
      .limit(limit);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  // Fraud pattern operations
  async createFraudPattern(insertPattern: InsertFraudPattern): Promise<FraudPattern> {
    const [pattern] = await db.insert(fraudPatterns).values([insertPattern]).returning();
    return pattern;
  }

  async getFraudPattern(scamName: string): Promise<FraudPattern | undefined> {
    const [pattern] = await db.select().from(fraudPatterns).where(eq(fraudPatterns.scamName, scamName));
    return pattern;
  }

  async getAllFraudPatterns(): Promise<FraudPattern[]> {
    return await db.select().from(fraudPatterns);
  }

  // Customer operations
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values([insertCustomer]).returning();
    return customer;
  }

  async getCustomer(customerId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.customerId, customerId));
    return customer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  // Pension payment operations
  async createPensionPayment(insertPayment: InsertPensionPayment): Promise<PensionPayment> {
    const [payment] = await db.insert(pensionPayments).values([insertPayment]).returning();
    return payment;
  }

  async getPensionPayment(paymentId: string): Promise<PensionPayment | undefined> {
    const [payment] = await db.select().from(pensionPayments).where(eq(pensionPayments.paymentId, paymentId));
    return payment;
  }

  async getPensionPaymentsByCustomer(customerId: string): Promise<PensionPayment[]> {
    return await db.select().from(pensionPayments).where(eq(pensionPayments.customerId, customerId));
  }

  async updatePensionPayment(id: string, updates: Partial<PensionPayment>): Promise<PensionPayment | undefined> {
    const [updated] = await db.update(pensionPayments)
      .set(updates)
      .where(eq(pensionPayments.id, id))
      .returning();
    return updated;
  }

  // Callback request operations
  async createCallbackRequest(insertRequest: InsertCallbackRequest): Promise<CallbackRequest> {
    const [request] = await db.insert(callbackRequests).values([insertRequest]).returning();
    return request;
  }

  async getCallbackRequest(id: string): Promise<CallbackRequest | undefined> {
    const [request] = await db.select().from(callbackRequests).where(eq(callbackRequests.id, id));
    return request;
  }

  async getAllCallbackRequests(): Promise<CallbackRequest[]> {
    return await db.select().from(callbackRequests).orderBy(desc(callbackRequests.createdAt));
  }

  async getCallbackRequestsByCustomerId(customerId: string): Promise<CallbackRequest[]> {
    return await db.select().from(callbackRequests)
      .where(eq(callbackRequests.customerId, customerId))
      .orderBy(desc(callbackRequests.createdAt));
  }

  async getCallbackRequestsByStatus(status: string): Promise<CallbackRequest[]> {
    return await db.select().from(callbackRequests).where(eq(callbackRequests.status, status)).orderBy(desc(callbackRequests.createdAt));
  }

  async updateCallbackRequest(id: string, updates: Partial<CallbackRequest>): Promise<CallbackRequest | undefined> {
    const [updated] = await db.update(callbackRequests)
      .set(updates)
      .where(eq(callbackRequests.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DbStorage();
