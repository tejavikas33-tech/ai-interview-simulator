import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded regardless of process cwd
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

const apiKey = process.env.GEMINI_API_KEY;
export const isGeminiConfigured = Boolean(apiKey && apiKey.trim().length > 15 && !apiKey.includes('your_gemini'));

const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey }) : null;

/**
 * Robust JSON parser for LLM outputs that safely repairs unescaped control characters in string literals
 */
function cleanAndParseJson(rawText) {
  if (!rawText) return null;
  let text = String(rawText).trim();

  // Strip code markdown blocks if present
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    // Repair unescaped control characters in JSON string literals
    try {
      const repaired = text.replace(/"((?:\\.|[^"\\])*)"/g, (_, strContent) => {
        const escaped = strContent
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escaped}"`;
      });
      return JSON.parse(repaired);
    } catch (e2) {
      throw err;
    }
  }
}

/**
 * Generates role-specific, difficulty-appropriate interview questions using Gemini AI
 */
export async function generateInterviewQuestions({
  roleTitle,
  category,
  difficulty,
  topics = [],
  questionCount = 5
}) {
  if (isGeminiConfigured && ai) {
    try {
      const prompt = `
You are an expert technical interviewer and hiring manager at a top tech company.
Generate exactly ${questionCount} realistic, high-quality interview questions for a candidate with the following profile:

- Target Job Role: ${roleTitle}
- Interview Track / Category: ${category} (can be 'technical', 'coding', 'hr', or 'mixed')
- Experience Level / Difficulty: ${difficulty} (entry = junior/new grad, mid = 2-5 yrs, senior = 5+ yrs/lead)
- Focus Topics / Skills: ${topics.join(', ')}

Rules for Questions:
1. If category is 'coding' or mixed with coding questions:
   - Provide clear problem statement, input/output constraints, and a clean 'starterCode' snippet.
2. If category is 'technical':
   - Ask real-world architecture, concurrency, optimization, debugging, or system design scenarios suited to ${difficulty} level.
3. If category is 'hr':
   - Frame behavioral questions using the STAR methodology (Situation, Task, Action, Result), leadership, conflict resolution, or project ownership.
4. Provide 1-2 concise hints to nudge the candidate if they get stuck.
5. Provide expected key evaluation criteria points.
6. Provide a comprehensive, exemplary model answer.
7. CRITICAL: Format strictly as valid JSON. Ensure all newlines inside string values are escaped as \\n.

You MUST respond strictly with a valid JSON array of objects with the following schema:
[
  {
    "orderIndex": 1,
    "questionType": "coding" | "technical" | "hr",
    "questionText": "Detailed question text here...",
    "hints": "Helpful hint here...",
    "starterCode": "function solve(input) {\\n  // Code here\\n}",
    "expectedCriteria": ["Criteria 1", "Criteria 2", "Criteria 3"],
    "modelAnswer": "Exemplary model answer or optimal code solution..."
  }
]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const text = response.text;
      if (text) {
        const parsed = cleanAndParseJson(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, index) => ({
            ...item,
            orderIndex: index + 1,
            starterCode: item.starterCode || (category === 'coding' ? '// Write your solution here\n' : '')
          }));
        }
      }
    } catch (err) {
      console.warn('[Gemini] Direct API call error, using intelligent fallback question bank:', err.message);
    }
  }

  // Fallback intelligent question generator tailored to parameters
  return getCuratedQuestions({ roleTitle, category, difficulty, topics, questionCount });
}

/**
 * Evaluates candidate answers using Gemini AI and produces in-depth feedback
 */
export async function evaluateInterviewAnswers({
  roleTitle,
  category,
  difficulty,
  questionsWithAnswers
}) {
  if (isGeminiConfigured && ai) {
    try {
      const summaryPayload = questionsWithAnswers.map(q => ({
        order: q.order_index,
        type: q.question_type,
        question: q.question_text,
        candidate_answer: q.user_answer || '(No answer provided)',
        code_language: q.user_code_language || 'javascript',
        expected_criteria: q.expected_criteria
      }));

      const prompt = `
You are a principal engineer and bar-raiser interviewer evaluating a completed interview session.

Candidate Details:
- Role: ${roleTitle}
- Category: ${category}
- Difficulty: ${difficulty}

Submitted Questions and Answers:
${JSON.stringify(summaryPayload, null, 2)}

Provide a rigorous, constructive, and highly actionable evaluation.
Grade with real hiring standards:
- 85-100: "Strong Hire" (outstanding depth, clean code/logic, proactive edge case handling)
- 70-84: "Hire" (solid competency, minor misses, good communication)
- 55-69: "Leaning Hire" (adequate baseline, noticeable gaps in depth or structure)
- Below 55: "Needs Improvement" (major misconceptions or incomplete answers)

CRITICAL: Return strictly valid JSON. Escape internal newlines in string fields as \\n.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "overallScore": 78,
  "hiringVerdict": "Hire",
  "categoryScores": {
    "technicalDepth": 75,
    "problemSolving": 80,
    "communication": 82,
    "codeQuality": 76
  },
  "strengths": [
    "Clear explanation of time complexity in Question 1",
    "Proper use of STAR methodology when answering conflict resolution"
  ],
  "mistakes": [
    "Did not consider concurrency and race conditions in Question 2",
    "Missed edge case of empty or null input values"
  ],
  "improvementTips": [
    "Practice calculating Big-O space complexity before writing the recursive solution",
    "When explaining system tradeoffs, explicitly compare latency vs throughput"
  ],
  "weakAreas": [
    "Database Indexing & Locks",
    "Boundary Condition Testing"
  ],
  "questionEvaluations": [
    {
      "questionId": "matches submitted order or index",
      "orderIndex": 1,
      "score": 82,
      "feedback": "Detailed paragraph evaluating the candidate response...",
      "strengths": "What was done well...",
      "weaknesses": "What could be improved...",
      "modelAnswer": "Exemplary answer or optimal reference code..."
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        }
      });

      const text = response.text;
      if (text) {
        const parsed = cleanAndParseJson(text);
        if (parsed && parsed.overallScore !== undefined) {
          return matchEvaluationsWithQuestionIds(parsed, questionsWithAnswers);
        }
      }
    } catch (err) {
      console.warn('[Gemini] Direct evaluation error, using heuristic evaluator:', err.message);
    }
  }

  // Heuristic evaluator fallback
  return generateHeuristicEvaluation({ roleTitle, category, difficulty, questionsWithAnswers });
}

function matchEvaluationsWithQuestionIds(evaluationResult, originalQuestions) {
  const mapped = evaluationResult.questionEvaluations.map((evalItem, idx) => {
    const orig = originalQuestions[idx] || originalQuestions.find(q => q.order_index === evalItem.orderIndex);
    return {
      ...evalItem,
      questionId: orig ? orig.id : evalItem.questionId,
      modelAnswer: evalItem.modelAnswer || orig?.model_answer || 'See optimal solution guidelines.'
    };
  });

  return {
    ...evaluationResult,
    questionEvaluations: mapped
  };
}

/**
 * High-quality fallback generator when Gemini API Key is not yet entered
 */
function getCuratedQuestions({ roleTitle, category, difficulty, topics, questionCount }) {
  const topicList = topics.length > 0 ? topics.join(', ') : 'core fundamentals';

  const templates = [
    {
      questionType: category === 'coding' ? 'coding' : 'technical',
      questionText: `[${roleTitle}] Explain how you would architect and optimize an asynchronous request pipeline for ${topicList}. How do you handle transient network failures, retries with exponential backoff, and idempotency?`,
      hints: 'Think about circuit breakers, distributed locking or deduplication keys (UUIDs), and message queues (e.g. SQS, Redis).',
      starterCode: category === 'coding' ? `async function executeWithRetry(taskFn, maxRetries = 3, baseDelayMs = 200) {\n  // Implement exponential backoff with jitter\n}` : '',
      expectedCriteria: [
        'Explains exponential backoff and jitter algorithms',
        'Addresses idempotency keys to avoid duplicate execution',
        'Discusses dead letter queues and alert thresholds'
      ],
      modelAnswer: 'A robust pipeline uses exponential backoff with jitter: delay = min(maxDelay, baseDelay * 2^attempt + randomJitter). Each incoming event has a unique idempotency key checked against an in-memory or Redis key-value cache with a TTL. Unrecoverable failures route to a Dead Letter Queue (DLQ) after max attempts.'
    },
    {
      questionType: category === 'coding' ? 'coding' : 'technical',
      questionText: `Given an array of server transaction records, write a function to find the maximum contiguous subarray profit / balance, and explain its time and space complexity.`,
      hints: "Kadane's algorithm achieves O(n) time and O(1) space complexity by tracking local vs global maximums.",
      starterCode: `function maxSubarrayBalance(records) {\n  // records: number[]\n  // Return max sum of contiguous records\n  if (records.length === 0) return 0;\n  let maxSoFar = records[0];\n  let currentMax = records[0];\n  // Write logic here\n  return maxSoFar;\n}`,
      expectedCriteria: [
        "Optimal O(n) time using Kadane's algorithm",
        'Handles negative integer arrays properly',
        'O(1) auxiliary space consumption'
      ],
      modelAnswer: "function maxSubarrayBalance(records) {\n  if (!records.length) return 0;\n  let maxSoFar = records[0];\n  let curr = records[0];\n  for (let i = 1; i < records.length; i++) {\n    curr = Math.max(records[i], curr + records[i]);\n    maxSoFar = Math.max(maxSoFar, curr);\n  }\n  return maxSoFar;\n}\nTime: O(n), Space: O(1)."
    },
    {
      questionType: category === 'hr' ? 'hr' : 'technical',
      questionText: `Describe a situation where a critical production incident occurred right before a scheduled deadline. How did you triage the problem, communicate with stakeholders, and prevent a recurrence?`,
      hints: 'Structure your response using STAR: Situation, Task, Action, and Result. Highlight calm ownership, blameless post-mortem, and automation.',
      starterCode: '',
      expectedCriteria: [
        'Clear STAR methodology narrative',
        'Demonstrates calm root-cause analysis without panic or finger-pointing',
        'Highlights post-incident prevention (e.g., CI/CD checks, monitoring alerts)'
      ],
      modelAnswer: 'Situation: A memory leak crashed the authentication service 2 hours before black Friday. Task: Restore uptime and isolate the offending release. Action: Initiated roll-back, created status incident room with live updates to leadership every 20 minutes, and audited recent git diffs. Result: Restored 99.99% uptime in 12 minutes, followed by writing a blameless post-mortem and adding automated heap dump stress tests.'
    },
    {
      questionType: 'technical',
      questionText: `In the context of ${roleTitle}, how do you evaluate tradeoffs between database normalization vs denormalization? When would you choose Read Replicas vs Sharding for scaling?`,
      hints: 'Normalization eliminates redundancy and anomalies; denormalization speeds up heavy analytical reads at the cost of write complexity.',
      starterCode: '',
      expectedCriteria: [
        'Distinguishes OLTP vs OLAP read/write patterns',
        'Explains read replica replication lag tradeoffs',
        'Explains sharding complexity (re-balancing, cross-shard queries)'
      ],
      modelAnswer: 'Normalization (3NF) is ideal for write-heavy OLTP transactional workflows to avoid write anomalies. Denormalization or caching (Redis/Elasticsearch) is favored for heavy read queries. Scale reads first via Read Replicas with asynchronous replication. Sharding is reserved for write bottlenecks or data sizes exceeding single-instance storage capacity.'
    },
    {
      questionType: category === 'coding' ? 'coding' : 'technical',
      questionText: `Implement a Rate Limiter mechanism (e.g. Sliding Window Counter or Token Bucket) in code or pseudo-code suitable for high-throughput APIs in ${roleTitle}.`,
      hints: 'Token bucket tracks current tokens, refill rate per second, and last refill timestamp.',
      starterCode: `class TokenBucketRateLimiter {\n  constructor(capacity, refillRatePerSec) {\n    this.capacity = capacity;\n    this.refillRate = refillRatePerSec;\n    this.tokens = capacity;\n    this.lastRefill = Date.now();\n  }\n\n  allowRequest() {\n    // Implement token refill and consumption logic\n    return false;\n  }\n}`,
      expectedCriteria: [
        'Proper calculation of fractional tokens based on elapsed milliseconds',
        'Atomic token deduction without race conditions',
        'Correctly rejects burst requests exceeding bucket capacity'
      ],
      modelAnswer: 'allowRequest() {\n  const now = Date.now();\n  const elapsedSec = (now - this.lastRefill) / 1000;\n  this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRate);\n  this.lastRefill = now;\n  if (this.tokens >= 1) {\n    this.tokens -= 1;\n    return true;\n  }\n  return false;\n}'
    }
  ];

  return templates.slice(0, questionCount).map((item, idx) => ({
    ...item,
    orderIndex: idx + 1
  }));
}

function generateHeuristicEvaluation({ roleTitle, category, difficulty, questionsWithAnswers }) {
  let totalScore = 0;
  const questionEvaluations = [];
  const mistakes = [];
  const strengths = [];

  questionsWithAnswers.forEach((q, idx) => {
    const ans = (q.user_answer || '').trim();
    let qScore = 0;
    let feedback = '';
    let itemStrengths = '';
    let itemWeaknesses = '';

    if (ans.length === 0) {
      qScore = 20;
      feedback = 'No response was recorded for this question during the interview.';
      itemWeaknesses = 'Question was skipped or left blank.';
      mistakes.push(`Question ${idx + 1}: Left unanswered or incomplete.`);
    } else if (ans.length < 50) {
      qScore = 55;
      feedback = 'Brief answer provided. Lacked sufficient technical depth, concrete examples, and boundary condition handling.';
      itemStrengths = 'Touched on the core concept.';
      itemWeaknesses = 'Did not elaborate on tradeoffs, failure modes, or real-world implementation.';
      mistakes.push(`Question ${idx + 1}: Under-elaborated response without concrete edge cases.`);
    } else {
      // Good length
      const hasCode = ans.includes('function') || ans.includes('return') || ans.includes('class') || ans.includes('const');
      const hasKeywords = ans.toLowerCase().includes('complexity') || ans.toLowerCase().includes('error') || ans.toLowerCase().includes('performance') || ans.toLowerCase().includes('scale');
      
      qScore = 75 + (hasCode ? 10 : 0) + (hasKeywords ? 8 : 0);
      if (qScore > 95) qScore = 95;

      feedback = `Thorough response demonstrating solid familiarity with ${roleTitle} practices. Communicated reasoning well and outlined core operational flow.`;
      itemStrengths = 'Structured articulation and relevant contextual knowledge.';
      itemWeaknesses = 'Could further emphasize edge case validation and automated telemetry monitoring.';
      strengths.push(`Question ${idx + 1}: Clear articulation of the core architecture and approach.`);
    }

    totalScore += qScore;
    questionEvaluations.push({
      questionId: q.id,
      orderIndex: q.order_index,
      score: qScore,
      feedback,
      strengths: itemStrengths,
      weaknesses: itemWeaknesses,
      modelAnswer: q.model_answer || 'Refer to optimal system design and algorithm reference implementations.'
    });
  });

  const overallScore = Math.round(totalScore / (questionsWithAnswers.length || 1));
  let hiringVerdict = 'Hire';
  if (overallScore >= 88) hiringVerdict = 'Strong Hire';
  else if (overallScore >= 72) hiringVerdict = 'Hire';
  else if (overallScore >= 58) hiringVerdict = 'Leaning Hire';
  else hiringVerdict = 'Needs Improvement';

  if (strengths.length === 0) {
    strengths.push('Demonstrated persistence in completing the interview under time constraints.');
  }
  if (mistakes.length === 0) {
    mistakes.push('Minor oversight in edge case input boundary definitions.');
  }

  return {
    overallScore,
    hiringVerdict,
    categoryScores: {
      technicalDepth: Math.min(100, overallScore + 2),
      problemSolving: Math.max(40, overallScore - 4),
      communication: Math.min(100, overallScore + 5),
      codeQuality: overallScore
    },
    strengths: strengths.slice(0, 4),
    mistakes: mistakes.slice(0, 4),
    improvementTips: [
      `Structure technical answers into: 1) Clarifying requirements, 2) High-level strategy, 3) Implementation, 4) Edge cases & Big-O complexity.`,
      `For ${roleTitle} interviews, always proactively mention how you monitor and debug the service in production.`,
      `Practice vocalizing your thought process while coding or architecting.`
    ],
    weakAreas: [
      category === 'coding' ? 'Edge Case Handling & Time Complexity Proofs' : 'Distributed Fault-Tolerance & Observability',
      'Production Incident Post-Mortems'
    ],
    questionEvaluations
  };
}
