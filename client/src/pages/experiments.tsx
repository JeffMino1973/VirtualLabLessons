import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ExperimentCard } from "@/components/experiment-card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SlidersHorizontal } from "lucide-react";
import type { Experiment, ExperimentFilter } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { useUserProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";

export default function Experiments() {
  const [location, setLocation] = useLocation();
  const [filters, setFilters] = useState<ExperimentFilter>({});
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const { progressMap } = useUserProgress();
  const { isAuthenticated } = useAuth();

  // Parse URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFilters: ExperimentFilter = {};
    
    if (params.get("category")) {
      newFilters.category = params.get("category") as any;
    }
    if (params.get("curriculumStage")) {
      newFilters.curriculumStage = params.get("curriculumStage") as any;
    }
    if (params.get("curriculumUnitId")) {
      newFilters.curriculumUnitId = params.get("curriculumUnitId") || undefined;
    }
    if (params.get("difficulty")) {
      newFilters.difficulty = params.get("difficulty") as any;
    }
    if (params.get("searchQuery")) {
      newFilters.searchQuery = params.get("searchQuery") || undefined;
    }
    if (params.get("householdItemsOnly")) {
      newFilters.householdItemsOnly = params.get("householdItemsOnly") === "true";
    }
    if (params.get("maxDuration")) {
      newFilters.maxDuration = parseInt(params.get("maxDuration")!);
    }
    
    setFilters(newFilters);
  }, [location]);

  // Build query string from filters
  const buildQueryString = (filters: ExperimentFilter): string => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.curriculumStage) params.set("curriculumStage", filters.curriculumStage);
    if (filters.curriculumUnitId) params.set("curriculumUnitId", filters.curriculumUnitId);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.householdItemsOnly) params.set("householdItemsOnly", "true");
    if (filters.maxDuration) params.set("maxDuration", filters.maxDuration.toString());
    if (filters.searchQuery) params.set("searchQuery", filters.searchQuery);
    const queryString = params.toString();
    return `/api/experiments${queryString ? `?${queryString}` : ""}`;
  };

  const { data: experiments, isLoading } = useQuery<Experiment[]>({
    queryKey: [buildQueryString(filters)],
  });

  const handleSearch = (query: string) => {
    const newFilters = { ...filters, searchQuery: query || undefined };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleFilterChange = (newFilters: ExperimentFilter) => {
    setFilters(newFilters);
    updateURL(newFilters);
    setIsMobileFilterOpen(false);
  };

  const updateURL = (filters: ExperimentFilter) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.curriculumStage) params.set("curriculumStage", filters.curriculumStage);
    if (filters.curriculumUnitId) params.set("curriculumUnitId", filters.curriculumUnitId);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.searchQuery) params.set("searchQuery", filters.searchQuery);
    if (filters.householdItemsOnly) params.set("householdItemsOnly", "true");
    if (filters.maxDuration) params.set("maxDuration", filters.maxDuration.toString());
    
    const queryString = params.toString();
    setLocation(`/experiments${queryString ? `?${queryString}` : ""}`, { replace: true });
  };

  const filteredCount = experiments?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse Experiments</h1>
            <p className="text-muted-foreground">
              {isLoading ? "Loading..." : `${filteredCount} experiment${filteredCount !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" data-testid="button-open-filters">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="h-full overflow-y-auto p-6">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClose={() => setIsMobileFilterOpen(false)}
                  isMobile
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
            </div>
          </aside>

          {/* Experiments Grid */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-[450px] animate-pulse">
                    <div className="h-full bg-muted" />
                  </Card>
                ))}
              </div>
            ) : experiments && experiments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="grid-experiments">
                {experiments.map((experiment) => {
                  const progress = progressMap.get(Number(experiment.id));
                  return (
                    <ExperimentCard
                      key={experiment.id}
                      experiment={experiment}
                      isCompleted={isAuthenticated ? progress?.completed : false}
                    />
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">No experiments found</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button onClick={() => setFilters({})} data-testid="button-clear-all-filters">
                  Clear All Filters
                </Button>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
