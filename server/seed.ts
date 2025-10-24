import { storage } from "./storage";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed fraud patterns
  const fraudPatternData = [
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

  console.log("📋 Creating fraud patterns...");
  for (const pattern of fraudPatternData) {
    await storage.createFraudPattern(pattern);
  }

  // Seed sample customer
  console.log("👤 Creating sample customer...");
  const customer = await storage.createCustomer({
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

  // Seed sample transactions
  console.log("💸 Creating sample transactions...");
  const transactionData = [
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

  for (const tx of transactionData) {
    await storage.createTransaction(tx);
  }

  // Seed sample pension payment
  console.log("💰 Creating sample pension payment...");
  await storage.createPensionPayment({
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

  console.log("✅ Database seeded successfully!");
}

seed().catch(console.error);
