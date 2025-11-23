import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Beaker, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import type { Experiment } from "@shared/schema";
import { getExperimentImage } from "@/lib/experimentImages";

interface ExperimentCardProps {
  experiment: Experiment;
  isCompleted?: boolean;
}

const categoryColors: Record<string, string> = {
  Biology: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Chemistry: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Physics: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Earth Science": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const difficultyLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ExperimentCard({ experiment, isCompleted }: ExperimentCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate flex flex-col h-full" data-testid={`card-experiment-${experiment.id}`}>
      <div className="aspect-[3/2] overflow-hidden bg-muted relative">
        <img
          src={getExperimentImage(experiment.thumbnailUrl)}
          alt={experiment.title}
          className="w-full h-full object-cover"
          data-testid={`img-experiment-${experiment.id}`}
        />
        {isCompleted && (
          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1.5" data-testid={`badge-completed-${experiment.id}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <CardHeader className="space-y-0 pb-3">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className={categoryColors[experiment.category]}>
            {experiment.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {experiment.curriculumStage}
          </Badge>
        </div>
        <h3 className="text-xl font-semibold leading-tight" data-testid={`text-experiment-title-${experiment.id}`}>
          {experiment.title}
        </h3>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {experiment.description}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-4">
        <div className="flex items-center justify-between gap-4 w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{experiment.duration} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Beaker className="w-4 h-4" />
            <span>{experiment.materialsNeeded.length} items</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {difficultyLabels[experiment.difficulty]}
          </Badge>
        </div>
        
        <Link href={`/experiments/${experiment.id}`} className="w-full">
          <Button className="w-full" data-testid={`button-start-${experiment.id}`}>
            Start Experiment
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
