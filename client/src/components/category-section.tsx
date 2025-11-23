import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical, Leaf, Zap, Globe } from "lucide-react";
import { Link } from "wouter";
import type { ScienceCategory } from "@shared/schema";

const categories: Array<{
  name: ScienceCategory;
  icon: typeof FlaskConical;
  description: string;
  gradient: string;
}> = [
  {
    name: "Biology",
    icon: Leaf,
    description: "Explore living organisms and life processes",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    description: "Discover chemical reactions and matter",
    gradient: "from-purple-500 to-violet-600",
  },
  {
    name: "Physics",
    icon: Zap,
    description: "Understand forces, energy, and motion",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    name: "Earth Science",
    icon: Globe,
    description: "Study our planet and natural phenomena",
    gradient: "from-amber-500 to-orange-600",
  },
];

interface CategorySectionProps {
  onCategoryClick?: (category: ScienceCategory) => void;
}

export function CategorySection({ onCategoryClick }: CategorySectionProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-8 md:mb-12">
          Explore Science Topics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                href={`/experiments?category=${encodeURIComponent(category.name)}`}
              >
                <Card
                  className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-visible"
                  onClick={() => onCategoryClick?.(category.name)}
                  data-testid={`card-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
