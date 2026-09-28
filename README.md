# FeedbackMind AI

> **AI-Powered User Feedback Synthesizer for Product Teams with Hindsight Long-Term Memory, Groq AI Analysis, and Product Impact Time Machine.**

FeedbackMind AI transforms chaotic, multi-channel user feedback into grounded strategic intelligence. By pairing fast inference from **Groq LLM** (`openai/gpt-oss-120b`) with the biomimetic memory system of **Hindsight Cloud**, the agent maintains a persistent, evolving understanding of product friction, historical resolutions, and longitudinal sentiment shifts.

---

## 1. Problem

Product and engineering teams ingest hundreds of feedback signals weekly across App Store reviews, Zendesk support tickets, incoming customer emails, NPS surveys, and social media mentions. 

Traditional feedback tools suffer from two major flaws:
1. **No Long-Term Memory**: Static LLM prompts only analyze the current batch in isolation. They forget that checkout was already redesigned 3 months ago or that coupon bugs have recurred across four consecutive releases.
2. **Disconnected Change Tracking**: Teams deploy features and fixes, but have no automated mechanism to measure whether customer sentiment actually shifted before versus after a release without manufactured vanity metrics.

---

## 2. Solution

FeedbackMind AI establishes a continuous cognitive loop:

$$\text{Feedback} \longrightarrow \text{Groq AI Analysis} \longrightarrow \text{Hindsight RETAIN} \longrightarrow \text{Long-Term Memory} \longrightarrow \text{Hindsight RECALL} \longrightarrow \text{Historical Context} \longrightarrow \text{Emerging Insights} \longrightarrow \text{Product Change} \longrightarrow \text{New Feedback} \longrightarrow \text{Before/After Comparison}$$

Every incoming feedback item is analyzed for sentiment, theme, product feature, severity, and user intent, then retained into **Hindsight Cloud**. When product managers ask questions or evaluate product milestones, the agent recalls real historical facts, extracts grounded evidence, and surfaces longitudinal insights.

---

## 3. Key Differentiators & System Roles

### Hindsight Cloud API (Long-Term Memory)
- **Base URL**: `https://api.hindsight.vectorize.io`
- **Role**: Serves as the agent's biomimetic long-term memory across world facts, experiences, observations, and semantic graphs.
- **Operations**:
  - `POST /v1/default/banks/{bank_id}/memories` (Retain feedback facts & product changes)
  - `POST /v1/default/banks/{bank_id}/memories/recall` (Multi-arm parallel retrieval: vector, keyword, entity graph, temporal window)
  - `GET /v1/default/banks/{bank_id}/stats` (Real-time memory bank status & node/link metrics)
- **Zero Mocking Policy**: Every memory status in the UI reflects genuine Hindsight Cloud calls. If Hindsight is unreachable, it clearly displays: `"Memory service unavailable. Please try again."`

### Groq API (High-Velocity Inference & Reasoning)
- **Model**: `openai/gpt-oss-120b` (with `qwen/qwen3.8-27b` fallback)
- **Role**:
  1. Validated JSON feedback categorization (Sentiment, Theme, Feature, Severity, Intent)
  2. Grounded reasoning in **Ask Product Memory**: takes recalled Hindsight memories + stored repository feedback and writes answers that strictly differentiate direct empirical evidence from strategic interpretation.

### SQLite Database (Local Structured Repository)
- **Role**: Fast, reliable transactional storage for tabular reporting, timestamp indices, and high-performance filtering.
- **Tables**:
  - `feedback`: stores ID, user ID, channel source, date, text, sentiment, theme, feature, severity, intent, synthetic demo flag, and Hindsight status.
  - `product_changes`: stores ID, deployment date, feature, title, description, rationale, and targeted problem theme.

---

## 4. Key Features

1. **Intelligence Dashboard**:
   - Total feedback count, sentiment breakdown percentages (Positive, Neutral, Negative)
   - Recharts longitudinal sentiment trajectory over time
   - Top themes and feature distribution bars
   - Live Hindsight Cloud bank facts status indicator
   - Recent ingestion stream with one-click deep trace

2. **Add Feedback**:
   - Ingestion form supporting App Review, Support Ticket, Email, Survey, and Social Media
   - Live Groq AI preview without committing
   - Real-time submission: Groq analysis $\rightarrow$ SQLite insertion $\rightarrow$ Hindsight Cloud retention
   - Pre-configured test scenarios for one-click testing

3. **Emerging Issue Radar**:
   - Longitudinal period comparison (recent vs. previous comparative window)
   - Growth percentage, severity weighting, affected distinct users count
   - Direct links to verbatim customer citations

4. **Feedback Timeline**:
   - Chronological multi-channel feedback stream
   - Multi-dimensional filtering by Source Channel, Product Feature, Theme, Sentiment, and keyword search
   - Clean, unboxed typography adhering to anti-AI slop design standards

5. **Product Changes**:
   - Documented engineering interventions and release changelog
   - Interactive creation modal: commits change description to SQLite and retains memory in Hindsight
   - One-click launch into the Feedback Time Machine

6. **Feedback Time Machine**:
   - Side-by-side Before vs. After comparison for any product milestone
   - Compares feedback volume, positive %, neutral %, negative %, and related complaints
   - Queries Hindsight Recall for historical memories before/after that change
   - Objective phrasing: *"Feedback became more positive during the selected period, with positive sentiment shifting from 0% to 90%."*

7. **Ask Product Memory**:
   - Conversational AI research interface grounded in Hindsight Cloud memory
   - Multi-step visual pipeline tracker (Recall $\rightarrow$ Memories $\rightarrow$ Groq Reasoning $\rightarrow$ Synthesis)
   - Explicit separation of direct empirical evidence vs. strategic interpretation
   - Verified feedback ID citations

8. **Memory Explorer**:
   - Step-by-step cognitive pipeline inspector:
     $$\text{Feedback} \longrightarrow \text{Groq AI} \longrightarrow \text{Hindsight Retain} \longrightarrow \text{Long-Term Memory} \longrightarrow \text{Hindsight Recall} \longrightarrow \text{Related Memories} \longrightarrow \text{Insight}$$
   - Direct interactive Hindsight Recall query sandbox

---

## 5. Architecture & File Structure

```
├── data/
│   └── feedbackmind.sqlite      # SQLite database file
├── server/
│   ├── db.ts                    # SQLite database service & schema
│   ├── groq.ts                  # Groq API client with structured extraction & reasoning
│   ├── hindsight.ts             # Hindsight Cloud API client (Retain, Recall, Stats)
│   └── seedData.ts              # 42 synthetic multi-channel records & product changes
├── src/
│   ├── components/
│   │   ├── AddFeedbackView.tsx  # Feedback ingestion & live analysis
│   │   ├── AskProductMemoryView.tsx # Chat interface with grounded evidence
│   │   ├── DashboardView.tsx    # Summary metrics & Recharts visualizations
│   │   ├── EmergingIssuesView.tsx # Comparative period issue radar
│   │   ├── MemoryExplorerView.tsx # Cognitive pipeline visualization & query sandbox
│   │   ├── Navigation.tsx       # Sidebar navigation & memory connection badge
│   │   ├── ProductChangesView.tsx # Product changelog & intervention logging
│   │   ├── TimelineView.tsx     # Filterable chronological feedback stream
│   │   ├── TimeMachineView.tsx  # Before vs. After milestone comparison
│   │   ├── Toast.tsx            # Global notification container
│   │   └── TopBar.tsx           # Breadcrumbs, pipeline tag, & demo reset
│   ├── api.ts                   # Client-side typed API interface
│   ├── App.tsx                  # Main application orchestrator
│   ├── index.css                # Tailwind styling & typography
│   ├── main.tsx                 # React DOM root entry
│   └── types.ts                 # Shared TypeScript interfaces
├── server.ts                    # Express server mounting API routes & Vite middleware
├── .env.example                 # Environment configuration template
└── package.json                 # Dependencies and execution scripts
```

---

## 6. Setup & Configuration

### Prerequisites
- Node.js $\ge$ 18 or Bun
- Groq API Key
- Hindsight Cloud API Key & Bank ID

### Environment Configuration
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=gsk_...
HINDSIGHT_API_KEY=hsk_...
HINDSIGHT_BANK_ID=feedbackmind-ai
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
PORT=3000
```

### Installation & Run Instructions
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Build for production
npm run build
npm start
```
The application runs at `http://localhost:3000`.

---

## 7. Demo Data & Demonstration Workflow

The application automatically seeds a dataset of **42 synthetic feedback records** and **3 product milestones** across multiple weeks:

### Features Covered
- **Checkout**
- **Login**
- **Notifications**
- **Search**
- **Performance**

### Channel Sources
- App Review, Support Ticket, Email, Survey, Social Media

### Recommended Demo Walkthrough:
1. **View the Dashboard**: Observe the longitudinal sentiment trajectory and top friction themes.
2. **Explore Emerging Issues**: Note the spike in *Notification Overload* tickets prior to the granular controls release.
3. **Launch Feedback Time Machine**:
   - Select **Checkout Simplification** (deployed August 28, 2026).
   - Observe the before state (0% positive, 100% negative complaints about 5 confusing screens and hidden coupon fields).
   - Observe the milestone and the after state (90% positive praise about 3-step checkout and Apple Pay speed).
   - Review the real facts recalled from Hindsight Cloud.
4. **Ask Product Memory**:
   - Click the suggestion: *"What have users complained about regarding checkout, and what changed after the checkout simplification?"*
   - Watch the agent recall facts from Hindsight, retrieve verified feedback citations, and present grounded evidence vs. interpretation.
5. **Ingest New Feedback**:
   - Go to **Add Feedback**, load a template or write custom feedback, click **Submit & Retain in Memory**, and inspect the confirmed `RETAINED` badge.
6. **Inspect in Memory Explorer**:
   - Pick any feedback record to trace its cognitive path from raw text to AI extraction, Hindsight retention, and semantic recall links.

---

## 8. API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service status, SQLite counts, and Hindsight bank readiness |
| `GET` | `/api/feedback` | Filter feedback by channel, feature, theme, sentiment, dates |
| `POST` | `/api/feedback` | Ingest feedback: Groq analysis + SQLite insert + Hindsight Retain |
| `POST` | `/api/analyze-feedback` | Real-time Groq analysis preview without persisting |
| `GET` | `/api/dashboard/summary` | Aggregate metrics, sentiment percentages, top themes/features |
| `GET` | `/api/dashboard/sentiment-trend` | Weekly longitudinal sentiment distribution |
| `GET` | `/api/insights/emerging-issues` | Comparative period calculation for accelerating issues |
| `GET` | `/api/product-changes` | List product changes and deployment milestones |
| `POST` | `/api/product-changes` | Record new product change and retain in Hindsight |
| `POST` | `/api/compare` | Feedback Time Machine: before vs. after milestone comparison |
| `POST` | `/api/ask` | Question $\rightarrow$ Hindsight Recall $\rightarrow$ Groq Reasoning $\rightarrow$ Grounded Answer |
| `POST` | `/api/memory/recall` | Direct Hindsight Recall execution |
| `POST` | `/api/seed` | Reset database to pristine 42-record synthetic benchmark |

---

## 🔗 Links

- **Live Demo:** https://user-feedback-synthesizer-microsoft.onrender.com/
- **GitHub:** https://github.com/hima08656/user-feedback-synthesizer-microsoft
- **Hindsight:** https://github.com/vectorize-io/hindsight

## 9. Limitations & Future Improvements

- **Real-time Webhook Streaming**: Currently ingests via REST API and interactive forms; can be extended with native Zendesk, Jira, and Slack webhook listeners.
- **Multi-Tenant Memory Scoping**: Hindsight supports multiple banks and scoped tags (`observation_scopes`); future versions can partition feedback by customer tier (Enterprise vs. Free) or regional market.
- **Multimodal Feedback**: Hindsight supports `ImageContentBlock`; future versions can directly ingest bug screenshots and video screen recordings.
