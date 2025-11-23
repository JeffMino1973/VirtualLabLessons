import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { ExperimentCard } from "@/components/experiment-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Beaker,
  AlertTriangle,
  CheckCircle2,
  Home,
  BookmarkCheck,
  Loader2,
} from "lucide-react";
import type { Experiment } from "@shared/schema";
import { useExperimentProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";
import { Quiz } from "@/components/quiz";
import { getExperimentImage } from "@/lib/experimentImages";

export default function ExperimentDetail() {
  const [, params] = useRoute("/experiments/:id");
  const experimentId = params?.id;
  const { isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState("");
  const notesTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: experiment, isLoading } = useQuery<Experiment>({
    queryKey: [`/api/experiments/${experimentId}`],
    enabled: !!experimentId,
  });

  const { data: relatedExperiments } = useQuery<Experiment[]>({
    queryKey: [`/api/experiments/related/${experimentId}`],
    enabled: !!experimentId && !!experiment?.relatedExperiments,
  });

  const {
    progress,
    isLoading: isProgressLoading,
    updateNotes,
    toggleComplete,
    isPending,
  } = useExperimentProgress(experimentId);

  // Clear local state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setNotes("");
    }
  }, [isAuthenticated]);

  // Initialize notes from progress data (including empty strings to allow clearing)
  useEffect(() => {
    if (isAuthenticated && progress !== undefined) {
      setNotes(progress?.notes || "");
    }
  }, [progress, isAuthenticated]);

  // Auto-save notes with debouncing
  useEffect(() => {
    if (!isAuthenticated || !experimentId) return;

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    // Only save if notes have changed from the saved value
    if (notes !== (progress?.notes || "")) {
      notesTimeoutRef.current = setTimeout(() => {
        updateNotes(notes);
      }, 1000); // 1 second debounce
    }

    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
    };
  }, [notes, isAuthenticated, experimentId, updateNotes, progress?.notes]);

  const handleToggleComplete = () => {
    if (!isAuthenticated) return;
    toggleComplete(!progress?.completed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showSearch={false} />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="h-96 animate-pulse">
            <div className="h-full bg-muted" />
          </Card>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="min-h-screen bg-background">
        <Header showSearch={false} />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="p-12 text-center">
            <p className="text-lg mb-4">Experiment not found</p>
            <Link href="/experiments">
              <Button>Browse Experiments</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Biology: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    Chemistry: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    Physics: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "Earth Science": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };

  const toggleMaterial = (index: number) => {
    const newChecked = new Set(checkedMaterials);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedMaterials(newChecked);
  };

  const allMaterialsChecked = checkedMaterials.size === experiment.materialsNeeded.length;

  return (
    <div className="min-h-screen bg-background">
      <Header showSearch={false} />

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" data-testid="breadcrumb">
          <Link href="/" className="hover:text-foreground flex items-center gap-1">
            <Home className="w-4 h-4" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/experiments" className="hover:text-foreground">
            Experiments
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium truncate">{experiment.title}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className={categoryColors[experiment.category]}>
              {experiment.category}
            </Badge>
            <Badge variant="outline">{experiment.curriculumStage}</Badge>
            <Badge variant="outline" className="capitalize">
              {experiment.difficulty}
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-experiment-title">
            {experiment.title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {experiment.description}
          </p>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span><strong>{experiment.duration} minutes</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-muted-foreground" />
              <span><strong>{experiment.materialsNeeded.length} materials needed</strong></span>
            </div>
            {experiment.householdItemsOnly && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Household Items Only
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="steps" data-testid="tab-steps">Steps</TabsTrigger>
                <TabsTrigger value="science" data-testid="tab-science">Science Explained</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Learning Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {experiment.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {experiment.safetyNotes && experiment.safetyNotes.length > 0 && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <AlertDescription className="ml-2">
                      <p className="font-semibold mb-2">Safety Notes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {experiment.safetyNotes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Experiment Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <img
                        src={getExperimentImage(experiment.thumbnailUrl)}
                        alt={experiment.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="steps" className="space-y-6 mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">
                          Step {currentStep + 1} of {experiment.steps.length}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(((currentStep + 1) / experiment.steps.length) * 100)}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${((currentStep + 1) / experiment.steps.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-2xl font-semibold">
                        {experiment.steps[currentStep].title}
                      </h4>
                      
                      {experiment.steps[currentStep].safetyWarning && (
                        <Alert className="border-destructive/50 bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <AlertDescription className="ml-2">
                            {experiment.steps[currentStep].safetyWarning}
                          </AlertDescription>
                        </Alert>
                      )}

                      <p className="text-lg leading-relaxed">
                        {experiment.steps[currentStep].description}
                      </p>

                      {experiment.steps[currentStep].imageUrl && (
                        <div className="aspect-video bg-muted rounded-md overflow-hidden">
                          <img
                            src={getExperimentImage(experiment.steps[currentStep].imageUrl)}
                            alt={`Step ${currentStep + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="flex-1"
                        data-testid="button-previous-step"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(Math.min(experiment.steps.length - 1, currentStep + 1))}
                        disabled={currentStep === experiment.steps.length - 1}
                        className="flex-1"
                        data-testid="button-next-step"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Step Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {experiment.steps.map((step, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStep(index)}
                          className={`w-full text-left p-3 rounded-md hover-elevate ${
                            index === currentStep
                              ? "bg-primary/10 border-2 border-primary"
                              : "border border-border"
                          }`}
                          data-testid={`button-step-${index + 1}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                index === currentStep
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{step.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="science" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">The Science Behind It</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {experiment.scienceExplained}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Tracking */}
            {isAuthenticated && (
              <Card className={isAuthenticated && progress?.completed ? "border-green-500" : ""} data-testid="card-progress">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5" />
                    Your Progress
                    {isPending && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="experiment-complete"
                      checked={progress?.completed || false}
                      onCheckedChange={handleToggleComplete}
                      disabled={isPending}
                      data-testid="checkbox-complete"
                    />
                    <label
                      htmlFor="experiment-complete"
                      className="flex-1 cursor-pointer font-medium"
                    >
                      Mark as Complete
                    </label>
                  </div>

                  {progress?.completed && progress.completedAt && (
                    <div className="text-sm text-muted-foreground">
                      Completed on {new Date(progress.completedAt).toLocaleDateString()}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <label htmlFor="experiment-notes" className="text-sm font-medium">
                      Your Notes
                    </label>
                    <Textarea
                      id="experiment-notes"
                      placeholder="Add your observations, results, or questions here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isPending}
                      className="min-h-32 resize-none"
                      data-testid="textarea-notes"
                    />
                    <p className="text-xs text-muted-foreground">
                      Notes save automatically
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Materials Checklist */}
            <Card className={allMaterialsChecked ? "border-green-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Materials Needed
                  {allMaterialsChecked && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      All Ready!
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {experiment.materialsNeeded.map((material, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Checkbox
                        id={`material-${index}`}
                        checked={checkedMaterials.has(index)}
                        onCheckedChange={() => toggleMaterial(index)}
                        data-testid={`checkbox-material-${index}`}
                      />
                      <label
                        htmlFor={`material-${index}`}
                        className={`flex-1 cursor-pointer leading-relaxed ${
                          checkedMaterials.has(index)
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {material}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Section */}
            <Quiz experimentId={Number(experimentId)} />
          </div>
        </div>

        {/* Related Experiments */}
        {relatedExperiments && relatedExperiments.length > 0 && (
          <section className="mt-12 md:mt-16">
            <h2 className="text-3xl font-semibold mb-6">Related Experiments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedExperiments.map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
