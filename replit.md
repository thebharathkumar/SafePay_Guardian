# SafePay Guardian - Legacy Payment Transformation Platform

## Overview

SafePay Guardian is a web-based platform designed for Madhuri Dixit Community Bank (MDCB) that transforms legacy payment formats (SWIFT MT103 and NACHA ACH) into modern ISO 20022 XML standards while providing fraud detection specifically targeted at protecting senior citizens (65+) from common financial scams.

The application serves as a case competition demonstration of real-time payment modernization for community banks, with particular focus on Persona 3 users (retirees) who are vulnerable to fraud schemes like IRS scams, grandparent emergency scams, and social security suspension scams.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite as the build tool and bundler.

**UI Component System**: Radix UI primitives with shadcn/ui component library, customized for senior accessibility with enlarged typography (18px minimum body text, never smaller than 16px for labels) and high-contrast banking-themed colors following WCAG AAA standards.

**Design Philosophy**: Material Design principles adapted for seniors aged 65+, emphasizing:
- Senior-first accessibility with larger touch targets (minimum 48px × 48px)
- Progressive disclosure to prevent cognitive overload
- Trust signals through banking-grade professionalism
- Enhanced spacing and readability (line height 1.6-1.8)

**State Management**: TanStack React Query for server state management and caching, with custom query client configured for API interactions.

**Routing**: Wouter for lightweight client-side routing with three main routes:
- Dashboard (`/`) - Overview and statistics
- Transform (`/transform`) - Payment transformation interface
- History (`/history`) - Transaction history and search

**Styling**: Tailwind CSS with custom configuration for senior-friendly design tokens, including enlarged font scales and banking-themed color palette using CSS custom properties.

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**API Design**: RESTful API with the following main endpoints:
- `POST /api/transform` - Transform legacy payment formats to ISO 20022
- `GET /api/transactions` - Retrieve all transactions
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/dashboard/stats` - Dashboard statistics

**Payment Transformation Logic**:
- MT103 transformer (`server/transformers/mt103.ts`) - Parses SWIFT MT103 messages and converts to ISO 20022 pacs.008.001.08 XML format
- NACHA transformer (`server/transformers/nacha.ts`) - Parses NACHA ACH files and converts to ISO 20022 pain.001.001.09 XML format
- Each transformer extracts structured data from fixed-format legacy messages and generates compliant XML

**Fraud Detection System** (`server/fraud-detection.ts`):
- OpenAI GPT-5 integration for AI-powered fraud analysis
- Pattern-based detection for common senior-targeted scams:
  - IRS Tax Scam (keywords: "irs", "tax", "penalty", "arrest")
  - Grandparent Emergency Scam (keywords: "emergency", "urgent", "accident", "bail")
  - Social Security Suspension (keywords: "social security", "ssn", "suspended")
- Confidence scoring with configurable thresholds per scam type
- Educational content with prevention tips for each scam pattern

**Data Storage**: In-memory storage implementation (`server/storage.ts`) using Map-based data structures for:
- Transactions
- Fraud patterns
- Customers
- Pension payments

Note: While the repository is configured for PostgreSQL with Drizzle ORM (schema defined in `shared/schema.ts`), the current runtime uses in-memory storage for demo purposes.

### Data Schema

**Core Entities** (defined in `shared/schema.ts`):

1. **Transactions**: Stores payment transformation records with fraud detection results
   - Transaction details (amount, currency, parties)
   - Source format (MT103 or NACHA)
   - Generated ISO 20022 XML
   - Fraud scores, flags, and detected scam types
   - Status tracking (pending, approved, blocked, reviewing)

2. **Fraud Patterns**: Catalog of known scam patterns with detection rules

3. **Customers**: Customer profiles with age information for age-appropriate fraud alerts

4. **Pension Payments**: Tracking of pension/social security payments

**Validation**: Zod schemas for runtime type validation and automatic schema inference from Drizzle ORM table definitions.

### External Dependencies

**Database**: 
- Drizzle ORM configured for PostgreSQL via Neon serverless driver
- Connection string expected in `DATABASE_URL` environment variable
- Migration files stored in `/migrations` directory
- Current implementation uses in-memory storage as fallback

**AI Services**:
- OpenAI API (GPT-5 model) for fraud detection analysis
- Configured via environment variables:
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - `AI_INTEGRATIONS_OPENAI_API_KEY`

**UI Component Libraries**:
- Radix UI - Accessible component primitives (@radix-ui/react-*)
- shadcn/ui - Pre-built component implementations
- Recharts - Data visualization for analytics
- Lucide React - Icon system
- Embla Carousel - Carousel components

**Build Tools**:
- Vite - Frontend build tool and dev server
- esbuild - Backend bundler for production builds
- PostCSS with Tailwind CSS for styling
- TypeScript compiler for type checking

**Development Tools**:
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner
- tsx for running TypeScript in development

**Form Management**:
- React Hook Form with Zod resolvers for form validation

**Date Handling**:
- date-fns for date formatting and manipulation

**Session Management**:
- connect-pg-simple for PostgreSQL session storage (configured but not actively used)