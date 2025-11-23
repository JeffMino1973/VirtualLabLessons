import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";
import type { ExperimentProgress } from "@shared/schema";

export function useUserProgress() {
  const { isAuthenticated } = useAuth();

  const { data: progressList, isLoading } = useQuery<ExperimentProgress[]>({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  // Manage progress queries based on authentication state
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear queries when user logs out
      queryClient.removeQueries({ queryKey: ["/api/progress"] });
    } else {
      // Refetch queries when user logs in
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    }
  }, [isAuthenticated]);

  // Create a map of experimentId -> progress for easy lookup
  const progressMap = new Map<number, ExperimentProgress>();
  if (isAuthenticated) {
    progressList?.forEach((progress) => {
      progressMap.set(progress.experimentId, progress);
    });
  }

  return {
    progressList,
    progressMap,
    isLoading,
  };
}

export function useExperimentProgress(experimentId: string | undefined) {
  const { isAuthenticated } = useAuth();

  const { data: progress, isLoading } = useQuery<ExperimentProgress | null>({
    queryKey: ["/api/progress", experimentId],
    queryFn: async () => {
      const response = await fetch(`/api/progress/${experimentId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch progress");
      return response.json();
    },
    enabled: isAuthenticated && !!experimentId,
  });

  // Manage experiment-specific queries based on authentication state
  useEffect(() => {
    if (!isAuthenticated && experimentId) {
      // Clear queries when user logs out
      queryClient.removeQueries({ queryKey: ["/api/progress", experimentId] });
    } else if (isAuthenticated && experimentId) {
      // Refetch queries when user logs in
      queryClient.invalidateQueries({ queryKey: ["/api/progress", experimentId] });
    }
  }, [isAuthenticated, experimentId]);

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { completed?: boolean; notes?: string }) => {
      return apiRequest("POST", "/api/progress", {
        experimentId: Number(experimentId),
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", experimentId] });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      return apiRequest("PATCH", `/api/progress/${experimentId}/notes`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", experimentId] });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      return apiRequest("PATCH", `/api/progress/${experimentId}/complete`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", experimentId] });
    },
  });

  return {
    progress,
    isLoading,
    updateProgress: updateProgressMutation.mutate,
    updateNotes: updateNotesMutation.mutate,
    toggleComplete: toggleCompleteMutation.mutate,
    isPending:
      updateProgressMutation.isPending ||
      updateNotesMutation.isPending ||
      toggleCompleteMutation.isPending,
  };
}
