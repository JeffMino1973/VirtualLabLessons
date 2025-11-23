import { Header } from "@/components/header";
import { CategorySection } from "@/components/category-section";
import { ExperimentCard } from "@/components/experiment-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronRight, Sparkles } from "lucide-react";
import type { Experiment, CurriculumStage } from "@shared/schema";
import heroImage from "@assets/generated_images/Hero_image_students_home_experiments_d3f42215.png";
import { useUserProgress } from "@/hooks/useProgress";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { progressMap } = useUserProgress();
  const { isAuthenticated } = useAuth();
  
  const { data: featuredExperiments, isLoading: isFeaturedLoading } = useQuery<Experiment[]>({
    queryKey: ["/api/experiments/featured"],
  });

  const handleSearch = (query: string) => {
    setLocation(`/experiments?search=${encodeURIComponent(query)}`);
  };

  const handleCategoryClick = () => {
    // Navigation is handled by the Link in CategorySection
  };

  const curriculumStages: Array<{
    stage: CurriculumStage;
    description: string;
    color: string;
  }> = [
    {
      stage: "K-6",
      description: "Foundation science concepts for primary students",
      color: "from-blue-500 to-cyan-500",
    },
    {
      stage: "7-10 Life Skills",
      description: "Practical science for secondary life skills students",
      color: "from-purple-500 to-pink-500",
    },
    {
      stage: "11-12 Science Life Skills",
      description: "Advanced life skills science for senior students",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />

      {/* Hero Section */}
      <section className="relative h-96 md:h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        
        <div className="relative h-full container mx-auto px-4 md:px-6 flex flex-col items-center justify-center text-center text-white">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white backdrop-blur-sm border-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            NSW Curriculum Aligned
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 md:mb-6 max-w-4xl leading-tight">
            Virtual Science Lab for Every Student
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl leading-relaxed opacity-95">
            Explore hands-on science experiments at home. Perfect for schools without laboratory access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/experiments">
              <Button size="lg" className="text-base px-8" data-testid="button-explore-experiments">
                Explore Experiments
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              onClick={() => handleSearch("")}
              data-testid="button-search-now"
            >
              Search Now
            </Button>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <CategorySection onCategoryClick={handleCategoryClick} />

      {/* Featured Experiments */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-2">Featured Experiments</h2>
              <p className="text-muted-foreground">Popular hands-on activities to get started</p>
            </div>
            <Link href="/experiments">
              <Button variant="ghost" data-testid="button-view-all">
                View All
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-[400px] animate-pulse">
                  <div className="h-full bg-muted" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredExperiments?.slice(0, 3).map((experiment) => {
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
          )}
        </div>
      </section>

      {/* Curriculum Stages */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-8 md:mb-12">
            Browse by Curriculum Stage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {curriculumStages.map((item) => (
              <Link
                key={item.stage}
                href={`/experiments?stage=${encodeURIComponent(item.stage)}`}
              >
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-visible" data-testid={`card-stage-${item.stage.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-6">
                    <div className={`w-full h-2 rounded-full bg-gradient-to-r ${item.color} mb-4`} />
                    <h3 className="text-2xl font-semibold mb-3">{item.stage}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>Virtual Science Lab - Making science accessible for all NSW students</p>
        </div>
      </footer>
    </div>
  );
}
