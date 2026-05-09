# GEO Score: AI Local Visibility Auditor
## Complete Product Whitepaper

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** MVP + Phase 2 Features Live, Tier 1 Value Features Released, Demo Monetization Active

---

## Executive Summary

**GEO Score** is a web-based SaaS platform that audits how visible local businesses are to AI search engines (ChatGPT, Perplexity, Gemini, Google AI) and to traditional search (Google, Yelp, BBB). It solves a critical problem that existing tools ignore: **AI visibility**.

As AI search engines replace traditional Google searches, local business owners face a new challenge: *"Can AI find my business?"* GEO Score answers that question and provides actionable fixes in minutes.

**Current Offering:**
- Free tier: 5 audits/month
- Pro tier: $19/month, unlimited audits + premium features
- All data persists in browser localStorage (currently), no backend database required for MVP

---

## The Problem

### Why This Matters

Traditional local SEO tools (SEMrush, Moz, Ahrefs) optimize for Google Search. But the competitive landscape has shifted:

1. **ChatGPT, Perplexity, and Gemini now serve local recommendations**
   - Users ask "best plumber in San Francisco" → AI returns specific businesses
   - AI pulls from web crawls, citations, reviews, and structured data
   - Visibility in AI results ≠ visibility in Google results

2. **Business Owners Are Lost**
   - They don't know if AI search engines recommend them
   - They don't know which directories matter for AI visibility
   - They don't know how to optimize for AI (vs. Google)

3. **NAP Inconsistencies Hurt Visibility**
   - Name/Address/Phone mismatches across directories confuse AI models
   - A plumber listed as "Mike's Plumbing" on Google but "Michael's Plumbing" on Yelp appears as different businesses
   - AI citation models penalize inconsistency

### The Opportunity

Solo local business owners (plumbers, electricians, salons, dentists, etc.) will pay $19/month to:
- See if AI search engines recommend them
- Find NAP inconsistencies dragging them down
- Get step-by-step fixes to improve AI visibility
- Track improvement over time

---

## Product: What GEO Score Does

### Core Audit Engine (MVP)

**What it audits:**
1. **NAP Consistency Across 5 Sources**
   - Google Business
   - Yelp
   - Facebook
   - LinkedIn
   - BBB

2. **Search Results Processing**
   - Uses Brave Search API to find business listings
   - Extracts Name, Address, Phone via regex + NLP
   - Detects mismatches: "Joe's Plumbing" vs "Joseph's Plumbing"

3. **GEO Visibility Score (0-100)**
   - Weighted composite of:
     - **Visibility (40%):** How many sources mention the business, top-3 placement rate
     - **Authority (35%):** Quality of mention (direct recommendation vs. listed vs. contextual)
     - **Momentum (25%):** Trend velocity (is visibility growing?)
   - Color-coded: Green (75+), Yellow (50-74), Red (<50)

4. **Actionable Issues**
   - Lists specific problems: "Phone mismatch on Yelp", "Missing address on LinkedIn"
   - Prioritized by impact (high/medium/low)
   - Ranked by platform importance (Google/Yelp > Facebook/LinkedIn)

### Phase 2 Features (Completed)

**PDF Reports**
- Print-optimized audit reports via browser print
- Full breakdown: score ring, NAP table, action items, schema, keywords
- Use case: Send to clients or archive

**Alert System**
- Tracks prior audits in localStorage
- Detects score improvements/declines
- Flags new issues and stale audits (14+ days old)
- Shows colored banners: 🟢 +8 pts / 🔴 -5 pts / 🟡 Stale

**Review Automation**
- Searches for customer reviews via Brave Search
- Extracts snippets + star ratings from Yelp, Google, Trustpilot
- AI-generates professional response templates via Groq LLM
- Users can copy/paste responses directly into review platforms

**Multi-Business Dashboard**
- Save unlimited businesses to localStorage
- View all saved audits in card grid
- Re-audit with one click (pre-fills form)
- Export all audits as JSON
- Score trend arrows (↑ improving, ↓ declining)

**Agentic Directory**
- Public `/directory` page for AI crawlers
- JSON-LD structured data for each business
- `/llms.txt` plain-text documentation
- `/api/directory` endpoint returns API documentation
- Allows AI systems to discover GEO Score

### Tier 1 Value Features (Released)

**AI Citation Tracker** ⭐
- Queries Groq LLM with 3 realistic local search prompts:
  - "Who are the best {trade} in {city}? Top 5?"
  - "I need a trusted {trade} near {city}. Recommend someone."
  - "What is the top-rated {trade} in {city}?"
- Detects if business name appears in AI responses
- Shows rank if mentioned (e.g., "#2 recommendation")
- New "AI Visibility" tab in audit results
- Directly answers: *"Do AI search engines recommend me?"*

**Quick Fix Wizard** 🛠️
- Step-by-step guided workflow (not flat lists)
- Per-issue: micro-steps, direct platform links, NAP copy buttons
- Progress bar: "Issue 3 of 5"
- "Mark as Fixed ✓" checkboxes with visual tracking
- "Open {Platform} →" buttons with claim/edit URLs
- Dramatically improves user conversion vs. static action lists

**Monthly Trends Chart** 📈
- Appends each audit to localStorage history (max 12 entries, auto-reset monthly)
- Dashboard shows SVG line chart per business
- Color: Green if trending up, Red if down, Gray if flat
- Trend arrow next to score (↑/↓)
- Proves ROI: "Your AI visibility improved 12% this month"

---

## Monetization Strategy

### Pricing Tiers

| Feature | Free | Pro ($19/month) |
|---------|------|-----------------|
| Audits/month | 5 | Unlimited |
| Saved businesses | ∞ | ∞ |
| NAP audit | ✅ | ✅ |
| AI Visibility check | ✅ | ✅ |
| Quick Fix Wizard | ✅ | ✅ |
| Trends chart | ✅ | ✅ |
| PDF Reports | ❌ | ✅ |
| Review automation | ❌ | ✅ |
| AI response generation | ❌ | ✅ |

### Demo Monetization (Current)

**Implemented:**
- Mock auth system in localStorage
- Audit counter: "3/5 audits used this month"
- Monthly reset (auto-resets on calendar month boundary)
- Membership modal triggers:
  - When free user hits 5-audit limit
  - When free user tries Pro feature (PDF, reviews)
- Header toggle button to switch Free ↔ Pro for testing
- "PRO" badge on premium buttons

**How It Works:**
1. Free user runs 5 audits → 6th blocks with modal
2. Modal shows Free vs Pro comparison table
3. Click "Upgrade Now (Demo)" → toggles to Pro
4. Now unlimited audits + premium features work

**Why This Approach:**
- Tests monetization UX without Stripe setup
- Validates pricing and feature gates
- Identifies friction points before real payments
- Users can try all Pro features risk-free

### Real Monetization (Roadmap)

**To Go Live:**
1. Set up Supabase (auth + PostgreSQL database)
2. Integrate Stripe (checkout + billing portal)
3. Replace mock auth with real user accounts
4. Track plans & audit usage per user in database
5. Webhook handlers for subscription events
6. Same modal UI, connected to real backend

---

## Target Customer

### Primary: Solo Local Business Owners

**Profile:**
- Own/operate 1-5 local service businesses
- Plumbers, electricians, HVAC, salons, dentists, accountants, etc.
- Revenue: $100k-$2M annually
- Tech comfort: Low-to-medium (needs simple UX)
- Pain: Lost customers to AI search, unsure why

**Jobs to Be Done:**
1. "I need to know if ChatGPT recommends me"
2. "I need to fix my inconsistent business info"
3. "I need to improve how AI sees my business"
4. "I need proof that my efforts worked" (trends)

**Willingness to Pay:**
- Free tier: Test without credit card
- Pro tier: $19/month = easy sell if they see value
- 10-20% conversion rate (free → paid) is healthy for SaaS

### Secondary: SEO Agencies

**Profile:**
- Manage 50-500 client locations
- Rebrand GEO Score for clients
- Want bulk audit capability

**Future:** White-label tier at $99-499/month (post-MVP)

---

## Competitive Advantage

### Why GEO Score Wins

1. **AI Visibility Focus (Unique)**
   - Only tool that audits for ChatGPT/Perplexity/Gemini
   - Competitors (Moz, SEMrush, Ahrefs) only optimize for Google
   - Market gap: $100B+ AI search market has no local visibility tool

2. **Simplicity**
   - Works in browser, no install needed
   - Results in 30 seconds
   - Not overwhelming like enterprise SEO tools

3. **Actionable**
   - Not just "you have problems" — step-by-step fixes
   - Direct links to platforms where fixes are made
   - Copy/paste NAP data
   - Clear ROI (trends chart)

4. **Low Cost to Operate**
   - No backend database (MVP phase)
   - Uses existing APIs (Brave Search, Groq LLM)
   - Browser-based = no server scaling costs
   - localStorage = no data storage infrastructure

### Differentiation from Competitors

| Aspect | GEO Score | Google My Business | SEMrush | Moz Local |
|--------|-----------|-------------------|---------|-----------|
| **AI Visibility** | ✅ Core feature | ❌ None | ❌ None | ❌ None |
| **NAP Audit** | ✅ 5 sources | ✅ 1 platform | ⚠️ Limited | ✅ 100+ sources |
| **Price** | $19/mo free tier | Free | $120+/mo | $100+/mo |
| **Setup** | 1 click | Account required | Complex | Complex |
| **Target** | Solo owners | Requires listing | Enterprise | Enterprise |

---

## Technical Architecture

### Frontend (Current)

**Stack:**
- Next.js 16 (React)
- TypeScript
- Tailwind CSS
- Lucide Icons
- Browser localStorage (no backend needed)

**Key Components:**
- `app/page.tsx` — Main audit interface
  - Form inputs: business name, city, state, trade
  - 8 tabs: NAP Audit, Quick Fixes, Timeline, AI Visibility, Schema, Competitors, Reviews, GMB Content
  - Real-time score ring visualization
- `app/dashboard/page.tsx` — Business management
  - Card grid of saved businesses
  - Trends charts per business
  - Re-audit, delete, export actions
- `app/pricing/page.tsx` — Pricing page (future)
- `app/settings/page.tsx` — User account (future)

**State Management:**
- React hooks (useState, useEffect)
- localStorage for persistence
- Mock auth system (current), Supabase (future)

### Backend APIs (Current)

All routes are Next.js API handlers (`app/api/*/route.ts`):

**POST /api/audit**
- Input: businessName, city, state
- Searches 5 sources via Brave API
- Parses NAP data via regex + fuzzy matching
- Returns: NAPAudit with score, entries, issues, canonical NAP

**POST /api/generate**
- Input: businessName, city, state, audit
- Calls Groq LLM (llama-3.3-70b-versatile)
- Generates: 750-char description, keywords, review templates
- Returns: GMBContent object

**POST /api/schema**
- Input: businessName, city, state, audit
- Builds JSON-LD LocalBusiness schema deterministically
- Returns: schemaJson string (no LLM call)

**POST /api/citations**
- Input: businessName, city, state, trade
- Queries Groq with 3 local search prompts
- Detects business mentions in responses
- Returns: CitationResult[] with mention status, rank, snippets

**POST /api/reviews**
- Input: businessName, city
- Searches Brave for reviews (Yelp, Google, Trustpilot)
- Extracts ratings + snippets
- Returns: ReviewResult[] (up to 5)

**POST /api/reviews/respond**
- Input: businessName, city, reviews[]
- Calls Groq to generate professional responses
- Returns: { responses: string[] } (5 templates)

**POST /api/competitors**
- Input: trade, city, state
- Searches Brave for "best {trade} in {city}"
- Deduplicates business names
- Returns: Competitor[] (top 5 ranked)

**GET /api/directory**
- No auth required
- Returns structured API docs + example queries
- Used by AI crawlers to understand GEO Score

### External Dependencies

**APIs Used:**
- **Brave Search API** — Web search for NAP/reviews/competitors
  - Cost: ~$0.01 per 1000 queries
  - Rate limit: 10 req/sec
- **Groq API** — LLM for content generation & citations
  - Model: llama-3.3-70b-versatile (configurable)
  - Cost: ~$0.20 per 1000 tokens
  - Free tier: 10k tokens/day
- **libphonenumber-js** — Phone number parsing/normalization

**Storage:**
- Browser localStorage (client-side only, MVP phase)
- Future: Supabase PostgreSQL

---

## How It Works: User Journey

### Typical Workflow

**Step 1: Audit (30 seconds)**
- User enters: "Mike's Plumbing", "San Francisco", "CA", "Plumber"
- Clicks "Run GEO Audit"
- App searches 5 sources simultaneously
- Score displays: 68/100 (Yellow — needs improvement)

**Step 2: Understand Issues (2 min)**
- "Quick Fixes" tab shows 3 prioritized action items
  - HIGH: Phone mismatch on Yelp (impact: +12 pts)
  - MEDIUM: Missing address on LinkedIn (impact: +8 pts)
  - LOW: Name variant on BBB (impact: +3 pts)
- Each issue shows step-by-step micro-instructions

**Step 3: Check AI Visibility (1 min)**
- "AI Visibility" tab shows 3 query results:
  - ✅ Mentioned #2 in "best plumbers in SF" query
  - ❌ Not found in "trusted plumber near SF" query
  - ✅ Mentioned #1 in "top-rated plumber SF" query
- Result: 2/3 mentions = 67% AI visibility

**Step 4: Fix Issues (10-15 min per issue)**
- Click "Open Yelp →" button → opens biz.yelp.com in new tab
- Follow numbered steps
- Copy/paste canonical NAP from modal
- Return and mark issue as fixed

**Step 5: Track Progress (Optional)**
- Save business to dashboard
- Run re-audit in 1 week
- Dashboard shows trend line: score improved from 68 → 75 (+7 pts)

### Feature Usage by Plan

**Free User (5 audits/month):**
- Runs 5 audits across different businesses
- See NAP issues, AI visibility, action items
- Cannot: Download PDFs, generate review responses, optimize keywords
- After 5th audit: Modal prompts upgrade

**Pro User ($19/month):**
- Unlimited audits
- All free features +
- PDF reports to print/email
- Review automation (find + respond to reviews)
- All premium analytics

---

## Roadmap

### Phase 1: MVP (✅ Complete)
- Core NAP audit engine
- 5-source Brave search
- GEO visibility score (0-100)
- Basic UI with tabs
- localStorage persistence

### Phase 2: Value Features (✅ Complete)
- PDF reports
- Alert system (score change detection)
- Review automation
- Multi-business dashboard
- Agentic directory (/llms.txt, /api/directory)

### Phase 3: Tier 1 Monetization (✅ Complete)
- AI Citation Tracker (query AI engines)
- Quick Fix Wizard (step-by-step guidance)
- Monthly Trends Chart (score history)
- Demo paywall (localStorage-based)

### Phase 4: Real Monetization (Next, 1-2 weeks)
- Supabase auth (email + password)
- PostgreSQL database
- Real Stripe integration (checkout + billing portal)
- Membership modal → real payments
- Rate limiting by plan

### Phase 5: Team & White-Label (3-4 weeks)
- Team accounts (share audits)
- Client portal (view-only access)
- White-label version for agencies
- API access tier for integrations

### Phase 6: AI Features (Advanced)
- Competitor benchmarking (compare vs. local rivals)
- Citation building (guide to high-value directories)
- Local keyword research (search volume, difficulty)
- Content calendar (GMB post scheduling)

---

## Business Model

### Revenue Streams

1. **SaaS Subscriptions (Primary)**
   - Free: $0, but limited to 5 audits/month
   - Pro: $19/month, unlimited + premium features
   - Expected CAC: $5-20 (low acquisition cost, word-of-mouth)
   - Expected LTV: $500+ per user (annual)

2. **API Access (Future)**
   - Agencies: $99-499/month to embed in their tools
   - Bulk audit endpoint for white-label

3. **White-Label (Future)**
   - Agencies rebrand GEO Score
   - $499-999/month per agency

### Unit Economics

**Per Free User Converting to Pro:**
- Acquisition cost: $5 (organic + word-of-mouth)
- Gross margin per user: 85% (low server costs)
- Year 1 revenue: $228 ($19 × 12 months)
- Payback period: <1 month
- Expected LTV: $500-1000 over 3 years

**At 1,000 Pro Users:**
- Monthly revenue: $19,000
- Annual revenue: $228,000
- Operating costs: ~$15,000/month (servers, APIs, team)
- Gross margin: 80%+

---

## Competitive Positioning

### Market Landscape

**Direct Competitors (Traditional Local SEO):**
- SEMrush Local: $120+/month, enterprise-focused
- Moz Local: $100+/month, for agencies
- Google My Business: Free, single-platform only

**Indirect Competitors (General SEO):**
- Ahrefs, Semrush, SE Ranking (all $100+/month)
- All focus on Google ranking, not AI visibility

**GEO Score's Niche:**
- **Only tool built specifically for AI search visibility**
- **Lowest price point** ($19/month vs. $100+)
- **Fastest time-to-insight** (30 seconds vs. 10 minutes)
- **Simplest UX** (3 clicks vs. overwhelming dashboards)

### Why We Win

1. **Right Problem, Right Time**
   - AI search is mainstream (ChatGPT 200M+ users)
   - Local businesses are losing customers to "AI said go to competitor"
   - Existing tools don't address this at all

2. **Low CAC, High LTV**
   - Solo owners will pay $19/month to stay visible in AI
   - Word-of-mouth spreads fast in local business communities
   - No enterprise sales cycle needed

3. **Network Effect**
   - As more businesses use GEO Score, our directory becomes valuable
   - AI crawlers benefit from structured data
   - Creates flywheel: tool → better audits → more users → better directory

---

## Conclusion

**GEO Score is solving a critical gap in the market:** How can local businesses optimize for AI search engines?

As AI search becomes the primary way people discover local services, businesses that don't appear in AI results will lose customers. GEO Score makes optimizing for AI visibility as simple as a 30-second audit and provides step-by-step fixes.

**Current Status:**
- ✅ MVP complete (NAP audit + scoring)
- ✅ Phase 2 complete (dashboards, reports, reviews)
- ✅ Tier 1 features complete (AI citations, fix wizard, trends)
- ✅ Demo monetization live
- 🔄 Real Stripe integration (next)

**Path to $1M ARR:**
- 5,000 Pro users × $19/month × 12 months = $1.14M ARR
- Realistic in 12-18 months at current organic growth trajectory

**Next Steps:**
1. Launch real Stripe monetization (week 1)
2. Marketing push to local business communities (weeks 2-4)
3. Monitor conversion rates, optimize pricing (weeks 4-8)
4. Expand to agencies (white-label) (month 3)

---

## Appendix: Technical Specifications

### System Architecture Diagram

```
┌─────────────────────┐
│   Browser Client    │
│  (Next.js React)    │
└──────────┬──────────┘
           │
           ├─→ localStorage (user plan, audits, history)
           │
           ├─→ POST /api/audit
           ├─→ POST /api/generate
           ├─→ POST /api/schema
           ├─→ POST /api/citations
           ├─→ POST /api/reviews
           └─→ POST /api/reviews/respond
                    │
                    ├─→ Brave Search API (web search)
                    └─→ Groq API (LLM)
```

### Data Models

**NAPAudit** (audit result)
```typescript
{
  canonical: { name, address, phone },
  entries: NAPEntry[],  // per-source findings
  issues: string[],     // specific problems
  score: number         // 0-100 GEO score
}
```

**SavedBusiness** (dashboard persistence)
```typescript
{
  id, businessName, city, state, trade,
  score, issueCount, savedAt,
  audit: NAPAudit
}
```

**HistoryEntry** (trends tracking)
```typescript
{
  score: number,
  issueCount: number,
  timestamp: number
}
```

---

**END OF WHITEPAPER**
