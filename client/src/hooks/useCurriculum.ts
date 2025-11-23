import { useQuery } from "@tanstack/react-query";
import type { CurriculumUnit } from "@shared/schema";

export function useCurriculumUnits() {
  return useQuery<CurriculumUnit[]>({
    queryKey: ["/api/curriculum"],
  });
}

export function useCurriculumUnitsByStage(stage: string | undefined) {
  return useQuery<CurriculumUnit[]>({
    queryKey: ["/api/curriculum/stage", stage],
    enabled: !!stage,
  });
}
