# SafePay Guardian - Legacy Payment Transformation Platform

## Overview

SafePay Guardian is a web-based platform designed for Madhuri Dixit Community Bank (MDCB) that transforms legacy payment formats (SWIFT MT103 and NACHA ACH) into modern ISO 20022 XML standards while providing fraud detection specifically targeted at protecting senior citizens (65+) from common financial scams.

The application serves as a case competition demonstration of real-time payment modernization for community banks, with particular focus on Persona 3 users (retirees) who are vulnerable to fraud schemes like IRS scams, grandparent emergency scams, and social security suspension scams.

**New Features (October 2025)**:
- Multi-user support with Replit Auth (OpenID Connect)
- PostgreSQL database persistence with complete data migration
- Callback request system for senior customers to request banker assistance
- Analytics dashboard with fraud trends, transaction metrics, and downloadable reports
- Batch file processing for multiple payment transformations
- Landing page for unauthenticated users with product information

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

**Routing**: Wouter for lightweight client-side routing with five main routes:
- Landing (`/` when unauthenticated) - Product information and login prompt
- Dashboard (`/` when authenticated) - Overview and statistics
- Transform (`/transform`) - Payment transformation interface
- History (`/history`) - Transaction history and search
- Analytics (`/analytics`) - Fraud analytics with charts and downloadable reports

**Styling**: Tailwind CSS with custom configuration for senior-friendly design tokens, including enlarged font scales and banking-themed color palette using CSS custom properties.

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**API Design**: RESTful API with the following main endpoints:

Authentication:
- `GET /api/login` - Initiate Replit Auth login flow
- `GET /api/callback` - OAuth callback handler
- `GET /api/logout` - Logout and clear session
- `GET /api/auth/user` - Get current authenticated user

Payment Processing:
- `POST /api/transform` - Transform single legacy payment to ISO 20022
- `POST /api/transform/batch` - Batch process multiple payment files

Data Retrieval:
- `GET /api/transactions` - Retrieve all transactions for current user
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/dashboard/stats` - Dashboard statistics

Callback Requests:
- `POST /api/callbacks` - Create callback request for banker assistance
- `GET /api/callbacks` - Get all callback requests (banker view)
- `PATCH /api/callbacks/:id` - Update callback request status

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

**Data Storage**: PostgreSQL database with Drizzle ORM (`server/storage.ts`) for persistent data storage:
- Transactions with fraud detection results
- Fraud patterns catalog
- Customers with age-based fraud alerts
- Pension payments tracking
- Callback requests with status management
- Users (from Replit Auth)
- Sessions (for authentication state)

Migration: Successfully migrated from in-memory Map-based storage to PostgreSQL with full data preservation.

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

**Authentication**:
- Replit Auth (OpenID Connect) via `openid-client` library
- Session storage in PostgreSQL via `express-session` and `connect-pg-simple`
- Environment variables:
  - `ISSUER_URL` - OpenID issuer URL (automatically configured by Replit)
  - `SESSION_SECRET` - Session encryption key (automatically configured)

**Database**: 
- Drizzle ORM with PostgreSQL via Neon serverless driver
- Connection string in `DATABASE_URL` environment variable
- Schema push via `npm run db:push` (no manual migrations)
- Active database with persistent user data

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