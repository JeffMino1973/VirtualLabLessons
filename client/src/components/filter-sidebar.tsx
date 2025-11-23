import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useCurriculumUnits } from "@/hooks/useCurriculum";
import type { ExperimentFilter, ScienceCategory, CurriculumStage, DifficultyLevel } from "@shared/schema";

interface FilterSidebarProps {
  filters: ExperimentFilter;
  onFilterChange: (filters: ExperimentFilter) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function FilterSidebar({ filters, onFilterChange, onClose, isMobile }: FilterSidebarProps) {
  const categories: ScienceCategory[] = ["Biology", "Chemistry", "Physics", "Earth Science"];
  const stages: CurriculumStage[] = ["K-6", "7-10 Life Skills", "11-12 Science Life Skills"];
  const difficulties: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];
  
  const { data: allCurriculumUnits, isLoading: isLoadingCurriculum } = useCurriculumUnits();
  
  // Filter curriculum units based on selected stage
  const filteredCurriculumUnits = filters.curriculumStage && allCurriculumUnits
    ? allCurriculumUnits.filter(unit => {
        if (filters.curriculumStage === "K-6") {
          // K-6 covers Early Stage 1, Stage 1, Stage 2, and Stage 3
          return unit.stage === "Early Stage 1" || 
                 unit.stage === "Stage 1" || 
                 unit.stage === "Stage 2" || 
                 unit.stage === "Stage 3";
        } else if (filters.curriculumStage === "7-10 Life Skills") {
          // 7-10 Life Skills has specific stage value
          return unit.stage === "7-10 Life Skills";
        } else if (filters.curriculumStage === "11-12 Science Life Skills") {
          // 11-12 Science Life Skills has specific stage value
          return unit.stage === "11-12 Science Life Skills";
        }
        return false;
      })
    : []; // Empty array when no stage selected (not all units)

  const handleClear = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== false);

  return (
    <Card className="h-full overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-2xl font-semibold">Filters</CardTitle>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClear} data-testid="button-clear-filters">
              Clear All
            </Button>
          )}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-filters">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Category</Label>
          <RadioGroup
            value={filters.category || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                category: value === "all" ? undefined : (value as ScienceCategory),
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="category-all" data-testid="radio-category-all" />
              <Label htmlFor="category-all" className="font-normal cursor-pointer">
                All Categories
              </Label>
            </div>
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <RadioGroupItem value={category} id={`category-${category}`} data-testid={`radio-category-${category.toLowerCase().replace(/\s+/g, '-')}`} />
                <Label htmlFor={`category-${category}`} className="font-normal cursor-pointer">
                  {category}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Curriculum Stage Filter */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Curriculum Stage</Label>
          <RadioGroup
            value={filters.curriculumStage || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                curriculumStage: value === "all" ? undefined : (value as CurriculumStage),
                // Always clear curriculum unit when stage changes
                curriculumUnitId: undefined,
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="stage-all" data-testid="radio-stage-all" />
              <Label htmlFor="stage-all" className="font-normal cursor-pointer">
                All Stages
              </Label>
            </div>
            {stages.map((stage) => (
              <div key={stage} className="flex items-center space-x-2">
                <RadioGroupItem value={stage} id={`stage-${stage}`} data-testid={`radio-stage-${stage.toLowerCase().replace(/\s+/g, '-')}`} />
                <Label htmlFor={`stage-${stage}`} className="font-normal cursor-pointer">
                  {stage}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Curriculum Unit Filter */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Curriculum Unit</Label>
          {filters.curriculumStage ? (
            <Select
              value={filters.curriculumUnitId || "all"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  curriculumUnitId: value === "all" ? undefined : value,
                })
              }
              disabled={isLoadingCurriculum}
            >
              <SelectTrigger data-testid="select-curriculum-unit">
                <SelectValue placeholder={isLoadingCurriculum ? "Loading..." : "All Units"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {filteredCurriculumUnits.map((unit) => (
                  <SelectItem key={unit.unitId} value={unit.unitId}>
                    {unit.stage ? `${unit.stage} ` : ''}{unit.component ? `${unit.component} ` : ''}Term {unit.term}: {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a curriculum stage to filter by unit
            </p>
          )}
        </div>

        <Separator />

        {/* Difficulty Filter */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Difficulty</Label>
          <RadioGroup
            value={filters.difficulty || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                difficulty: value === "all" ? undefined : (value as DifficultyLevel),
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="difficulty-all" data-testid="radio-difficulty-all" />
              <Label htmlFor="difficulty-all" className="font-normal cursor-pointer">
                All Levels
              </Label>
            </div>
            {difficulties.map((difficulty) => (
              <div key={difficulty} className="flex items-center space-x-2">
                <RadioGroupItem value={difficulty} id={`difficulty-${difficulty}`} data-testid={`radio-difficulty-${difficulty}`} />
                <Label htmlFor={`difficulty-${difficulty}`} className="font-normal cursor-pointer capitalize">
                  {difficulty}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Quick Filters */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Quick Filters</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="household-only" className="font-normal cursor-pointer">
              Household Items Only
            </Label>
            <Switch
              id="household-only"
              checked={filters.householdItemsOnly || false}
              onCheckedChange={(checked) =>
                onFilterChange({
                  ...filters,
                  householdItemsOnly: checked || undefined,
                })
              }
              data-testid="switch-household-items"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="quick-experiments" className="font-normal cursor-pointer">
              30 Minutes or Less
            </Label>
            <Switch
              id="quick-experiments"
              checked={filters.maxDuration === 30}
              onCheckedChange={(checked) =>
                onFilterChange({
                  ...filters,
                  maxDuration: checked ? 30 : undefined,
                })
              }
              data-testid="switch-quick-experiments"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
