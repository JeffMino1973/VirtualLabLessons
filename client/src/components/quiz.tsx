import { useState } from "react";
import { CheckCircle2, XCircle, Award, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExperimentQuiz, useQuizQuestions, useSubmitQuiz, useQuizAttempts, type QuizAnswer, type QuizResult } from "@/hooks/useQuiz";
import { useAuth } from "@/hooks/useAuth";

interface QuizProps {
  experimentId: number;
}

export function Quiz({ experimentId }: QuizProps) {
  const { user, isAuthenticated } = useAuth();
  const { data: quiz, isLoading: quizLoading } = useExperimentQuiz(experimentId);
  const { data: questions, isLoading: questionsLoading } = useQuizQuestions(quiz?.id);
  const { data: attempts, isLoading: attemptsLoading } = useQuizAttempts(quiz?.id);
  const submitQuiz = useSubmitQuiz(quiz?.id ?? 0);

  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Don't render quiz for unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <Card data-testid="quiz-login-required">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Quiz
          </CardTitle>
          <CardDescription>
            Please log in to take the quiz and test your knowledge
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (quizLoading || questionsLoading || attemptsLoading) {
    return (
      <Card data-testid="quiz-loading">
        <CardHeader>
          <CardTitle>Loading quiz...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!quiz || !questions || questions.length === 0) {
    return null; // No quiz available for this experiment
  }

  const handleAnswerChange = (questionId: number, selectedOption: number) => {
    setSelectedAnswers(new Map(selectedAnswers).set(questionId, selectedOption));
  };

  const handleSubmit = async () => {
    // Convert selected answers to array format required by API
    const answers: QuizAnswer[] = questions.map((q) => ({
      questionId: q.id,
      selectedOption: selectedAnswers.get(q.id) ?? 0,
    }));

    // Check if all questions are answered
    const allAnswered = questions.every((q) => selectedAnswers.has(q.id));
    if (!allAnswered) {
      return; // Could show an error message here
    }

    try {
      const result = await submitQuiz.mutateAsync(answers);
      setQuizResult(result);
      setShowResults(true);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers(new Map());
    setQuizResult(null);
    setShowResults(false);
  };

  const allQuestionsAnswered = questions.every((q) => selectedAnswers.has(q.id));
  const latestAttempt = attempts?.[0]; // Attempts are sorted by date DESC
  const hasPassedBefore = attempts?.some((attempt) => attempt.passed);

  // Show results view if quiz was just submitted
  if (showResults && quizResult) {
    return (
      <Card data-testid="quiz-results">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {quizResult.attempt.passed ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            {quizResult.attempt.passed ? "Quiz Passed!" : "Quiz Not Passed"}
          </CardTitle>
          <CardDescription>
            You scored {quizResult.attempt.score}% ({quizResult.correctAnswers}/{quizResult.totalQuestions} correct)
            {quizResult.attempt.passed
              ? " - Great job!"
              : ` - You need ${quizResult.passingScore}% to pass. Try again!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={quizResult.attempt.passed ? "default" : "destructive"} data-testid="badge-score">
              Score: {quizResult.attempt.score}%
            </Badge>
            <Badge variant="outline" data-testid="badge-passing-score">
              Passing: {quizResult.passingScore}%
            </Badge>
          </div>

          <Separator />

          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Review Your Answers</h3>
            {quizResult.results.map((result, index) => (
              <div key={result.questionId} className="space-y-3" data-testid={`result-${result.questionId}`}>
                <div className="flex items-start gap-2">
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">
                      Question {index + 1}: {result.questionText}
                    </p>
                    <div className="pl-4 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Your answer:</span>{" "}
                        <span className={result.isCorrect ? "text-green-700" : "text-red-700"}>
                          {result.options[result.userAnswer]}
                        </span>
                      </p>
                      {!result.isCorrect && (
                        <p className="text-sm">
                          <span className="font-medium">Correct answer:</span>{" "}
                          <span className="text-green-700">{result.options[result.correctAnswer]}</span>
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground italic">{result.explanation}</p>
                    </div>
                  </div>
                </div>
                {index < quizResult.results.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button onClick={handleRetake} variant="outline" data-testid="button-retake-quiz">
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show quiz taking view
  return (
    <Card data-testid="quiz-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {quiz.title}
        </CardTitle>
        <CardDescription>{quiz.description}</CardDescription>
        {hasPassedBefore && (
          <Badge variant="default" className="w-fit" data-testid="badge-already-passed">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            You've already passed this quiz
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert data-testid="alert-quiz-info">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Passing score: {quiz.passingScore}% • {questions.length} questions
          </AlertDescription>
        </Alert>

        {latestAttempt && latestAttempt.completedAt && (
          <Alert data-testid="alert-latest-attempt">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your latest attempt: {latestAttempt.score}% (
              {latestAttempt.passed ? "Passed" : "Not Passed"}) •{" "}
              {new Date(latestAttempt.completedAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3" data-testid={`question-${question.id}`}>
              <Label className="text-base font-medium">
                Question {index + 1}: {question.questionText}
              </Label>
              <RadioGroup
                value={selectedAnswers.get(question.id)?.toString() ?? ""}
                onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
              >
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={optionIndex.toString()}
                      id={`q${question.id}-option${optionIndex}`}
                      data-testid={`radio-q${question.id}-option${optionIndex}`}
                    />
                    <Label
                      htmlFor={`q${question.id}-option${optionIndex}`}
                      className="font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered || submitQuiz.isPending}
            data-testid="button-submit-quiz"
          >
            {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>

        {!allQuestionsAnswered && (
          <p className="text-sm text-muted-foreground text-right" data-testid="text-incomplete-warning">
            Please answer all questions to submit
          </p>
        )}
      </CardContent>
    </Card>
  );
}
