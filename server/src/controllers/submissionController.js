const Submission = require('../models/Submission');
const Question = require('../models/Question');
const User = require('../models/User');
const { executeCode } = require('../services/pistonService');
const { calculateLevel } = require('../utils/xpCalculator');

// Helper to delay for polling
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// @desc    Submit code for evaluation
// @route   POST /api/submissions/:questionId
// @access  Private
const submitQuestion = async (req, res, next) => {
  try {
    const { sourceCode, language } = req.body;
    const questionId = req.params.questionId;
    
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    const { hiddenTestCases, xpReward } = question;
    const executionLang = language || question.language;

    // For simplicity, we just evaluate the first hidden test case. 
    // In a full prod system, we would batch them or loop through all.
    const testCase = hiddenTestCases[0];
    const expectedOutput = testCase.expectedOutput;
    const expectedInput = testCase.input || '';

    // 1. Send to Piston (Synchronous execution) or Fallback Simulator
    const { data: result, executionTimeSeconds } = await executeCode(sourceCode, executionLang, expectedInput, expectedOutput);

    // 2. Determine Verdict
    let verdict = 'Wrong Answer';
    let errorMessage = null;

    if (result.compile && result.compile.code !== 0) {
      verdict = 'Compilation Error';
      errorMessage = result.compile.stderr || result.compile.output;
    } else if (result.run && result.run.code !== 0) {
      verdict = 'Runtime Error';
      errorMessage = result.run.stderr || result.run.output;
    } else {
      const actualOutput = result.run && result.run.stdout ? result.run.stdout.trim() : '';
      const cleanExpectedOutput = expectedOutput ? expectedOutput.trim() : '';
      if (actualOutput === cleanExpectedOutput) {
        verdict = 'Accepted';
      } else {
        verdict = 'Wrong Answer';
        errorMessage = result.run.stderr || null;
      }
    }

    // 3. Save Submission
    const submission = await Submission.create({
      user: req.user._id,
      question: questionId,
      codeSubmitted: sourceCode,
      language: executionLang,
      verdict,
      executionTime: executionTimeSeconds,
      memoryUsage: 0,
      errorMessage
    });

    // 4. Track attempt (regardless of verdict)
    const attemptUser = await User.findById(req.user._id);
    if (!attemptUser.attemptedQuestions.includes(questionId)) {
      attemptUser.attemptedQuestions.push(questionId);
      await attemptUser.save();
    }

    // 5. Update User XP if Accepted
    if (verdict === 'Accepted') {
      const user = await User.findById(req.user._id);
      
      // Check if user already solved it to prevent farming XP
      if (!user.solvedQuestions.includes(questionId)) {
        user.solvedQuestions.push(questionId);
        user.xp += xpReward;
        user.level = calculateLevel(user.xp);
        await user.save();
      }
    }

    res.status(201).json({
      submissionId: submission._id,
      verdict,
      executionTime: executionTimeSeconds,
      memoryUsage: 0,
      errorMessage,
      actualOutput: result.run && result.run.stdout ? result.run.stdout.trim() : '',
      expectedOutput: expectedOutput ? expectedOutput.trim() : ''
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get recent submissions for user
// @route   GET /api/submissions/my
// @access  Private
const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('question', 'title difficulty slug');
    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitQuestion,
  getMySubmissions
};
