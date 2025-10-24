import OpenAI from "openai";
import type { FraudResult } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Common scam patterns targeting seniors
const SCAM_PATTERNS = {
  "IRS Tax Scam": {
    triggerWords: ["irs", "tax", "penalty", "arrest", "warrant", "federal", "treasury", "tax debt"],
    typicalAmountMin: 500,
    typicalAmountMax: 10000,
    confidenceThreshold: 0.6,
    description: "Scammers impersonate IRS agents demanding immediate payment for tax debts",
    preventionTips: [
      "The IRS never calls to demand immediate payment",
      "The IRS never threatens arrest over the phone",
      "The IRS contacts you by mail first",
      "Don't provide personal information to unsolicited callers",
      "Call the IRS directly at 1-800-829-1040 if concerned"
    ]
  },
  "Grandparent Emergency Scam": {
    triggerWords: ["emergency", "urgent", "accident", "hospital", "bail", "grandchild", "grandson", "granddaughter", "help me", "don't tell"],
    typicalAmountMin: 1000,
    typicalAmountMax: 15000,
    confidenceThreshold: 0.65,
    description: "Scammers pretend to be grandchildren in emergency situations needing money",
    preventionTips: [
      "Always verify by calling your grandchild directly",
      "Ask questions only the real person would know",
      "Be suspicious of requests for secrecy",
      "Never wire money for emergencies",
      "Contact other family members to verify"
    ]
  },
  "Social Security Suspension": {
    triggerWords: ["social security", "ssn", "suspended", "fraud", "suspend", "social security number", "compromised", "freeze"],
    typicalAmountMin: 200,
    typicalAmountMax: 5000,
    confidenceThreshold: 0.7,
    description: "Scammers claim Social Security number has been suspended due to suspicious activity",
    preventionTips: [
      "Social Security numbers are NEVER suspended",
      "SSA never calls to demand payment",
      "Contact SSA directly at 1-800-772-1213",
      "Don't give SSN to unsolicited callers",
      "Report suspicious calls to SSA Inspector General"
    ]
  },
  "Tech Support Scam": {
    triggerWords: ["microsoft", "apple", "computer", "virus", "infected", "tech support", "security alert", "malware", "firewall"],
    typicalAmountMin: 200,
    typicalAmountMax: 2000,
    confidenceThreshold: 0.65,
    description: "Scammers pose as tech support claiming computer issues that need immediate payment",
    preventionTips: [
      "Microsoft and Apple never cold-call customers",
      "Never give remote access to unsolicited callers",
      "Don't trust pop-up warnings",
      "Use official support channels only",
      "Install reputable antivirus from known companies"
    ]
  }
};

export async function analyzeFraud(
  amount: number,
  remittanceInfo: string,
  recipientName: string = "",
  customerAge?: number
): Promise<FraudResult> {
  const signals: string[] = [];
  const detectedScams: Array<{
    name: string;
    confidence: number;
    description: string;
    preventionTips: string[];
    matchedTriggers: string[];
  }> = [];

  let fraudScore = 0;
  const textToAnalyze = `${remittanceInfo} ${recipientName}`.toLowerCase();

  // Rule-based detection
  for (const [scamName, pattern] of Object.entries(SCAM_PATTERNS)) {
    const matchedTriggers: string[] = [];
    let matchCount = 0;

    for (const trigger of pattern.triggerWords) {
      if (textToAnalyze.includes(trigger.toLowerCase())) {
        matchedTriggers.push(trigger);
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min((matchCount / pattern.triggerWords.length) * 100, 95);
      
      if (confidence >= pattern.confidenceThreshold * 100) {
        detectedScams.push({
          name: scamName,
          confidence,
          description: pattern.description,
          preventionTips: pattern.preventionTips,
          matchedTriggers
        });

        signals.push(`Detected ${scamName} keywords: ${matchedTriggers.join(', ')}`);
        fraudScore = Math.max(fraudScore, confidence);
      }
    }

    // Amount-based detection
    if (pattern.typicalAmountMin && pattern.typicalAmountMax) {
      if (amount >= pattern.typicalAmountMin && amount <= pattern.typicalAmountMax && matchCount > 0) {
        signals.push(`Amount matches ${scamName} pattern ($${pattern.typicalAmountMin}-$${pattern.typicalAmountMax})`);
        fraudScore = Math.max(fraudScore, 70);
      }
    }
  }

  // Age-based risk adjustment
  if (customerAge && customerAge >= 65) {
    signals.push("Customer is in senior age group (higher vulnerability)");
    fraudScore = Math.min(fraudScore * 1.2, 95);
  }

  // Urgency detection
  const urgencyWords = ["urgent", "immediately", "right now", "asap", "today", "hurry", "quick"];
  if (urgencyWords.some(word => textToAnalyze.includes(word))) {
    signals.push("Urgent language detected (common pressure tactic)");
    fraudScore = Math.min(fraudScore + 15, 95);
  }

  // Large round amounts
  if (amount >= 1000 && amount % 500 === 0) {
    signals.push("Large round amount (common in scams)");
    fraudScore = Math.min(fraudScore + 10, 95);
  }

  // AI-enhanced analysis using OpenAI (if high initial score and credentials available)
  if (fraudScore >= 50 && detectedScams.length > 0 && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    try {
      const aiAnalysis = await enhanceWithAI(amount, remittanceInfo, recipientName, customerAge);
      if (aiAnalysis.additionalSignals) {
        signals.push(...aiAnalysis.additionalSignals);
      }
      if (aiAnalysis.adjustedScore) {
        fraudScore = Math.min(aiAnalysis.adjustedScore, 95);
      }
    } catch (error) {
      console.error("AI analysis failed, continuing with rule-based detection:", error);
      // Continue with rule-based score - graceful degradation
    }
  }

  const fraudFlag = fraudScore >= 60;

  return {
    fraudScore: Math.round(fraudScore),
    fraudFlag,
    detectedScams,
    signals
  };
}

async function enhanceWithAI(
  amount: number,
  remittanceInfo: string,
  recipientName: string,
  customerAge?: number
): Promise<{ additionalSignals?: string[]; adjustedScore?: number }> {
  try {
    const prompt = `Analyze this payment transaction for senior fraud patterns:
Amount: $${amount}
Recipient: ${recipientName}
Details: ${remittanceInfo}
Customer Age: ${customerAge || 'Unknown'}

Identify any additional fraud signals beyond common keywords. Consider:
1. Emotional manipulation tactics
2. Authority impersonation
3. Unusual payment urgency
4. Requests for secrecy
5. Threats or pressure

Respond in JSON format:
{
  "additionalSignals": ["signal1", "signal2"],
  "scoreAdjustment": number between -10 and +20
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a fraud detection expert specializing in protecting seniors from scams. Analyze transactions and identify manipulation tactics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      additionalSignals: result.additionalSignals || [],
      adjustedScore: result.scoreAdjustment ? undefined : undefined
    };
  } catch (error) {
    console.error("AI enhancement error:", error);
    return {};
  }
}
