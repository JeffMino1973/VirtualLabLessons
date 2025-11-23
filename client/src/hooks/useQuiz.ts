import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Quiz, QuizQuestion, QuizAttempt } from "@shared/schema";

// Quiz with questions (sanitized - no correct answers)
export type QuizWithQuestions = Quiz & {
  questions: QuizQuestion[];
};

// Quiz result after submission
export type QuizResult = {
  attempt: QuizAttempt;
  results: Array<{
    questionId: number;
    questionText: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
  }>;
  totalQuestions: number;
  correctAnswers: number;
  passingScore: number;
};

// Answer format for submission
export type QuizAnswer = {
  questionId: number;
  selectedOption: number;
};

// Fetch quiz by experiment ID
export function useExperimentQuiz(experimentId: number) {
  return useQuery<Quiz>({
    queryKey: ["/api/quizzes/experiment", experimentId],
    enabled: !!experimentId,
  });
}

// Fetch quiz questions
export function useQuizQuestions(quizId: number | undefined) {
  return useQuery<QuizQuestion[]>({
    queryKey: ["/api/quizzes", quizId, "questions"],
    enabled: !!quizId,
  });
}

// Fetch user's quiz attempts
export function useQuizAttempts(quizId: number | undefined) {
  return useQuery<QuizAttempt[]>({
    queryKey: ["/api/quizzes", quizId, "attempts"],
    enabled: !!quizId,
  });
}

// Submit quiz attempt
export function useSubmitQuiz(quizId: number) {
  return useMutation<QuizResult, Error, QuizAnswer[]>({
    mutationFn: async (answers: QuizAnswer[]) => {
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/submit`, { answers });
      return res.json();
    },
    onSuccess: async () => {
      // Refetch quiz attempts immediately to ensure fresh data
      await queryClient.refetchQueries({
        queryKey: ["/api/quizzes", quizId, "attempts"],
      });
    },
  });
}
