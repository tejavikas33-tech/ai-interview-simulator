import express from 'express';
import {
  setupInterviewSchema,
  submitAnswerSchema,
  evaluateInterviewSchema
} from '../schemas.js';
import {
  createInterview,
  getInterviewById,
  updateQuestionAnswer,
  saveInterviewEvaluation,
  getUserInterviews,
  getUserAnalytics
} from '../db.js';
import {
  generateInterviewQuestions,
  evaluateInterviewAnswers
} from '../gemini.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all interview routes
router.use(requireAuth);

// GET /api/interviews/history
router.get('/history', async (req, res) => {
  try {
    const list = await getUserInterviews(req.user.id);
    return res.json({ interviews: list });
  } catch (err) {
    console.error('Fetch history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve interview history' });
  }
});

// GET /api/interviews/analytics
router.get('/analytics', async (req, res) => {
  try {
    const stats = await getUserAnalytics(req.user.id);
    return res.json({ analytics: stats });
  } catch (err) {
    console.error('Fetch analytics error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// POST /api/interviews/setup
router.post('/setup', async (req, res) => {
  try {
    const validated = setupInterviewSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        error: 'Invalid interview setup parameters',
        details: validated.error.errors.map(e => e.message)
      });
    }

    const {
      roleTitle,
      category,
      difficulty,
      topics,
      questionCount,
      durationMinutes
    } = validated.data;

    // Generate questions using Gemini AI
    const rawQuestions = await generateInterviewQuestions({
      roleTitle,
      category,
      difficulty,
      topics,
      questionCount
    });

    // Create interview record in database
    const createdInterview = await createInterview({
      userId: req.user.id,
      roleTitle,
      category,
      difficulty,
      topics,
      questionCount: rawQuestions.length,
      durationMinutes,
      questions: rawQuestions
    });

    return res.status(201).json({
      message: 'Interview session generated successfully',
      interview: createdInterview
    });
  } catch (err) {
    console.error('Interview setup error:', err);
    return res.status(500).json({ error: 'Failed to generate interview session' });
  }
});

// GET /api/interviews/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await getInterviewById(id, req.user.id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    return res.json({ interview });
  } catch (err) {
    console.error('Get interview error:', err);
    return res.status(500).json({ error: 'Failed to retrieve interview details' });
  }
});

// PUT /api/interviews/:id/answer
router.put('/:id/answer', async (req, res) => {
  try {
    const { id: interviewId } = req.params;
    const validated = submitAnswerSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        error: 'Invalid answer data',
        details: validated.error.errors.map(e => e.message)
      });
    }

    const { questionId, answer, codeLanguage } = validated.data;

    // Verify ownership of interview
    const interview = await getInterviewById(interviewId, req.user.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    const updated = await updateQuestionAnswer({
      questionId,
      interviewId,
      answer,
      codeLanguage
    });

    return res.json({
      message: 'Answer saved successfully',
      question: updated
    });
  } catch (err) {
    console.error('Answer submission error:', err);
    return res.status(500).json({ error: 'Failed to update answer' });
  }
});

// POST /api/interviews/:id/evaluate
router.post('/:id/evaluate', async (req, res) => {
  try {
    const { id: interviewId } = req.params;
    const validated = evaluateInterviewSchema.safeParse(req.body);
    const timeSpentSeconds = validated.success ? validated.data.timeSpentSeconds : 0;

    const interview = await getInterviewById(interviewId, req.user.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview session not found' });
    }

    // Call Gemini AI to evaluate all answers
    const evaluation = await evaluateInterviewAnswers({
      roleTitle: interview.role_title,
      category: interview.category,
      difficulty: interview.difficulty,
      questionsWithAnswers: interview.questions
    });

    // Save evaluation to DB
    await saveInterviewEvaluation({
      interviewId,
      overallScore: evaluation.overallScore,
      hiringVerdict: evaluation.hiringVerdict,
      evaluationSummary: {
        categoryScores: evaluation.categoryScores,
        strengths: evaluation.strengths,
        mistakes: evaluation.mistakes,
        improvementTips: evaluation.improvementTips,
        weakAreas: evaluation.weakAreas
      },
      questionEvaluations: evaluation.questionEvaluations,
      timeSpentSeconds
    });

    // Return the completed interview with all evaluations
    const updatedInterview = await getInterviewById(interviewId, req.user.id);

    return res.json({
      message: 'Interview evaluated successfully',
      interview: updatedInterview,
      evaluation
    });
  } catch (err) {
    console.error('Interview evaluation error:', err);
    return res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});

export default router;
