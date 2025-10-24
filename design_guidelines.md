# SafePay Guardian Design Guidelines

## Design Framework
Material Design (Material-UI) customized for senior banking users with enhanced accessibility and trust signals.

### Core Principles
1. **Senior-First Accessibility** - Optimized for 65+ users with vision/dexterity challenges
2. **Trust Through Clarity** - Banking-grade professionalism, simplified UI
3. **Protective Design** - Prominent fraud alerts and education
4. **Progressive Disclosure** - Prevent cognitive overload

---

## Typography

### Scale (Enlarged for Seniors)
- **Hero/Display:** 36-60px (text-4xl to text-6xl), Bold
- **Page Titles:** 30px (text-3xl), Semibold
- **Section Headers:** 24px (text-2xl), Semibold
- **Card Titles:** 20px (text-xl), Medium
- **Body Text:** 18px (text-lg), Regular — **MINIMUM**
- **Captions/Labels:** 16px (text-base), Medium — **NEVER SMALLER**
- **Buttons:** 18px (text-lg), Semibold

### Requirements
- **Line height:** 1.6-1.8
- **Letter spacing:** 0.01em-0.02em
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700) — avoid thin
- **Fonts:** Inter, Roboto, or Open Sans

---

## Layout & Spacing

### Spacing Scale (Tailwind)
**Primary units:** 4, 6, 8, 12, 16, 24 (p-4, m-6, space-y-12, etc.)

### Grid Structure
- **Desktop:** max-w-7xl with px-8 to px-12
- **Cards:** Single column mobile, 2-col tablet (md:), 3-col max desktop (lg:)
- **Transactions:** Always single column
- **Dashboard:** 2-col desktop, stack mobile
- **Touch targets:** Minimum 48px × 48px

---

## Color & Contrast

### Accessibility
- **WCAG AAA** contrast ratios required
- **Focus indicators:** outline-offset-2, ring-4 (visible keyboard navigation)

### Fraud Risk Levels
- **Low:** Green
- **Medium:** Yellow  
- **High:** Red

---

## Components

### Navigation
**Top Bar (Fixed):**
- Bank logo (120px × 40px)
- Menu: Dashboard, Transform Payments, History, Help
- Emergency support button (right, distinct)
- User profile with name

**Sidebar (Desktop Optional):**
- Persistent on lg+ screens
- Large icons + text labels (never icon-only)
- Strong active state indicator

### Dashboard

**Balance Cards:**
- text-4xl amounts, p-8 to p-12 padding
- Single metric per card, shadow-md elevation
- Descriptive labels above numbers

**Quick Actions:**
- Max 4 buttons in 2×2 grid
- Icon + text, 120px × 120px minimum
- Clear visual separation

**Recent Activity:**
```
• Recipient (text-xl, semibold)
• Amount (text-2xl, bold) + Status badge  
• Date/time (text-base)
• Fraud score badge (color-coded)
• Vertical spacing: space-y-6
```

**Pension Tracker:**
- Timeline with date markers
- Status: Sent → Received → Cleared → Available
- "Next Expected Payment" section

### Transform Payments

**Layout:**
- Desktop: 60/40 split (Input left, Preview right)
- Mobile: Stacked single column
- Right column sticky on desktop

**File Upload:**
- Dropzone: 400px × 300px minimum
- "Click to Upload" + drag-drop instructions
- Show formats: MT103, NACHA
- Sample file downloads

**Format Selection:**
- Large radio buttons/segmented control
- Labels: "SWIFT MT103", "NACHA CCD"
- Visual icons for each

**XML Output:**
- Monaco Editor, 500px min height
- Large Copy + Download buttons
- Validation banner above (success/error)

**Step Indicator:**
Upload → Transform → Validate → Download  
(Current highlighted, completed checkmarked)

### Fraud Detection

**Alert Modal (High Priority):**
```
• Large modal (md:max-w-2xl)
• Red warning icon (3rem)
• Title: text-3xl, bold
• Fraud score (0-100)
• Detected patterns list
• "Why Suspicious" education (3-5 bullets)
• Actions: "Review Transaction" (primary), "Proceed Anyway" (secondary + confirmation)
```

**Transaction Fraud Badge:**
- Inline color-coded score
- Expandable: Shows signals + explanation
- Optional timeline view

**Scam Education Cards:**
- Icon + scam name header
- Description (2-3 sentences)
- "How to Protect Yourself" (3-4 tips)
- "Learn More" expandable

### Transaction History

**Filters (Top Bar):**
- Date range calendar picker
- Type dropdown (large options)
- Fraud score slider (clear labels)
- "Clear Filters" always visible

**Transaction List:**
- Virtualized scrolling
- Expandable cards
- Summary: 3-line format
- Expanded: Full details + XML + fraud analysis

### Support

**Floating Widget (Bottom-Right):**
- 64px × 64px minimum
- Expands to show:
  - Call Now (text-xl phone number)
  - Request Callback form
  - Live Chat

**Callback Form:**
- min-h-14 inputs
- Labels above (not placeholders)
- Phone formatting guidance
- Large time selector buttons
- w-full submit, py-4

---

## Interaction Patterns

### Buttons
- **Corners:** rounded-lg to rounded-xl
- **Padding:** px-8 py-4 minimum
- **Always:** Text labels (never icon-only)
- **Primary:** shadow-lg elevation
- **Secondary:** Outlined
- **Destructive:** Warning styling
- **On images:** backdrop-blur-sm with semi-transparent bg

### Forms
- **Inputs:** min-h-14, labels above (text-lg)
- **Helper text:** Below inputs
- **Errors:** Inline red text + icon
- **Success:** Green checkmark
- **Mobile:** One input per row

### Cards
- **Elevation:** shadow-md or shadow-lg
- **Corners:** rounded-xl
- **Padding:** p-8 to p-12

### Modals
- **Desktop:** md:max-w-2xl to md:max-w-4xl
- **Mobile:** Full-screen
- **Close button:** Top-right, large target
- **Backdrop:** Semi-transparent overlay

### Loading States
- Skeleton screens for data
- Large spinner + text ("Transforming payment...")
- Progress bars for multi-step

---

## Page Layouts

### Dashboard
**Hero:** Compact banner (py-12) with greeting, account status, fraud alerts  
**Grid:** 
1. Account cards (2-col desktop)
2. Recent activity (full-width)
3. Quick actions + alerts (sidebar, stacks mobile)

### Transform Payments
Two-column desktop, sticky preview  
Step indicator at top

### Transaction History
Filters bar → Transaction list (virtualized)

---

## Assets & Icons

### Images
- **Bank logo:** Header, 120px × 40px
- **Security badges:** FDIC, SSL (footer)
- **Educational:** Simple line art, 150px × 150px
- **No hero backgrounds** — focus on functionality

### Icons
- Material Icons or Heroicons
- **Minimum:** 24px (1.5rem)
- **Always** paired with text labels
- Fraud: Shield, Warning triangle, Checkmark

---

## Animation
**Minimal, purposeful only:**
- Page transitions: 150-300ms fade
- Modal entry: Gentle scale + fade
- Loading: Subtle spinner rotation
- Fraud alerts: Gentle pulse (not alarming)
- **Avoid:** Parallax, scroll animations, continuous motion

---

## Mobile Requirements
- 48px minimum touch targets
- No hover-dependent interactions
- Hamburger menu if labeled clearly
- Swipe actions for common operations

---

## Accessibility Checklist
✓ WCAG AAA contrast  
✓ Keyboard navigation with visible focus  
✓ Proper ARIA labels, semantic HTML  
✓ 48px × 48px touch targets  
✓ Live regions for errors  
✓ Inline form validation  
✓ No time-sensitive interactions without extensions