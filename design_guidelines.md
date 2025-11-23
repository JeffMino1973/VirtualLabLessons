# Science Experiments App - Design Guidelines

## Design Approach
**Hybrid Educational Platform**: Drawing inspiration from Khan Academy's clarity and Duolingo's engagement, with custom interactive experiment components. Prioritizing accessibility for K-12 age range while maintaining scientific credibility.

## Core Design Elements

### Typography
- **Headings**: Clear, friendly sans-serif (Google Fonts: Poppins)
  - H1: text-4xl md:text-5xl font-bold
  - H2: text-3xl md:text-4xl font-semibold
  - H3: text-2xl font-semibold
- **Body**: Highly legible (Google Fonts: Inter)
  - Large text for younger students: text-lg
  - Instructions: text-base leading-relaxed
  - Labels/metadata: text-sm

### Layout System
**Tailwind spacing primitives**: 2, 4, 6, 8, 12, 16
- Card padding: p-6 md:p-8
- Section spacing: py-12 md:py-16
- Grid gaps: gap-6 md:gap-8
- Button padding: px-6 py-3

### Component Library

**Navigation**
- Fixed top navigation with curriculum stage selector (K-6, 7-10 LS, 11-12 LS)
- Search bar prominent in header
- Category filter sidebar (collapsible on mobile)

**Experiment Cards**
- Large preview image showing experiment concept
- Badge indicators: difficulty level, curriculum stage, duration
- Material count indicator (e.g., "5 household items")
- Clear CTA: "Start Experiment"
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

**Experiment Detail View**
- Split layout: Left sidebar (materials, metadata), Right main area (step-by-step)
- Interactive step progression with visual indicators
- Embedded simulation area (canvas or iframe container)
- Large "Next Step" / "Previous Step" navigation
- Safety warnings in distinct callout boxes

**Interactive Simulation Container**
- Fixed aspect ratio container (16:9 or 4:3)
- Control panel below simulation (play, pause, reset, speed controls)
- Visual feedback for interactive elements (drag zones, click targets)
- Step completion checkmarks

**Category Filters**
- Pill-style buttons for topics: Biology, Chemistry, Physics, Earth Science
- Toggle switches for: "Household materials only", "30 min or less"
- Clear active states with fill treatment

**Search & Discovery**
- Autocomplete search with experiment suggestions
- Recent searches saved locally
- Featured experiments carousel on homepage

### Images

**Hero Section**: Full-width hero (h-96 md:h-[500px]) featuring collage of students doing experiments at home
- Overlay: semi-transparent gradient for text readability
- Headline: "Virtual Science Lab for NSW Curriculum"
- CTA buttons with backdrop-blur-sm bg-white/90

**Experiment Thumbnails**: Bright, engaging images showing experiment setup or result
- All cards must have consistent image aspect ratio (3:2)
- Fallback: Illustrated icons for each science category

**Step Images**: Clear, well-lit photos showing each experiment step
- Annotations/arrows overlaid where needed
- Alternative: Simple illustrated diagrams for clarity

### Interactive States
- Hover: Subtle scale (scale-105) on experiment cards
- Active step: Highlighted with accent border
- Completed steps: Checkmark icon, reduced opacity
- Loading simulations: Skeleton placeholders with pulse animation

### Accessibility
- High contrast for all text over images
- Large touch targets (min 44x44px) for younger students
- Screen reader labels for all interactive elements
- Keyboard navigation for all experiment steps
- Alt text for all instructional images

### Layout Patterns
**Homepage**: 
- Hero section with search
- Quick category navigation (4-column grid of science topics)
- Featured experiments (horizontal scroll on mobile, grid on desktop)
- Browse by curriculum stage (3-column cards)

**Experiment Listing**:
- Sticky filter sidebar (desktop) / collapsible drawer (mobile)
- Experiment grid with infinite scroll or pagination
- Sort controls: Most Popular, Newest, Difficulty

**Experiment Detail**:
- Breadcrumb navigation
- Materials checklist (checkbox items students can mark off)
- Tabbed sections: Overview, Steps, Science Explained, Extensions
- Related experiments at bottom

### Visual Hierarchy
- Primary CTA: Solid fill buttons
- Secondary actions: Outline buttons
- Destructive/warning: Distinct color treatment for safety notes
- Progress indicators: Step numbers in circles, progress bar
- Success states: Celebration micro-animation on experiment completion