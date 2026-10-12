# PrepPulse AI — AI-Powered Interview Simulator

A modern, responsive, and production-ready full-stack AI interview simulator where students practice **Technical Architecture**, **Live Algorithmic Coding**, and **Behavioral & HR (STAR)** interviews.

Powered by **Google Gemini 2.5 Flash** (`@google/genai`), **Supabase PostgreSQL & Auth**, **React**, **Tailwind CSS**, **Node.js / Express**, and **Zod**.

---

## 🚀 Key Features

1. **Role & Round Customization**:
   - **Tracks**: Technical Architecture, Live Algorithmic Coding, HR & Behavioral (STAR methodology), or Mixed Simulations.
   - **Roles**: Frontend Engineer, Backend Engineer, Full-Stack, Machine Learning, DevOps, Mobile, or Custom Roles.
   - **Difficulty**: Junior / Entry-Level (0–2 yrs), Mid-Level (2–5 yrs), Senior / Staff (5+ yrs).
   - **Topic Focus**: Interactive chips for custom topics (e.g., Dynamic Programming, Distributed Systems, Concurrency, STAR Method).
   - **Simulation Length**: 3, 5, or 8 questions with customizable duration (15m, 30m, 45m).

2. **Gemini AI Question Generation**:
   - Dynamic question synthesis tailored specifically to the candidate's target role, track, and experience level using `@google/genai`.
   - Includes real-world constraints, hints, expected grading criteria, and starter code.

3. **Interactive Simulation Room**:
   - **Live Countdown Timer** with color-coded urgency thresholds (blue → amber → pulsing red).
   - **Question Navigator** with status indicators (Answered, In-Progress, Pending).
   - **Multi-Language Code Editor** (JavaScript, TypeScript, Python, Java, C++) with syntax styling, line numbers, and reset controls.
   - **Built-in Voice Input (Speech-to-Text)** using the Web Speech API for practicing vocal delivery in behavioral and technical interviews.
   - Progressive hints toggle and STAR methodology helper prompts.

4. **Rigorous AI Evaluation & Diagnostic Results**:
   - **Overall Score Dial (0–100)** and hiring verdict (*Strong Hire*, *Hire*, *Leaning Hire*, *Needs Improvement*).
   - **Competency Breakdown**: Technical Depth, Problem Solving, Communication, and Code Quality.
   - **Demonstrated Strengths** and **Critical Mistakes & Blindspots**.
   - **Actionable Improvement Tips** & **Priority Weak Areas** to focus on next.
   - **Question-by-Question Diagnostic Review**: Compares candidate's response with Gemini's critique and exemplary reference model answers.
   - Confetti celebration on score ≥ 75!

5. **Student Dashboard & Analytics**:
   - Total Sessions, Average Score, and Readiness Tier tracking.
   - Visual score trend timeline across recent interview sessions.
   - Aggregated priority weak areas.
   - Complete interview history with review links.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS v3, Vite, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, Zod (request validation), `@google/genai` (Google Gen AI SDK), `@supabase/supabase-js`, JWT authentication, bcryptjs.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) + persistent local DB fallback for instant zero-config testing.

---

## 📋 Quick Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- (Optional) Free Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
- (Optional) Free Supabase project from [supabase.com](https://supabase.com/)

### 2. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note**: If `GEMINI_API_KEY` or `SUPABASE_URL` are not yet supplied, the application automatically runs in fallback mode with a smart curated AI engine and persistent database storage so you can test all features immediately without broken screens!

### 3. Supabase Database Schema
To initialize your Supabase PostgreSQL database:
1. Open your Supabase Dashboard → **SQL Editor**.
2. Open the [supabase_schema.sql](file:///c:/Users/tejav/anti-project/supabase_schema.sql) file in this repository.
3. Paste and run the SQL script. It creates:
   - `profiles` table
   - `interviews` table
   - `interview_questions` table
   - Performance indexes & RLS policies

### 4. Running Locally

#### Start the Backend Server:
```bash
npm --prefix server run dev
# Server runs on http://localhost:5000
```

#### Start the Frontend Client:
```bash
npm --prefix client run dev
# Client runs on http://localhost:5173
```

---

## 🧪 Testing the Simulator

1. Navigate to **http://localhost:5173/**
2. Click **Instant Demo Login** or create a new student account.
3. Click **Start New Interview**.
4. Configure your track, role, and topics, then click **Generate & Start Simulation**.
5. Practice answering questions with code or voice input under the countdown timer.
6. Click **Submit Interview** to receive comprehensive Gemini AI evaluations!
