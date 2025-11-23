import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { experimentFilterSchema, insertProgressSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  // Reference: blueprint:javascript_log_in_with_replit
  await setupAuth(app);

  // Auth endpoint: Get current user
  // Returns null for unauthenticated users instead of 401
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json(null);
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Get all experiments with optional filters
  app.get("/api/experiments", async (req, res) => {
    try {
      const filters = experimentFilterSchema.parse({
        category: req.query.category || undefined,
        curriculumStage: req.query.curriculumStage || undefined,
        difficulty: req.query.difficulty || undefined,
        householdItemsOnly: req.query.householdItemsOnly === "true" || undefined,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
        searchQuery: req.query.searchQuery || undefined,
        curriculumUnitId: typeof req.query.curriculumUnitId === 'string' ? req.query.curriculumUnitId : undefined,
      });

      const experiments = await storage.getAllExperiments(filters);
      res.json(experiments);
    } catch (error) {
      console.error("Error fetching experiments:", error);
      res.status(400).json({ error: "Invalid filter parameters" });
    }
  });

  // Get featured experiments
  app.get("/api/experiments/featured", async (req, res) => {
    try {
      const experiments = await storage.getFeaturedExperiments();
      res.json(experiments);
    } catch (error) {
      console.error("Error fetching featured experiments:", error);
      res.status(500).json({ error: "Failed to fetch featured experiments" });
    }
  });

  // Get related experiments
  app.get("/api/experiments/related/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const experiments = await storage.getRelatedExperiments(id);
      res.json(experiments);
    } catch (error) {
      console.error("Error fetching related experiments:", error);
      res.status(500).json({ error: "Failed to fetch related experiments" });
    }
  });

  // Get experiment by ID
  app.get("/api/experiments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const experiment = await storage.getExperimentById(id);
      
      if (!experiment) {
        res.status(404).json({ error: "Experiment not found" });
        return;
      }

      res.json(experiment);
    } catch (error) {
      console.error("Error fetching experiment:", error);
      res.status(500).json({ error: "Failed to fetch experiment" });
    }
  });

  // Progress tracking routes (protected - require authentication)
  
  // Get all progress for current user
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getAllProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Get progress for specific experiment
  app.get("/api/progress/:experimentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const experimentId = Number(req.params.experimentId);
      
      if (!Number.isFinite(experimentId)) {
        return res.status(400).json({ error: "Invalid experiment ID" });
      }
      
      const progress = await storage.getProgress(userId, experimentId);
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching experiment progress:", error);
      res.status(500).json({ error: "Failed to fetch experiment progress" });
    }
  });

  // Create or update progress
  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.body.experimentId) {
        return res.status(400).json({ error: "experimentId is required" });
      }
      
      const experimentId = Number(req.body.experimentId);
      
      if (!Number.isFinite(experimentId)) {
        return res.status(400).json({ error: "Invalid experiment ID" });
      }
      
      const progressData = insertProgressSchema.parse({
        ...req.body,
        userId,
        experimentId,
      });
      
      const progress = await storage.upsertProgress(progressData);
      res.json(progress);
    } catch (error: any) {
      console.error("Error updating progress:", error);
      // Distinguish validation errors from server errors
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid progress data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // Update notes for an experiment
  app.patch("/api/progress/:experimentId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const experimentId = Number(req.params.experimentId);
      const { notes } = req.body;
      
      if (!Number.isFinite(experimentId)) {
        return res.status(400).json({ error: "Invalid experiment ID" });
      }
      
      if (typeof notes !== "string") {
        return res.status(400).json({ error: "notes must be a string" });
      }
      
      const progress = await storage.updateProgressNotes(userId, experimentId, notes);
      res.json(progress);
    } catch (error) {
      console.error("Error updating notes:", error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  // Mark experiment as complete/incomplete
  app.patch("/api/progress/:experimentId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const experimentId = Number(req.params.experimentId);
      const { completed } = req.body;
      
      if (!Number.isFinite(experimentId)) {
        return res.status(400).json({ error: "Invalid experiment ID" });
      }
      
      if (typeof completed !== "boolean") {
        return res.status(400).json({ error: "completed must be a boolean" });
      }
      
      const progress = await storage.markExperimentComplete(userId, experimentId, completed);
      res.json(progress);
    } catch (error) {
      console.error("Error marking experiment complete:", error);
      res.status(500).json({ error: "Failed to update completion status" });
    }
  });

  // Quiz Routes
  
  // Get quiz for an experiment
  app.get("/api/quizzes/experiment/:experimentId", async (req, res) => {
    try {
      const experimentId = Number(req.params.experimentId);
      
      if (!Number.isFinite(experimentId)) {
        return res.status(400).json({ error: "Invalid experiment ID" });
      }
      
      const quiz = await storage.getQuizByExperimentId(experimentId);
      res.json(quiz || null);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  // Get quiz questions (without correct answers for students)
  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const quizId = Number(req.params.quizId);
      
      if (!Number.isFinite(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      
      const questions = await storage.getQuizQuestions(quizId);
      
      // Remove correct answer indices for students (security)
      const sanitizedQuestions = questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        orderIndex: q.orderIndex,
      }));
      
      res.json(sanitizedQuestions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ error: "Failed to fetch quiz questions" });
    }
  });

  // Submit quiz attempt (authenticated users only)
  // Expected body format: { answers: [{ questionId: number, selectedOption: number }, ...] }
  app.post("/api/quizzes/:quizId/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = Number(req.params.quizId);
      const { answers } = req.body;
      
      if (!Number.isFinite(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      
      if (!Array.isArray(answers)) {
        return res.status(400).json({ error: "answers must be an array" });
      }
      
      // Get quiz by ID to access passing score
      const quiz = await storage.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      // Get questions for this quiz
      const questions = await storage.getQuizQuestions(quizId);
      
      if (questions.length === 0) {
        return res.status(404).json({ error: "No questions found for this quiz" });
      }
      
      if (answers.length !== questions.length) {
        return res.status(400).json({ 
          error: `Number of answers (${answers.length}) must match number of questions (${questions.length})` 
        });
      }
      
      // Create a map of questionId -> question for validation and scoring
      const questionMap = new Map(questions.map(q => [q.id, q]));
      const questionIds = new Set(questions.map(q => q.id));
      
      // Validate each answer has questionId and selectedOption
      const submittedQuestionIds = new Set<number>();
      
      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        
        // Validate answer structure
        if (typeof answer !== 'object' || answer === null) {
          return res.status(400).json({ 
            error: `Answer at index ${i} must be an object with questionId and selectedOption` 
          });
        }
        
        const { questionId, selectedOption } = answer;
        
        // Validate questionId is a number
        if (!Number.isInteger(questionId)) {
          return res.status(400).json({ 
            error: `Answer at index ${i}: questionId must be an integer` 
          });
        }
        
        // Validate questionId belongs to this quiz
        if (!questionIds.has(questionId)) {
          return res.status(400).json({ 
            error: `Answer at index ${i}: questionId ${questionId} does not belong to this quiz` 
          });
        }
        
        // Detect duplicate questionIds
        if (submittedQuestionIds.has(questionId)) {
          return res.status(400).json({ 
            error: `Duplicate answer for questionId ${questionId}` 
          });
        }
        submittedQuestionIds.add(questionId);
        
        // Validate selectedOption is within valid range for this question
        const question = questionMap.get(questionId)!;
        if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption >= question.options.length) {
          return res.status(400).json({ 
            error: `Answer for question ${questionId}: selectedOption must be between 0 and ${question.options.length - 1}` 
          });
        }
      }
      
      // Ensure all questions are answered (no missing questionIds)
      for (const questionId of questionIds) {
        if (!submittedQuestionIds.has(questionId)) {
          return res.status(400).json({ 
            error: `Missing answer for questionId ${questionId}` 
          });
        }
      }
      
      // Calculate score by matching questionId to selectedOption
      let correctCount = 0;
      const answersArray: number[] = new Array(questions.length);
      
      answers.forEach((answer) => {
        const { questionId, selectedOption } = answer;
        const question = questionMap.get(questionId)!;
        
        // Store answer in order of questions for database storage
        const questionIndex = questions.findIndex(q => q.id === questionId);
        answersArray[questionIndex] = selectedOption;
        
        // Check if answer is correct
        if (selectedOption === question.correctAnswerIndex) {
          correctCount++;
        }
      });
      
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= quiz.passingScore;
      
      // Submit attempt
      const attempt = await storage.submitQuizAttempt({
        userId,
        quizId,
        score,
        answers: answersArray,
        passed,
      });
      
      // Return attempt with detailed results
      const results = questions.map((q) => {
        const userAnswer = answers.find(a => a.questionId === q.id)!;
        return {
          questionId: q.id,
          questionText: q.questionText,
          options: q.options,
          userAnswer: userAnswer.selectedOption,
          correctAnswer: q.correctAnswerIndex,
          isCorrect: userAnswer.selectedOption === q.correctAnswerIndex,
          explanation: q.explanation,
        };
      });
      
      res.json({
        attempt,
        results,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        passingScore: quiz.passingScore,
      });
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ error: "Failed to submit quiz attempt" });
    }
  });

  // Get user's quiz attempts
  app.get("/api/quizzes/:quizId/attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = Number(req.params.quizId);
      
      if (!Number.isFinite(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      
      const attempts = await storage.getUserQuizAttempts(userId, quizId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ error: "Failed to fetch quiz attempts" });
    }
  });

  // Curriculum Routes
  
  // Get all curriculum units
  app.get("/api/curriculum", async (req, res) => {
    try {
      const units = await storage.getAllCurriculumUnits();
      res.json(units);
    } catch (error) {
      console.error("Error fetching curriculum units:", error);
      res.status(500).json({ error: "Failed to fetch curriculum units" });
    }
  });

  // Get curriculum units by stage
  app.get("/api/curriculum/stage/:stage", async (req, res) => {
    try {
      const stage = req.params.stage;
      const units = await storage.getCurriculumUnitsByStage(stage);
      res.json(units);
    } catch (error) {
      console.error("Error fetching curriculum units by stage:", error);
      res.status(500).json({ error: "Failed to fetch curriculum units" });
    }
  });

  // Get single curriculum unit by unitId
  app.get("/api/curriculum/:unitId", async (req, res) => {
    try {
      const unitId = req.params.unitId;
      const unit = await storage.getCurriculumUnitById(unitId);
      if (!unit) {
        return res.status(404).json({ error: "Curriculum unit not found" });
      }
      res.json(unit);
    } catch (error) {
      console.error("Error fetching curriculum unit:", error);
      res.status(500).json({ error: "Failed to fetch curriculum unit" });
    }
  });

  // Get curriculum units for an experiment
  app.get("/api/experiments/:experimentId/curriculum", async (req, res) => {
    try {
      const experimentId = Number(req.params.experimentId);
      
      if (!Number.isFinite(experimentId)) {
        return res.status(400).json({ error: "Invalid experiment ID" });
      }
      
      const units = await storage.getExperimentCurriculumUnits(experimentId);
      res.json(units);
    } catch (error) {
      console.error("Error fetching experiment curriculum units:", error);
      res.status(500).json({ error: "Failed to fetch curriculum units" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
