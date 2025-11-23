import { z } from "zod";
import { sql } from 'drizzle-orm';
import { pgTable, varchar, text, integer, boolean, json, serial, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Experiment difficulty levels
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

// NSW Curriculum stages
export type CurriculumStage = "K-6" | "7-10 Life Skills" | "11-12 Science Life Skills";

// Science categories
export type ScienceCategory = "Biology" | "Chemistry" | "Physics" | "Earth Science";

// Experiment step
export const experimentStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  safetyWarning: z.string().optional(),
});

export type ExperimentStep = z.infer<typeof experimentStepSchema>;

// Main Experiment schema
export const experimentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["Biology", "Chemistry", "Physics", "Earth Science"]),
  curriculumStage: z.enum(["K-6", "7-10 Life Skills", "11-12 Science Life Skills"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number(), // in minutes
  materialsNeeded: z.array(z.string()),
  householdItemsOnly: z.boolean(),
  thumbnailUrl: z.string(),
  steps: z.array(experimentStepSchema),
  scienceExplained: z.string(),
  learningOutcomes: z.array(z.string()),
  safetyNotes: z.array(z.string()).optional(),
  relatedExperiments: z.array(z.string()).optional(), // array of experiment IDs
  videoUrl: z.string().optional(),
});

export const insertExperimentSchema = experimentSchema.omit({ id: true });

export type Experiment = z.infer<typeof experimentSchema>;
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;

// Filter options
export const experimentFilterSchema = z.object({
  category: z.enum(["Biology", "Chemistry", "Physics", "Earth Science"]).optional(),
  curriculumStage: z.enum(["K-6", "7-10 Life Skills", "11-12 Science Life Skills"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  householdItemsOnly: z.boolean().optional(),
  maxDuration: z.number().optional(), // in minutes
  searchQuery: z.string().optional(),
  curriculumUnitId: z.string().optional(), // Filter by curriculum unit ID
});

export type ExperimentFilter = z.infer<typeof experimentFilterSchema>;

// Drizzle Tables
export const experiments = pgTable("experiments", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  curriculumStage: varchar("curriculum_stage", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  duration: integer("duration").notNull(),
  materialsNeeded: json("materials_needed").$type<string[]>().notNull(),
  householdItemsOnly: boolean("household_items_only").notNull().default(false),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }).notNull(),
  steps: json("steps").$type<ExperimentStep[]>().notNull(),
  scienceExplained: text("science_explained").notNull(),
  learningOutcomes: json("learning_outcomes").$type<string[]>().notNull(),
  safetyNotes: json("safety_notes").$type<string[]>(),
  relatedExperiments: json("related_experiments").$type<number[]>(),
  videoUrl: varchar("video_url", { length: 500 }),
});

export const insertExperimentDBSchema = createInsertSchema(experiments).omit({ id: true });
export const selectExperimentDBSchema = createSelectSchema(experiments);

export type ExperimentDB = typeof experiments.$inferSelect;
export type InsertExperimentDB = z.infer<typeof insertExperimentDBSchema>;

// Session storage table for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth with role-based access
// Reference: blueprint:javascript_log_in_with_replit (with role extension)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("student"), // student or teacher
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Experiment Progress tracking table
export const experimentProgress = pgTable("experiment_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: integer("experiment_id").notNull().references(() => experiments.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_progress_user_experiment").on(table.userId, table.experimentId),
]);

export const insertProgressSchema = createInsertSchema(experimentProgress).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const selectProgressSchema = createSelectSchema(experimentProgress);

export type ExperimentProgress = typeof experimentProgress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;

// Quiz Tables

// Quizzes - one quiz per experiment
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => experiments.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70), // percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_quiz_experiment").on(table.experimentId),
]);

// Quiz Questions - multiple questions per quiz
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  options: json("options").$type<string[]>().notNull(), // array of 4 options
  correctAnswerIndex: integer("correct_answer_index").notNull(), // 0-3
  explanation: text("explanation"), // optional explanation shown after answer
  orderIndex: integer("order_index").notNull(), // for ordering questions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_question_quiz").on(table.quizId),
]);

// Quiz Attempts - track user attempts at quizzes
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // percentage 0-100
  answers: json("answers").$type<number[]>().notNull(), // array of selected answer indices
  passed: boolean("passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
}, (table) => [
  index("idx_attempt_user_quiz").on(table.userId, table.quizId),
]);

// Zod Schemas for Quizzes
export const insertQuizSchema = createInsertSchema(quizzes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const selectQuizSchema = createSelectSchema(quizzes);

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

// Zod Schemas for Quiz Questions
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const selectQuizQuestionSchema = createSelectSchema(quizQuestions);

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

// Zod Schemas for Quiz Attempts
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ 
  id: true, 
  completedAt: true 
});

export const selectQuizAttemptSchema = createSelectSchema(quizAttempts);

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Curriculum Units Table - NSW Science Curriculum alignment
export const curriculumUnits = pgTable("curriculum_units", {
  id: serial("id").primaryKey(),
  unitId: varchar("unit_id", { length: 50 }).notNull().unique(), // e.g., "s1-t1", "comp-a-t1"
  stage: varchar("stage", { length: 50 }).notNull(), // "Early Stage 1", "Stage 1", etc.
  component: varchar("component", { length: 50 }), // For Life Skills: "Component A", etc.
  term: integer("term").notNull(), // 1-8 for K-6, 1-4 for Life Skills
  name: varchar("name", { length: 500 }).notNull(), // Unit name
  description: text("description").notNull(), // Unit description
  outcomes: json("outcomes").$type<string[]>().notNull(), // NSW curriculum outcome codes
  weeks: integer("weeks").notNull().default(8), // Duration in weeks
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_curriculum_stage").on(table.stage),
  index("idx_curriculum_component").on(table.component),
  index("idx_curriculum_unit_id").on(table.unitId),
]);

// Zod Schemas for Curriculum Units
export const insertCurriculumUnitSchema = createInsertSchema(curriculumUnits).omit({ 
  id: true, 
  createdAt: true 
});

export const selectCurriculumUnitSchema = createSelectSchema(curriculumUnits);

export type CurriculumUnit = typeof curriculumUnits.$inferSelect;
export type InsertCurriculumUnit = z.infer<typeof insertCurriculumUnitSchema>;

// Experiment-Curriculum Units Junction Table (Many-to-Many relationship)
export const experimentCurriculumUnits = pgTable("experiment_curriculum_units", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => experiments.id, { onDelete: "cascade" }),
  curriculumUnitId: integer("curriculum_unit_id").notNull().references(() => curriculumUnits.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_exp_curr_experiment").on(table.experimentId),
  index("idx_exp_curr_curriculum").on(table.curriculumUnitId),
]);

// Zod Schemas for Junction Table
export const insertExperimentCurriculumUnitSchema = createInsertSchema(experimentCurriculumUnits).omit({ 
  id: true, 
  createdAt: true 
});

export const selectExperimentCurriculumUnitSchema = createSelectSchema(experimentCurriculumUnits);

export type ExperimentCurriculumUnit = typeof experimentCurriculumUnits.$inferSelect;
export type InsertExperimentCurriculumUnit = z.infer<typeof insertExperimentCurriculumUnitSchema>;
