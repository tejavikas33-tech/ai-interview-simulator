import crypto from 'crypto';
import { supabase } from './supabase.js';

// ====================================================================
// PROFILES & AUTH DATABASE OPERATIONS
// ====================================================================

export async function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    console.warn('[Supabase] Error finding profile by email:', error.message);
    return null;
  }
  return data;
}

export async function findUserById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, auth_user_id, email, full_name, avatar_url, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.warn('[Supabase] Error finding profile by ID:', error.message);
    return null;
  }
  return data;
}

export async function createProfile({ id, authUserId, email, fullName }) {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: id || authUserId || crypto.randomUUID(),
      auth_user_id: authUserId || id,
      email: normalizedEmail,
      full_name: fullName,
      created_at: now,
      updated_at: now
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Profile creation failed:', error.message);
    throw new Error(error.message);
  }

  return data;
}

// ====================================================================
// INTERVIEW OPERATIONS (public.interviews & public.interview_questions)
// ====================================================================

export async function createInterview({
  userId,
  roleTitle,
  category,
  difficulty,
  topics,
  questionCount,
  durationMinutes,
  questions
}) {
  const interviewId = crypto.randomUUID();
  const now = new Date().toISOString();

  // 1. Insert interview record
  const newInterview = {
    id: interviewId,
    user_id: userId,
    role_title: roleTitle,
    category,
    difficulty,
    topics: Array.isArray(topics) ? topics : [],
    question_count: questionCount,
    duration_minutes: durationMinutes,
    time_spent_seconds: 0,
    status: 'in_progress',
    overall_score: null,
    hiring_verdict: null,
    evaluation_summary: {},
    created_at: now,
    completed_at: null
  };

  const { data: interviewData, error: intError } = await supabase
    .from('interviews')
    .insert(newInterview)
    .select()
    .single();

  if (intError) {
    console.error('[Supabase] Interview insert failed:', intError.message);
    throw new Error(`Failed to create interview in Supabase: ${intError.message}`);
  }

  // 2. Prepare questions
  const preparedQuestions = questions.map((q, idx) => ({
    id: crypto.randomUUID(),
    interview_id: interviewId,
    order_index: idx + 1,
    question_type: q.questionType || (category === 'mixed' ? 'technical' : category),
    question_text: q.questionText,
    hints: q.hints || '',
    expected_criteria: Array.isArray(q.expectedCriteria) ? q.expectedCriteria : [],
    starter_code: q.starterCode || '',
    user_answer: '',
    user_code_language: q.starterCode ? 'javascript' : '',
    score: null,
    feedback: null,
    strengths: null,
    weaknesses: null,
    model_answer: q.modelAnswer || '',
    evaluated_at: null,
    created_at: now
  }));

  const { data: questionsData, error: qError } = await supabase
    .from('interview_questions')
    .insert(preparedQuestions)
    .select();

  if (qError) {
    console.error('[Supabase] Questions insert failed:', qError.message);
    throw new Error(`Failed to insert questions into Supabase: ${qError.message}`);
  }

  return {
    ...interviewData,
    questions: questionsData.sort((a, b) => a.order_index - b.order_index)
  };
}

export async function getInterviewById(interviewId, userId) {
  const { data: interview, error: intError } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .eq('user_id', userId)
    .maybeSingle();

  if (intError || !interview) {
    if (intError) console.warn('[Supabase] getInterviewById error:', intError.message);
    return null;
  }

  const { data: questions, error: qError } = await supabase
    .from('interview_questions')
    .select('*')
    .eq('interview_id', interviewId)
    .order('order_index', { ascending: true });

  if (qError) {
    console.warn('[Supabase] Fetch interview questions error:', qError.message);
  }

  return {
    ...interview,
    questions: questions || []
  };
}

export async function updateQuestionAnswer({ questionId, interviewId, answer, codeLanguage }) {
  const updatePayload = {
    user_answer: answer
  };
  if (codeLanguage) updatePayload.user_code_language = codeLanguage;

  const { data, error } = await supabase
    .from('interview_questions')
    .update(updatePayload)
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] updateQuestionAnswer error:', error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function saveInterviewEvaluation({
  interviewId,
  overallScore,
  hiringVerdict,
  evaluationSummary,
  questionEvaluations = [],
  timeSpentSeconds = 0
}) {
  const completedAt = new Date().toISOString();

  // 1. Update interview overall score & evaluation summary
  const { error: intError } = await supabase
    .from('interviews')
    .update({
      status: 'completed',
      overall_score: overallScore,
      hiring_verdict: hiringVerdict,
      evaluation_summary: evaluationSummary,
      time_spent_seconds: timeSpentSeconds,
      completed_at: completedAt
    })
    .eq('id', interviewId);

  if (intError) {
    console.error('[Supabase] Save interview evaluation error:', intError.message);
    throw new Error(intError.message);
  }

  // 2. Update each question's evaluation
  for (const qEval of questionEvaluations) {
    const updateFields = {
      score: qEval.score,
      feedback: qEval.feedback,
      strengths: qEval.strengths,
      weaknesses: qEval.weaknesses,
      evaluated_at: completedAt
    };
    if (qEval.modelAnswer) {
      updateFields.model_answer = qEval.modelAnswer;
    }

    const { error: qError } = await supabase
      .from('interview_questions')
      .update(updateFields)
      .eq('id', qEval.questionId);

    if (qError) {
      console.warn(`[Supabase] Question evaluation update failed for ID ${qEval.questionId}:`, qError.message);
    }
  }

  return true;
}

export async function getUserInterviews(userId) {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] getUserInterviews error:', error.message);
    return [];
  }

  return data || [];
}

export async function getUserAnalytics(userId) {
  const interviews = await getUserInterviews(userId);
  const completed = interviews.filter(i => i.status === 'completed' && typeof i.overall_score === 'number');

  const totalInterviews = interviews.length;
  const completedCount = completed.length;

  const averageScore = completedCount > 0
    ? Math.round(completed.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / completedCount)
    : 0;

  // Role stats
  const roleBreakdown = {};
  completed.forEach(i => {
    roleBreakdown[i.role_title] = (roleBreakdown[i.role_title] || 0) + 1;
  });

  // Aggregate weaknesses and strengths across recent interviews
  const recentWeakAreas = [];
  const recentStrengths = [];

  completed.slice(0, 5).forEach(i => {
    if (i.evaluation_summary?.weak_areas) {
      recentWeakAreas.push(...i.evaluation_summary.weak_areas);
    }
    if (i.evaluation_summary?.strengths) {
      recentStrengths.push(...i.evaluation_summary.strengths);
    }
  });

  // History timeline for chart
  const scoreHistory = completed
    .slice(0, 8)
    .reverse()
    .map(i => ({
      id: i.id,
      date: new Date(i.completed_at || i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: i.overall_score,
      role: i.role_title,
      category: i.category
    }));

  return {
    totalInterviews,
    completedCount,
    averageScore,
    roleBreakdown,
    recentWeakAreas: [...new Set(recentWeakAreas)].slice(0, 5),
    recentStrengths: [...new Set(recentStrengths)].slice(0, 5),
    scoreHistory
  };
}
