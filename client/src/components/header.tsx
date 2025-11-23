import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Home, BookOpen, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export function Header({ onSearch, showSearch = true }: HeaderProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getUserName = () => {
    if (!user) return "User";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl md:text-3xl font-bold text-primary cursor-pointer hover-elevate px-2 py-1 rounded-md">
                Virtual Science Lab
              </h1>
            </Link>
            <div className="md:hidden flex gap-2">
              <Link href="/">
                <Button variant={location === "/" ? "default" : "ghost"} size="icon" data-testid="button-home-mobile">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/experiments">
                <Button variant={location === "/experiments" ? "default" : "ghost"} size="icon" data-testid="button-experiments-mobile">
                  <BookOpen className="w-5 h-5" />
                </Button>
              </Link>
              <div data-testid="theme-toggle-mobile">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {showSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search experiments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </form>
          )}

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/">
              <Button variant={location === "/" ? "default" : "ghost"} data-testid="button-home">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/experiments">
              <Button variant={location === "/experiments" ? "default" : "ghost"} data-testid="button-experiments">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Experiments
              </Button>
            </Link>
            <div data-testid="theme-toggle-desktop">
              <ThemeToggle />
            </div>
            
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImageUrl ?? undefined} alt={getUserName()} style={{ objectFit: "cover" }} />
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium" data-testid="text-user-name">{getUserName()}</span>
                          {user?.email && <span className="text-xs text-muted-foreground" data-testid="text-user-email">{user.email}</span>}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href="/api/logout" className="cursor-pointer flex items-center" data-testid="button-logout">
                          <LogOut className="w-4 h-4 mr-2" />
                          Log Out
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild data-testid="button-login">
                    <a href="/api/login">
                      <User className="w-4 h-4 mr-2" />
                      Log In
                    </a>
                  </Button>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
