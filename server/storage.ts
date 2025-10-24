import {
  type Transaction,
  type InsertTransaction,
  type FraudPattern,
  type InsertFraudPattern,
  type Customer,
  type InsertCustomer,
  type PensionPayment,
  type InsertPensionPayment
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
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
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private fraudPatterns: Map<string, FraudPattern>;
  private customers: Map<string, Customer>;
  private pensionPayments: Map<string, PensionPayment>;

  constructor() {
    this.transactions = new Map();
    this.fraudPatterns = new Map();
    this.customers = new Map();
    this.pensionPayments = new Map();

    // Initialize with default fraud patterns and sample data
    this.initializeFraudPatterns();
    this.initializeSampleData();
  }

  private initializeFraudPatterns() {
    const patterns: InsertFraudPattern[] = [
      {
        scamName: "IRS Tax Scam",
        triggerWords: ["irs", "tax", "penalty", "arrest", "warrant", "federal", "treasury"],
        typicalAmountMin: 500,
        typicalAmountMax: 10000,
        confidenceThreshold: 0.6,
        description: "Scammers impersonate IRS agents demanding immediate payment",
        preventionTips: [
          "The IRS never calls to demand immediate payment",
          "The IRS never threatens arrest over the phone",
          "Contact IRS directly at 1-800-829-1040"
        ],
        targetAgeGroup: "65+"
      },
      {
        scamName: "Grandparent Emergency Scam",
        triggerWords: ["emergency", "urgent", "accident", "hospital", "bail", "grandchild"],
        typicalAmountMin: 1000,
        typicalAmountMax: 15000,
        confidenceThreshold: 0.65,
        description: "Scammers pretend to be grandchildren in emergencies",
        preventionTips: [
          "Always verify by calling your grandchild directly",
          "Ask questions only the real person would know",
          "Be suspicious of requests for secrecy"
        ],
        targetAgeGroup: "65+"
      },
      {
        scamName: "Social Security Suspension",
        triggerWords: ["social security", "ssn", "suspended", "fraud", "compromised"],
        typicalAmountMin: 200,
        typicalAmountMax: 5000,
        confidenceThreshold: 0.7,
        description: "Scammers claim SSN has been suspended",
        preventionTips: [
          "Social Security numbers are NEVER suspended",
          "SSA never calls to demand payment",
          "Contact SSA directly at 1-800-772-1213"
        ],
        targetAgeGroup: "65+"
      },
      {
        scamName: "Tech Support Scam",
        triggerWords: ["microsoft", "apple", "computer", "virus", "infected", "tech support"],
        typicalAmountMin: 200,
        typicalAmountMax: 2000,
        confidenceThreshold: 0.65,
        description: "Scammers pose as tech support demanding payment",
        preventionTips: [
          "Microsoft and Apple never cold-call customers",
          "Never give remote access to unsolicited callers",
          "Use official support channels only"
        ],
        targetAgeGroup: "All"
      }
    ];

    patterns.forEach(pattern => {
      const id = randomUUID();
      const fraudPattern: FraudPattern = { ...pattern, id };
      this.fraudPatterns.set(pattern.scamName, fraudPattern);
    });
  }

  private initializeSampleData() {
    // Sample senior customer
    const customer1 = this.createCustomerSync({
      customerId: "CUST001",
      name: "Margaret Thompson",
      age: 72,
      email: "margaret.t@email.com",
      phone: "(555) 123-4567",
      personaType: "retiree",
      techProficiency: "low",
      vulnerabilityScore: 0.3,
      accessibilitySettings: { largeFonts: true, highContrast: true },
      notificationPreferences: { email: true, sms: true }
    });

    // Sample legitimate transactions
    const transactions = [
      {
        transactionId: "TXN-2025-001",
        customerId: "CUST001",
        customerAge: 72,
        amount: 1247.50,
        currency: "USD",
        senderName: "Social Security Administration",
        recipientName: "Margaret Thompson",
        recipientAccount: "****5678",
        remittanceInfo: "Monthly Social Security Payment",
        sourceFormat: "NACHA",
        fraudScore: 2,
        fraudFlag: false,
        status: "approved"
      },
      {
        transactionId: "TXN-2025-002",
        customerId: "CUST001",
        customerAge: 72,
        amount: 89.99,
        currency: "USD",
        senderName: "Margaret Thompson",
        recipientName: "City Electric Company",
        recipientAccount: "****1234",
        remittanceInfo: "Monthly electric bill payment",
        sourceFormat: "MT103",
        fraudScore: 5,
        fraudFlag: false,
        status: "approved"
      },
      {
        transactionId: "TXN-2025-003",
        customerId: "CUST001",
        customerAge: 72,
        amount: 2500.00,
        currency: "USD",
        senderName: "Margaret Thompson",
        recipientName: "IRS Payment Processing",
        recipientAccount: "****9999",
        remittanceInfo: "URGENT: IRS Tax Penalty Payment - Account will be suspended",
        sourceFormat: "MT103",
        fraudScore: 87,
        fraudFlag: true,
        fraudType: "IRS Tax Scam",
        fraudSignals: [
          "Detected IRS Tax Scam keywords: irs, urgent, suspended, penalty",
          "Urgent language detected (common pressure tactic)",
          "Amount matches IRS Tax Scam pattern ($500-$10000)",
          "Customer is in senior age group (higher vulnerability)"
        ],
        status: "blocked"
      },
      {
        transactionId: "TXN-2025-004",
        customerId: "CUST001",
        customerAge: 72,
        amount: 150.00,
        currency: "USD",
        senderName: "Margaret Thompson",
        recipientName: "Dr. Sarah Johnson Medical",
        recipientAccount: "****4321",
        remittanceInfo: "Co-payment for medical visit",
        sourceFormat: "NACHA",
        fraudScore: 3,
        fraudFlag: false,
        status: "approved"
      }
    ];

    transactions.forEach(tx => {
      const id = randomUUID();
      const transaction: Transaction = {
        ...tx,
        id,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time within last week
        createdAt: new Date(),
        updatedAt: new Date(),
        iso20022Xml: undefined
      };
      this.transactions.set(id, transaction);
    });

    // Sample pension payment
    const pension = this.createPensionPaymentSync({
      paymentId: "PEN-2025-03",
      customerId: "CUST001",
      amount: 2847.50,
      source: "Social Security",
      sentTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      receivedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      clearedTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "pending",
      paymentMethod: "FedNow"
    });
  }

  private createCustomerSync(insertCustomer: InsertCustomer): Customer {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  private createPensionPaymentSync(insertPayment: InsertPensionPayment): PensionPayment {
    const id = randomUUID();
    const payment: PensionPayment = { ...insertPayment, id };
    this.pensionPayments.set(id, payment);
    return payment;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.transactionId === transactionId
    );
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async getRecentTransactions(limit: number): Promise<Transaction[]> {
    const all = await this.getAllTransactions();
    return all.slice(0, limit);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updated = {
      ...transaction,
      ...updates,
      updatedAt: new Date(),
    };
    this.transactions.set(id, updated);
    return updated;
  }

  // Fraud pattern operations
  async createFraudPattern(insertPattern: InsertFraudPattern): Promise<FraudPattern> {
    const id = randomUUID();
    const pattern: FraudPattern = { ...insertPattern, id };
    this.fraudPatterns.set(insertPattern.scamName, pattern);
    return pattern;
  }

  async getFraudPattern(scamName: string): Promise<FraudPattern | undefined> {
    return this.fraudPatterns.get(scamName);
  }

  async getAllFraudPatterns(): Promise<FraudPattern[]> {
    return Array.from(this.fraudPatterns.values());
  }

  // Customer operations
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async getCustomer(customerId: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.customerId === customerId
    );
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  // Pension payment operations
  async createPensionPayment(insertPayment: InsertPensionPayment): Promise<PensionPayment> {
    const id = randomUUID();
    const payment: PensionPayment = { ...insertPayment, id };
    this.pensionPayments.set(id, payment);
    return payment;
  }

  async getPensionPayment(paymentId: string): Promise<PensionPayment | undefined> {
    return Array.from(this.pensionPayments.values()).find(
      (payment) => payment.paymentId === paymentId
    );
  }

  async getPensionPaymentsByCustomer(customerId: string): Promise<PensionPayment[]> {
    return Array.from(this.pensionPayments.values()).filter(
      (payment) => payment.customerId === customerId
    );
  }
}

export const storage = new MemStorage();
