-- ====================================================================
-- AI INTERVIEW SIMULATOR - SUPABASE POSTGRESQL SCHEMA
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- references auth.users(id) if Supabase Auth is enabled
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'coding', 'hr', 'mixed')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('entry', 'mid', 'senior')),
    topics JSONB DEFAULT '[]'::jsonb,
    question_count INT NOT NULL DEFAULT 5,
    duration_minutes INT NOT NULL DEFAULT 30,
    time_spent_seconds INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    overall_score INT,
    hiring_verdict TEXT,
    evaluation_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 4. Interview Questions & Responses Table
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('technical', 'coding', 'hr')),
    question_text TEXT NOT NULL,
    hints TEXT,
    expected_criteria JSONB DEFAULT '[]'::jsonb,
    starter_code TEXT,
    user_answer TEXT,
    user_code_language TEXT DEFAULT 'javascript',
    score INT,
    feedback TEXT,
    strengths TEXT,
    weaknesses TEXT,
    model_answer TEXT,
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for fast dashboard and analytics queries
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON public.interviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id ON public.interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_order ON public.interview_questions(interview_id, order_index);

-- 6. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Allow public / backend service role access
DROP POLICY IF EXISTS "Allow service_role full access to profiles" ON public.profiles;
CREATE POLICY "Allow service_role full access to profiles" ON public.profiles
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access to interviews" ON public.interviews;
CREATE POLICY "Allow service_role full access to interviews" ON public.interviews
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow service_role full access to interview_questions" ON public.interview_questions;
CREATE POLICY "Allow service_role full access to interview_questions" ON public.interview_questions
    FOR ALL USING (true);

-- Authenticated user policies
DROP POLICY IF EXISTS "Users can access their own profile" ON public.profiles;
CREATE POLICY "Users can access their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can access their own interviews" ON public.interviews;
CREATE POLICY "Users can access their own interviews" ON public.interviews
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access questions for their interviews" ON public.interview_questions;
CREATE POLICY "Users can access questions for their interviews" ON public.interview_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.interviews i 
            WHERE i.id = interview_questions.interview_id 
            AND i.user_id = auth.uid()
        )
    );
