# Virtual Science Lab - NSW Curriculum Science Experiments

## Overview

This is an educational web application designed to provide K-12 students with interactive virtual science experiments aligned to the NSW curriculum. The platform enables students to conduct safe, hands-on experiments at home using household materials, making science education accessible to schools without laboratory facilities. The application features experiment browsing, filtering by curriculum stage and category, detailed step-by-step instructions, and related experiment recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool and development server.

**Component Library**: shadcn/ui components built on Radix UI primitives, providing an accessible, customizable component system with Tailwind CSS for styling.

**Routing**: wouter for client-side routing, providing a lightweight alternative to React Router. The application has three main routes:
- Home page (`/`) - Landing page with featured experiments and category navigation
- Experiments listing (`/experiments`) - Filterable grid of all experiments
- Experiment detail (`/experiments/:id`) - Individual experiment view with step-by-step instructions

**State Management**: TanStack Query (React Query) for server state management, handling data fetching, caching, and synchronization. No global client state management library is used; component state is managed locally with React hooks.

**Design System**: Custom design tokens defined in CSS variables following a light/dark theme pattern. The design emphasizes educational clarity with:
- Typography using Google Fonts (Poppins for headings, Inter for body text)
- Consistent spacing using Tailwind primitives (2, 4, 6, 8, 12, 16)
- Card-based layout system for experiment presentation
- Responsive grid layouts (1 column mobile, 2-3 columns desktop)

**File Organization**:
- `client/src/components/` - Reusable UI components
- `client/src/components/ui/` - shadcn/ui base components
- `client/src/pages/` - Route-level page components
- `client/src/hooks/` - Custom React hooks
- `client/src/lib/` - Utility functions and query client configuration

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful API with the following endpoints:
- `GET /api/experiments` - List all experiments with optional filtering
- `GET /api/experiments/featured` - Retrieve featured experiments
- `GET /api/experiments/:id` - Get single experiment by ID
- `GET /api/experiments/related/:id` - Get related experiments

**Data Storage Strategy**: Uses PostgreSQL database via Drizzle ORM (`DBStorage` class) for persistent data storage. The application maintains an `IStorage` interface that abstracts the data layer, with environment-based selection: DBStorage when DATABASE_URL exists, falling back to MemStorage for development without database access.

**Schema Design**: Zod schemas define the data structure and validation:
- Experiments contain metadata (title, description, category, curriculum stage, difficulty)
- Step-by-step instructions with optional images and safety warnings
- Material lists with household items indicator
- Learning outcomes and science explanations

**Filtering System**: Comprehensive experiment filtering supporting:
- Science category (Biology, Chemistry, Physics, Earth Science)
- NSW Curriculum stage (K-6, 7-10 Life Skills, 11-12 Science Life Skills)
- Difficulty level (beginner, intermediate, advanced)
- Household items only flag
- Maximum duration
- Text search across experiments

**Development Server**: Vite middleware mode integration for hot module replacement during development, with Express serving the production build in production mode.

### External Dependencies

**UI Component Libraries**:
- Radix UI primitives (@radix-ui/*) - Accessible component primitives
- shadcn/ui - Pre-built component patterns
- Tailwind CSS - Utility-first CSS framework
- class-variance-authority - Component variant management

**Data Fetching & Forms**:
- TanStack Query (@tanstack/react-query) - Server state management
- React Hook Form - Form state management
- Zod - Schema validation

**Database & ORM** (actively used):
- Drizzle ORM - TypeScript ORM for SQL databases
- @neondatabase/serverless - Neon PostgreSQL serverless driver with WebSocket support
- PostgreSQL connection via DATABASE_URL environment variable
- ws - WebSocket library for Neon serverless connections

**Development Tools**:
- Vite - Build tool and dev server
- TypeScript - Type safety
- ESBuild - Production build bundler
- @replit/* packages - Replit-specific development tooling

**Routing & Navigation**:
- wouter - Lightweight client-side routing

**Typography**:
- Google Fonts integration (Poppins, Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)

**Database Implementation**: The application uses PostgreSQL for all data persistence:
- Schema defined in `shared/schema.ts` with experiments table
- 8 seeded experiments across all categories and curriculum stages
- DBStorage implementation in `server/storage.ts` using Drizzle queries
- Type conversions between database format (integer IDs) and API format (string IDs)
- Comprehensive filtering support: category, curriculum stage, difficulty, household items, duration, text search
- Related experiments linked via JSON array of integer IDs

**Recent Changes**:

**Task 1 - Database Migration** (Completed):
- Migrated from in-memory MemStorage to persistent PostgreSQL database
- All experiment data now persisted in database with proper schema
- Environment-based storage selection allows development without database

**Task 2 - Authentication System** (Completed):
- Integrated Replit Auth (OpenID Connect) for user authentication
- Added users and sessions tables to database schema
- Implemented server-side auth with passport.js, session management
- Created useAuth hook for frontend authentication state
- Updated Header component with login/logout UI and user avatar dropdown
- Auth routes: /api/login, /api/logout, /api/callback, /api/auth/user
- User table includes role field (student/teacher) for future role-based access

**Task 3 - Student Progress Tracking** (Completed):
- Database schema: experiment_progress table with composite key (userId, experimentId)
- API endpoints: GET/POST /api/progress, GET/PATCH /api/progress/:id/notes, PATCH /api/progress/:id/complete
- Frontend hooks: useUserProgress() and useExperimentProgress() with TanStack Query
- UI features: completion badges on experiment cards, progress card with checkbox and auto-saving notes
- Auth-aware cache management: queries cleared on logout, invalidated/refetched on login
- Comprehensive e2e testing covering login, logout, and re-login flows
- Visual flash prevention with proper conditional rendering

**Task 4 - Quiz Component - Database & API** (Completed):
- Database schema: quizzes, quiz_questions, quiz_attempts tables with proper relationships
- Quiz storage methods: getQuizById, getQuizByExperimentId, getQuizQuestions, submitQuizAttempt, getUserQuizAttempts
- Security-hardened API endpoints:
  - GET /api/quizzes/experiment/:experimentId - Get quiz for an experiment
  - GET /api/quizzes/:quizId/questions - Get questions (sanitized, no correct answers)
  - POST /api/quizzes/:quizId/submit - Submit quiz attempt (questionId-based matching)
  - GET /api/quizzes/:quizId/attempts - Get user's quiz attempts
- Quiz submission security: Question ID-based matching, ownership validation, duplicate detection, per-question option validation
- Expected submission format: `{ answers: [{ questionId: number, selectedOption: number }, ...] }`
- Seed data: 2 quizzes (Bean Growing, Bread Mold) with multiple choice questions
- Server-side score calculation using quiz's passing score threshold

**Task 5 - Quiz Component - Frontend UI** (Completed):
- Quiz hooks: useExperimentQuiz, useQuizQuestions, useQuizAttempts, useSubmitQuiz with TanStack Query
- Interactive Quiz component (client/src/components/quiz.tsx):
  - Auth-gated (login required message for unauthenticated users)
  - Displays quiz title, description, passing score, question count
  - Radio button options for multiple choice questions
  - Answer validation (all questions must be answered)
  - Secure submission with questionId-based format
  - Results display with score, pass/fail status, per-question breakdown
  - Correct/incorrect indicators with explanations
  - Previous attempt history showing latest score and date
  - Retake functionality with state reset
  - "Already passed" badge persists if user has ever passed (fixed with refetchQueries)
- Integrated into experiment detail page
- Comprehensive e2e testing: full quiz flow, badge persistence across pass→fail sequences
- Bug fix: Changed from invalidateQueries to refetchQueries with await to prevent timing issues

**Curriculum Integration - Tasks 1-6** (Completed):
- **Task 1**: Parsed NSW curriculum documents and created structured dataset with 52 curriculum units (28 K-6 units spanning 8 terms, 24 Life Skills units spanning 4 terms)
- **Task 2**: Extended database schema with curriculum_units table (unitId, stage, component, term, name, description, outcomes, weeks) and experiment_curriculum_units junction table for many-to-many relationships
- **Task 3**: Successfully seeded 52 curriculum units into database via server/seed.ts
- **Task 4**: Mapped all 8 existing experiments to appropriate curriculum units:
  - Growing Beans → es1-t1, s1-t1 (living things, life cycles)
  - Bread Mold → comp-a-t2, comp-c-t2 (living/non-living, food safety)
  - Volcano Eruption → es1-t4, s1-t4 (matter, materials)
  - Rainbow in a Jar → comp-a-t4 (matter properties)
  - Make a Rainbow → s1-t5, s1-t6 (light and sound)
  - Simple Pendulum → comp-e-t3 (forces and motion)
  - Rock Observation → es1-t2, s1-t3 (materials, Earth)
  - Water Cycle → comp-b-t2, s1-t3 (weather, Earth systems)
- Created 14 experiment-curriculum mappings in junction table
- Curriculum data structure: server/curriculum-data.ts contains allCurriculumUnits array
- Unit ID format: K-6 uses "es1-t1", "s1-t2", etc.; Life Skills uses "comp-a-t1", "comp-b-t2", etc.
- **Task 5**: Added curriculum filtering to API (GET /api/experiments?curriculumUnitId=xxx)
  - Updated routes to parse curriculumUnitId from query string (handles string|string[] types)
  - Implemented filtering in DBStorage using JOIN on experiment_curriculum_units table
  - Implemented filtering in MemStorage using experiment-curriculum mappings
  - Backend validates and filters experiments by curriculum unit
- **Task 6**: Added curriculum filters to experiments listing UI
  - Created useCurriculumUnits hook to fetch all curriculum units from /api/curriculum
  - Added curriculum unit Select dropdown to FilterSidebar component
  - **Stage-specific filtering:** K-6 shows all 4 stages (ES1, S1, S2, S3); 7-10 and 11-12 Life Skills properly separated
  - **Auto-clear behavior:** Curriculum unit filter clears when stage changes
  - **Race condition prevention:** Select disabled while loading, empty fallback prevents cross-stage contamination
  - URL parameter integration: curriculumUnitId added to query string
  - Loading states with "Loading..." placeholder
  - E2E tested: stage switching, unit selection, URL updates, proper filtering across all stages