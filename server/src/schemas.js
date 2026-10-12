import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long')
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const setupInterviewSchema = z.object({
  roleTitle: z.string().min(2, 'Role title is required (e.g. Frontend Engineer)'),
  category: z.enum(['technical', 'coding', 'hr', 'mixed'], {
    errorMap: () => ({ message: 'Category must be technical, coding, hr, or mixed' })
  }),
  difficulty: z.enum(['entry', 'mid', 'senior'], {
    errorMap: () => ({ message: 'Difficulty must be entry, mid, or senior' })
  }),
  topics: z.array(z.string()).min(1, 'Please specify at least one topic or skill focus'),
  questionCount: z.coerce.number().min(2, 'Minimum 2 questions').max(10, 'Maximum 10 questions').default(5),
  durationMinutes: z.coerce.number().min(5, 'Minimum duration is 5 minutes').max(90, 'Maximum duration is 90 minutes').default(30)
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid('Valid question ID required'),
  answer: z.string(),
  codeLanguage: z.string().optional().default('javascript'),
  timeSpentSeconds: z.number().nonnegative().optional()
});

export const evaluateInterviewSchema = z.object({
  timeSpentSeconds: z.number().nonnegative().optional().default(0)
});
