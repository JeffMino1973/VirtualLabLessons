import type { Experiment, InsertExperiment, ExperimentFilter, ExperimentDB, InsertExperimentDB, User, UpsertUser, ExperimentProgress, InsertProgress, Quiz, InsertQuiz, QuizQuestion, InsertQuizQuestion, QuizAttempt, InsertQuizAttempt, CurriculumUnit } from "@shared/schema";
import { experiments, users, experimentProgress, quizzes, quizQuestions, quizAttempts, curriculumUnits, experimentCurriculumUnits } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  // Experiment CRUD operations
  getAllExperiments(filters?: ExperimentFilter): Promise<Experiment[]>;
  getExperimentById(id: string): Promise<Experiment | undefined>;
  getFeaturedExperiments(): Promise<Experiment[]>;
  getRelatedExperiments(experimentId: string): Promise<Experiment[]>;
  createExperiment(experiment: InsertExperiment): Promise<Experiment>;
  
  // User operations (required for Replit Auth)
  // Reference: blueprint:javascript_log_in_with_replit
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Progress tracking operations
  getProgress(userId: string, experimentId: number): Promise<ExperimentProgress | undefined>;
  getAllProgressByUser(userId: string): Promise<ExperimentProgress[]>;
  upsertProgress(progress: InsertProgress): Promise<ExperimentProgress>;
  updateProgressNotes(userId: string, experimentId: number, notes: string): Promise<ExperimentProgress>;
  markExperimentComplete(userId: string, experimentId: number, completed: boolean): Promise<ExperimentProgress>;
  
  // Quiz operations
  getQuizById(quizId: number): Promise<Quiz | undefined>;
  getQuizByExperimentId(experimentId: number): Promise<Quiz | undefined>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: string, quizId: number): Promise<QuizAttempt[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  
  // Curriculum operations
  getAllCurriculumUnits(): Promise<CurriculumUnit[]>;
  getCurriculumUnitsByStage(stage: string): Promise<CurriculumUnit[]>;
  getCurriculumUnitById(unitId: string): Promise<CurriculumUnit | undefined>;
  getExperimentCurriculumUnits(experimentId: number): Promise<CurriculumUnit[]>;
}

export class MemStorage implements IStorage {
  private experiments: Map<string, Experiment>;
  private usersMap: Map<string, User>;
  private progressMap: Map<string, ExperimentProgress>;
  private experimentCurriculumMap: Map<string, Set<string>>; // curriculumUnitId -> Set<experimentId>

  constructor(skipSeed = false) {
    this.experiments = new Map();
    this.usersMap = new Map();
    this.progressMap = new Map();
    this.experimentCurriculumMap = new Map();
    if (!skipSeed) {
      this.seedData();
    }
  }

  async getAllExperiments(filters?: ExperimentFilter): Promise<Experiment[]> {
    let experiments = Array.from(this.experiments.values());

    if (!filters) {
      return experiments;
    }

    // Apply curriculum unit filter first (most specific)
    if (filters.curriculumUnitId) {
      const experimentIds = this.experimentCurriculumMap.get(filters.curriculumUnitId);
      if (experimentIds) {
        experiments = experiments.filter((exp) => experimentIds.has(exp.id));
      } else {
        // No experiments for this curriculum unit
        return [];
      }
    }

    // Apply category filter
    if (filters.category) {
      experiments = experiments.filter((exp) => exp.category === filters.category);
    }

    // Apply curriculum stage filter
    if (filters.curriculumStage) {
      experiments = experiments.filter((exp) => exp.curriculumStage === filters.curriculumStage);
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      experiments = experiments.filter((exp) => exp.difficulty === filters.difficulty);
    }

    // Apply household items only filter
    if (filters.householdItemsOnly) {
      experiments = experiments.filter((exp) => exp.householdItemsOnly === true);
    }

    // Apply max duration filter
    if (filters.maxDuration) {
      experiments = experiments.filter((exp) => exp.duration <= filters.maxDuration!);
    }

    // Apply search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      experiments = experiments.filter(
        (exp) =>
          exp.title.toLowerCase().includes(query) ||
          exp.description.toLowerCase().includes(query) ||
          exp.category.toLowerCase().includes(query)
      );
    }

    return experiments;
  }

  async getExperimentById(id: string): Promise<Experiment | undefined> {
    return this.experiments.get(id);
  }

  async getFeaturedExperiments(): Promise<Experiment[]> {
    // Return first 6 experiments as featured
    return Array.from(this.experiments.values()).slice(0, 6);
  }

  async getRelatedExperiments(experimentId: string): Promise<Experiment[]> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.relatedExperiments) {
      return [];
    }

    const related = experiment.relatedExperiments
      .map((id) => this.experiments.get(id))
      .filter((exp): exp is Experiment => exp !== undefined);

    return related;
  }

  async createExperiment(insertExperiment: InsertExperiment): Promise<Experiment> {
    const id = randomUUID();
    const experiment: Experiment = { ...insertExperiment, id };
    this.experiments.set(id, experiment);
    return experiment;
  }

  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.usersMap.get(userData.id!);
    const user: User = {
      id: userData.id ?? randomUUID(),
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      role: userData.role ?? "student",
      createdAt: existingUser?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.usersMap.set(user.id, user);
    return user;
  }

  // Progress tracking operations
  private getProgressKey(userId: string, experimentId: number): string {
    return `${userId}:${experimentId}`;
  }

  async getProgress(userId: string, experimentId: number): Promise<ExperimentProgress | undefined> {
    const key = this.getProgressKey(userId, experimentId);
    return this.progressMap.get(key);
  }

  async getAllProgressByUser(userId: string): Promise<ExperimentProgress[]> {
    return Array.from(this.progressMap.values()).filter(p => p.userId === userId);
  }

  async upsertProgress(progressData: InsertProgress): Promise<ExperimentProgress> {
    // Defensive guard against invalid experimentId
    if (!Number.isFinite(progressData.experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const key = this.getProgressKey(progressData.userId, progressData.experimentId);
    const existing = this.progressMap.get(key);
    
    const progress: ExperimentProgress = {
      id: existing?.id ?? Math.floor(Math.random() * 1000000),
      userId: progressData.userId,
      experimentId: progressData.experimentId,
      completed: progressData.completed ?? false,
      notes: progressData.notes ?? null,
      completedAt: progressData.completedAt ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    
    this.progressMap.set(key, progress);
    return progress;
  }

  async updateProgressNotes(userId: string, experimentId: number, notes: string): Promise<ExperimentProgress> {
    // Defensive guard against invalid experimentId
    if (!Number.isFinite(experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const existing = await this.getProgress(userId, experimentId);
    return this.upsertProgress({
      userId,
      experimentId,
      completed: existing?.completed ?? false,
      notes,
      completedAt: existing?.completedAt ?? null,
    });
  }

  async markExperimentComplete(userId: string, experimentId: number, completed: boolean): Promise<ExperimentProgress> {
    // Defensive guard against invalid experimentId
    if (!Number.isFinite(experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const existing = await this.getProgress(userId, experimentId);
    return this.upsertProgress({
      userId,
      experimentId,
      completed,
      notes: existing?.notes ?? null,
      completedAt: completed ? new Date() : null,
    });
  }

  // Quiz operations (stub implementations for MemStorage)
  async getQuizById(quizId: number): Promise<Quiz | undefined> {
    throw new Error("Quiz operations not implemented for MemStorage");
  }

  async getQuizByExperimentId(experimentId: number): Promise<Quiz | undefined> {
    throw new Error("Quiz operations not implemented for MemStorage");
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    throw new Error("Quiz operations not implemented for MemStorage");
  }

  async submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    throw new Error("Quiz operations not implemented for MemStorage");
  }

  async getUserQuizAttempts(userId: string, quizId: number): Promise<QuizAttempt[]> {
    throw new Error("Quiz operations not implemented for MemStorage");
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    throw new Error("Quiz operations not implemented for MemStorage");
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    throw new Error("Quiz operations not implemented for MemStorage");
  }

  // Curriculum operations (stub implementations for MemStorage)
  async getAllCurriculumUnits(): Promise<CurriculumUnit[]> {
    throw new Error("Curriculum operations not implemented for MemStorage");
  }

  async getCurriculumUnitsByStage(stage: string): Promise<CurriculumUnit[]> {
    throw new Error("Curriculum operations not implemented for MemStorage");
  }

  async getCurriculumUnitById(unitId: string): Promise<CurriculumUnit | undefined> {
    throw new Error("Curriculum operations not implemented for MemStorage");
  }

  async getExperimentCurriculumUnits(experimentId: number): Promise<CurriculumUnit[]> {
    throw new Error("Curriculum operations not implemented for MemStorage");
  }

  private seedData() {
    // Seed comprehensive experiment data
    const experimentsData: InsertExperiment[] = [
      // Biology Experiments
      {
        title: "Growing Beans: Watch Seeds Sprout",
        description: "Observe the life cycle of a bean plant from seed to sprout. Learn about germination, root systems, and plant growth in this hands-on biology experiment.",
        category: "Biology",
        curriculumStage: "K-6",
        difficulty: "beginner",
        duration: 20,
        materialsNeeded: [
          "Bean seeds (3-4)",
          "Clear plastic cup or jar",
          "Paper towel",
          "Water",
          "Sunny windowsill",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Biology_plant_growth_experiment_5df15ee3.png",
        steps: [
          {
            stepNumber: 1,
            title: "Prepare the Container",
            description: "Take a clear plastic cup or jar and line it with a damp paper towel. Make sure the paper towel covers the inside walls of the container.",
          },
          {
            stepNumber: 2,
            title: "Place the Seeds",
            description: "Carefully place 3-4 bean seeds between the paper towel and the container wall. Space them evenly so you can observe each seed.",
          },
          {
            stepNumber: 3,
            title: "Keep Moist and Observe",
            description: "Place the container in a sunny spot. Keep the paper towel moist by adding water daily. Observe and record changes over 7-10 days.",
          },
        ],
        scienceExplained: "Seeds contain everything needed to start a new plant. When water, warmth, and oxygen are present, germination begins. The seed coat softens, and the embryo inside starts to grow. First, a root (radicle) emerges to anchor the plant and absorb water. Then a shoot grows upward toward light. The seed leaves (cotyledons) provide food until the plant can make its own through photosynthesis.",
        learningOutcomes: [
          "Understand the process of seed germination",
          "Observe plant life cycle stages",
          "Learn about plant structures (roots, stems, leaves)",
          "Practice scientific observation and recording",
        ],
        safetyNotes: ["Wash hands after handling seeds"],
      },
      {
        title: "Bread Mold Experiment",
        description: "Explore how mold grows on bread under different conditions. Investigate the factors that affect microorganism growth.",
        category: "Biology",
        curriculumStage: "7-10 Life Skills",
        difficulty: "intermediate",
        duration: 25,
        materialsNeeded: [
          "4 slices of bread",
          "4 plastic zip-lock bags",
          "Water spray bottle",
          "Marker for labeling",
          "Dark cupboard",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Biology_plant_growth_experiment_5df15ee3.png",
        steps: [
          {
            stepNumber: 1,
            title: "Prepare Bread Samples",
            description: "Take 4 slices of bread. Leave one completely dry. Lightly spray the second with water. Spray the third heavily with water. Leave the fourth as a control in the original packaging.",
            safetyWarning: "Do not open the bags once sealed. Mold can cause allergic reactions.",
          },
          {
            stepNumber: 2,
            title: "Seal and Label",
            description: "Place each slice in a separate zip-lock bag and seal tightly. Label each bag: 'Dry', 'Moist', 'Very Wet', and 'Control'.",
          },
          {
            stepNumber: 3,
            title: "Store and Observe",
            description: "Place all bags in a dark cupboard. Observe daily for 7-10 days without opening the bags. Take photos and record observations.",
          },
        ],
        scienceExplained: "Mold is a type of fungus that reproduces through spores. These microscopic spores are everywhere in our environment. Mold needs moisture, warmth, food (the bread), and time to grow. The wet bread provides ideal conditions - moisture helps spores germinate and grow into visible colonies. Different moisture levels affect growth rate. This demonstrates how controlling environmental conditions can prevent or promote microbial growth, which is important for food safety and preservation.",
        learningOutcomes: [
          "Understand microorganism growth requirements",
          "Learn about fungi and their characteristics",
          "Explore scientific method through controlled experiments",
          "Understand food preservation principles",
        ],
        safetyNotes: [
          "Never open the sealed bags after mold appears",
          "Dispose of all bags sealed in trash when finished",
          "Wash hands thoroughly if bags are touched",
        ],
      },
      // Chemistry Experiments
      {
        title: "Volcano Eruption: Acid-Base Reaction",
        description: "Create a spectacular volcano eruption using household chemicals. Learn about acid-base reactions and chemical changes.",
        category: "Chemistry",
        curriculumStage: "K-6",
        difficulty: "beginner",
        duration: 15,
        materialsNeeded: [
          "Baking soda (2 tablespoons)",
          "White vinegar (1/2 cup)",
          "Red food coloring",
          "Dish soap (1 tablespoon)",
          "Plastic bottle or cup",
          "Tray to catch overflow",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Volcano_eruption_baking_soda_5214d055.png",
        steps: [
          {
            stepNumber: 1,
            title: "Build Your Volcano",
            description: "Place a plastic bottle or cup on a tray. You can build a volcano shape around it using clay or paper mache (optional).",
          },
          {
            stepNumber: 2,
            title: "Add Ingredients",
            description: "Put 2 tablespoons of baking soda into the bottle. Add 1 tablespoon of dish soap and several drops of red food coloring.",
          },
          {
            stepNumber: 3,
            title: "Create the Eruption",
            description: "Quickly pour 1/2 cup of vinegar into the bottle. Step back and watch the eruption!",
          },
        ],
        scienceExplained: "This experiment demonstrates an acid-base reaction. Vinegar contains acetic acid, and baking soda is sodium bicarbonate (a base). When they mix, they react to form carbon dioxide gas, water, and sodium acetate. The carbon dioxide gas creates bubbles that push the mixture up and out like a volcanic eruption. The dish soap helps trap the gas to make more foam, and the food coloring makes it look like lava.",
        learningOutcomes: [
          "Understand acid-base chemical reactions",
          "Observe gas production in a chemical reaction",
          "Learn about volcanoes and their eruptions",
          "Practice safe chemical handling",
        ],
        safetyNotes: [
          "Conduct experiment on a protected surface or outdoors",
          "Avoid getting mixture in eyes",
        ],
      },
      {
        title: "Rainbow in a Jar: Density Layers",
        description: "Create a beautiful rainbow by layering liquids of different densities. Explore the concept of density and how it affects liquid behavior.",
        category: "Chemistry",
        curriculumStage: "7-10 Life Skills",
        difficulty: "intermediate",
        duration: 30,
        materialsNeeded: [
          "Tall clear glass or jar",
          "Honey",
          "Dish soap",
          "Water",
          "Vegetable oil",
          "Rubbing alcohol",
          "Food coloring (various colors)",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Chemistry_mixing_colors_experiment_b9bd8a55.png",
        steps: [
          {
            stepNumber: 1,
            title: "Prepare Colored Liquids",
            description: "Color your water blue, and your rubbing alcohol red (or use clear). Keep honey, dish soap, and oil their natural colors.",
          },
          {
            stepNumber: 2,
            title: "Layer from Densest to Least Dense",
            description: "Pour honey into the jar first (it's the densest). Slowly add dish soap, then colored water, then vegetable oil. Pour each liquid slowly down the side of the jar.",
          },
          {
            stepNumber: 3,
            title: "Add the Top Layer",
            description: "Finally, very carefully pour rubbing alcohol on top (least dense). Watch the rainbow layers form!",
            safetyWarning: "Keep rubbing alcohol away from heat sources and flames.",
          },
        ],
        scienceExplained: "Density is the amount of mass in a given volume. Different liquids have different densities. Honey is very dense (thick and heavy), while alcohol is less dense (lighter). When you pour liquids of different densities into a container, they separate into layers with the densest at the bottom and the least dense on top. They don't mix because their molecules have different sizes and attractions to each other. This is why oil floats on water, and it's the same principle that causes icebergs to float in the ocean.",
        learningOutcomes: [
          "Understand the concept of density",
          "Learn why different liquids layer",
          "Explore molecular properties of common substances",
          "Practice careful measuring and pouring techniques",
        ],
      },
      // Physics Experiments
      {
        title: "Make a Rainbow with Sunlight",
        description: "Use water and sunlight to create your own rainbow. Learn about light refraction and the visible spectrum.",
        category: "Physics",
        curriculumStage: "K-6",
        difficulty: "beginner",
        duration: 10,
        materialsNeeded: [
          "Clear glass filled with water",
          "White paper or wall",
          "Sunny day or flashlight",
          "Small mirror (optional)",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Rainbow_light_refraction_prism_75fddc8c.png",
        steps: [
          {
            stepNumber: 1,
            title: "Set Up Your Glass",
            description: "Fill a clear glass about 3/4 full with water. Place it on a table near a sunny window.",
          },
          {
            stepNumber: 2,
            title: "Position the Paper",
            description: "Hold a white piece of paper or position yourself near a white wall on the opposite side of the glass from the sunlight.",
          },
          {
            stepNumber: 3,
            title: "Find Your Rainbow",
            description: "Adjust the position of the glass and paper until you see a rainbow appear on the paper. You may need to tilt the glass slightly.",
          },
        ],
        scienceExplained: "White light from the sun contains all the colors of the rainbow. When light passes through water, it bends (refracts) because light travels at different speeds through different materials. Each color of light bends at a slightly different angle. This separates the white light into its component colors: red, orange, yellow, green, blue, indigo, and violet. This is the same process that creates rainbows in the sky when sunlight passes through raindrops.",
        learningOutcomes: [
          "Understand light refraction",
          "Learn about the visible spectrum",
          "Discover how rainbows form in nature",
          "Explore properties of light and color",
        ],
      },
      {
        title: "Build a Simple Pendulum",
        description: "Create a pendulum and explore how length affects its swing period. Investigate the physics of motion and gravity.",
        category: "Physics",
        curriculumStage: "11-12 Science Life Skills",
        difficulty: "advanced",
        duration: 35,
        materialsNeeded: [
          "String or thread (1 meter)",
          "Small weight (washer, key, or similar)",
          "Ruler or tape measure",
          "Stopwatch or phone timer",
          "Pencil and support stand",
          "Notebook for recording",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Physics_forces_motion_experiment_4bf72128.png",
        steps: [
          {
            stepNumber: 1,
            title: "Build the Pendulum",
            description: "Tie a weight to one end of the string. Attach the other end to a fixed support (like a pencil taped to the edge of a table). Start with a string length of 50cm from support to weight.",
          },
          {
            stepNumber: 2,
            title: "Measure the Period",
            description: "Pull the weight to one side (about 15cm) and release. Use a stopwatch to time how long it takes to complete 10 full swings. Divide by 10 to get the period (time for one swing).",
          },
          {
            stepNumber: 3,
            title: "Test Different Lengths",
            description: "Shorten the string to 30cm and repeat the timing. Then try 70cm. Record all measurements in a table comparing length vs. period.",
          },
          {
            stepNumber: 4,
            title: "Analyze Your Results",
            description: "Plot your data on a graph (length vs. period). What pattern do you notice? How does length affect the pendulum's swing time?",
          },
        ],
        scienceExplained: "A pendulum's period (time for one complete swing) depends mainly on its length, not its weight or how far you pull it. This is governed by a simple equation: T = 2π√(L/g), where T is period, L is length, and g is gravity. Longer pendulums swing more slowly because the weight has farther to travel. This principle was discovered by Galileo and is used in grandfather clocks to keep accurate time. The period depends on the square root of length - doubling the length doesn't double the period, it increases it by about 1.4 times.",
        learningOutcomes: [
          "Understand periodic motion",
          "Learn about the relationship between length and period",
          "Practice data collection and graphing",
          "Explore real-world applications of pendulum physics",
        ],
      },
      // Earth Science Experiments
      {
        title: "Rock and Mineral Observation",
        description: "Examine different rocks and minerals to learn about their properties. Develop classification skills and understand Earth's materials.",
        category: "Earth Science",
        curriculumStage: "K-6",
        difficulty: "beginner",
        duration: 20,
        materialsNeeded: [
          "Various rocks from outside",
          "Magnifying glass",
          "Water",
          "Vinegar",
          "Notebook and pencil",
          "Nail or coin",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Earth_science_geology_experiment_0dedf2de.png",
        steps: [
          {
            stepNumber: 1,
            title: "Collect Rock Samples",
            description: "Gather 5-6 different rocks from your yard, park, or nearby area. Look for rocks that appear different in color, texture, or size.",
          },
          {
            stepNumber: 2,
            title: "Observe Physical Properties",
            description: "Use a magnifying glass to examine each rock. Note the color, texture (smooth, rough, grainy), and any patterns. Try scratching each rock with a nail - does it scratch easily or is it hard?",
          },
          {
            stepNumber: 3,
            title: "Test Reactivity",
            description: "Drop a little vinegar on each rock. If it fizzes, the rock likely contains calcium carbonate (like limestone). Record your observations.",
          },
          {
            stepNumber: 4,
            title: "Classify Your Rocks",
            description: "Group your rocks by similar properties. Create a simple classification system and draw pictures of each type in your notebook.",
          },
        ],
        scienceExplained: "Rocks are made of minerals, which are naturally occurring substances with specific chemical compositions. Different rocks form in different ways: igneous rocks form from cooled magma, sedimentary rocks form from compressed sediments, and metamorphic rocks form when existing rocks are changed by heat and pressure. The properties we observe (hardness, color, texture, reactivity) help us identify and classify rocks. Geologists use these same methods to study Earth's history and understand the processes that shape our planet.",
        learningOutcomes: [
          "Learn to identify rock properties",
          "Understand basic rock types",
          "Practice scientific observation and classification",
          "Appreciate Earth's geological diversity",
        ],
      },
      {
        title: "Water Cycle in a Bag",
        description: "Create a mini water cycle to observe evaporation, condensation, and precipitation. Learn about Earth's water systems.",
        category: "Earth Science",
        curriculumStage: "7-10 Life Skills",
        difficulty: "intermediate",
        duration: 20,
        materialsNeeded: [
          "Clear plastic zip-lock bag",
          "Permanent marker (blue)",
          "Water (1/4 cup)",
          "Blue food coloring (optional)",
          "Tape",
          "Sunny window",
        ],
        householdItemsOnly: true,
        thumbnailUrl: "/assets/generated_images/Earth_science_geology_experiment_0dedf2de.png",
        steps: [
          {
            stepNumber: 1,
            title: "Draw the Water Cycle",
            description: "Use a permanent marker to draw a simple sun, clouds, and waves on the outside of the bag to represent the water cycle.",
          },
          {
            stepNumber: 2,
            title: "Add Water",
            description: "Pour 1/4 cup of water into the bag. Add a drop of blue food coloring to make it easier to see. Seal the bag tightly, removing as much air as possible.",
          },
          {
            stepNumber: 3,
            title: "Hang in Sunlight",
            description: "Tape the bag to a sunny window. Make sure it's secure and won't fall. The bottom should be slightly lower than the top.",
          },
          {
            stepNumber: 4,
            title: "Observe Changes",
            description: "Check the bag every hour. You should see water droplets forming on the inside (condensation) and water collecting at the bottom (precipitation). Record your observations over several hours or days.",
          },
        ],
        scienceExplained: "The water cycle is the continuous movement of water on, above, and below Earth's surface. In your bag: the sun's heat causes evaporation (water turns to vapor and rises), the vapor cools against the bag and condenses (turns back to liquid droplets - like clouds), and when enough droplets collect, they run down the bag as precipitation (like rain). This same process happens in nature on a massive scale. The sun heats oceans, lakes, and rivers, causing evaporation. The water vapor rises, cools, forms clouds, and eventually falls as rain or snow, completing the cycle.",
        learningOutcomes: [
          "Understand the water cycle stages",
          "Observe evaporation and condensation",
          "Learn about Earth's water systems",
          "Connect small-scale models to global processes",
        ],
      },
    ];

    experimentsData.forEach((exp) => {
      const id = randomUUID();
      const experiment: Experiment = { ...exp, id };
      this.experiments.set(id, experiment);
    });

    // Set up some related experiments
    const allExperiments = Array.from(this.experiments.values());
    allExperiments.forEach((exp, index) => {
      const sameCategory = allExperiments
        .filter((e) => e.category === exp.category && e.id !== exp.id)
        .slice(0, 2)
        .map((e) => e.id);

      const samStage = allExperiments
        .filter((e) => e.curriculumStage === exp.curriculumStage && e.id !== exp.id && !sameCategory.includes(e.id))
        .slice(0, 1)
        .map((e) => e.id);

      exp.relatedExperiments = [...sameCategory, ...samStage].filter((id) => id !== undefined);
    });

    // Seed curriculum unit mappings for filtering
    const curriculumMappings: { [title: string]: string[] } = {
      "Growing Beans: Watch Seeds Sprout": ["es1-t1", "s1-t1"],
      "Bread Mold Experiment": ["comp-a-t2", "comp-c-t2"],
      "Volcano Eruption: Acid-Base Reaction": ["es1-t4", "s1-t4"],
      "Rainbow in a Jar: Density Layers": ["comp-a-t4"],
      "Make a Rainbow": ["s1-t5", "s1-t6"],
      "Simple Pendulum": ["comp-e-t3"],
      "Rock Observation and Classification": ["es1-t2", "s1-t3"],
      "Water Cycle in a Bag": ["comp-b-t2", "s1-t3"],
    };

    allExperiments.forEach((exp) => {
      const unitIds = curriculumMappings[exp.title];
      if (unitIds) {
        unitIds.forEach((unitId) => {
          if (!this.experimentCurriculumMap.has(unitId)) {
            this.experimentCurriculumMap.set(unitId, new Set());
          }
          this.experimentCurriculumMap.get(unitId)!.add(exp.id);
        });
      }
    });
  }
}

// Database Storage Implementation
export class DBStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    this.db = drizzle(pool);
  }

  // Helper to convert DB format to API format
  private dbToApi(dbExp: ExperimentDB): Experiment {
    return {
      id: dbExp.id.toString(),
      title: dbExp.title,
      description: dbExp.description,
      category: dbExp.category as any,
      curriculumStage: dbExp.curriculumStage as any,
      difficulty: dbExp.difficulty as any,
      duration: dbExp.duration,
      materialsNeeded: dbExp.materialsNeeded,
      householdItemsOnly: dbExp.householdItemsOnly,
      thumbnailUrl: dbExp.thumbnailUrl,
      steps: dbExp.steps,
      scienceExplained: dbExp.scienceExplained,
      learningOutcomes: dbExp.learningOutcomes,
      safetyNotes: dbExp.safetyNotes || undefined,
      relatedExperiments: dbExp.relatedExperiments?.map(id => id.toString()),
      videoUrl: dbExp.videoUrl || undefined,
    };
  }

  async getAllExperiments(filters?: ExperimentFilter): Promise<Experiment[]> {
    // If filtering by curriculum unit, use a different query with join
    if (filters?.curriculumUnitId) {
      const curriculumUnit = await this.getCurriculumUnitById(filters.curriculumUnitId);
      if (!curriculumUnit) {
        return []; // Return empty if curriculum unit doesn't exist
      }

      const experimentIds = await this.db
        .select({ experimentId: experimentCurriculumUnits.experimentId })
        .from(experimentCurriculumUnits)
        .where(eq(experimentCurriculumUnits.curriculumUnitId, curriculumUnit.id));

      const expIds = experimentIds.map(e => e.experimentId);
      
      if (expIds.length === 0) {
        return []; // No experiments for this curriculum unit
      }

      const conditions = [];
      
      // Add curriculum experiments filter
      conditions.push(sql`${experiments.id} IN (${sql.join(expIds.map(id => sql`${id}`), sql`, `)})`);

      // Apply other filters
      if (filters?.category) {
        conditions.push(eq(experiments.category, filters.category));
      }
      if (filters?.curriculumStage) {
        conditions.push(eq(experiments.curriculumStage, filters.curriculumStage));
      }
      if (filters?.difficulty) {
        conditions.push(eq(experiments.difficulty, filters.difficulty));
      }
      if (filters?.householdItemsOnly) {
        conditions.push(eq(experiments.householdItemsOnly, true));
      }
      if (filters?.maxDuration) {
        conditions.push(sql`${experiments.duration} <= ${filters.maxDuration}`);
      }
      if (filters?.searchQuery) {
        const query = `%${filters.searchQuery}%`;
        conditions.push(
          or(
            ilike(experiments.title, query),
            ilike(experiments.description, query),
            ilike(experiments.category, query)
          )
        );
      }

      const results = await this.db
        .select()
        .from(experiments)
        .where(and(...conditions));

      return results.map(r => this.dbToApi(r));
    }

    // Standard filtering without curriculum unit
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(experiments.category, filters.category));
    }
    if (filters?.curriculumStage) {
      conditions.push(eq(experiments.curriculumStage, filters.curriculumStage));
    }
    if (filters?.difficulty) {
      conditions.push(eq(experiments.difficulty, filters.difficulty));
    }
    if (filters?.householdItemsOnly) {
      conditions.push(eq(experiments.householdItemsOnly, true));
    }
    if (filters?.maxDuration) {
      conditions.push(sql`${experiments.duration} <= ${filters.maxDuration}`);
    }
    if (filters?.searchQuery) {
      const query = `%${filters.searchQuery}%`;
      conditions.push(
        or(
          ilike(experiments.title, query),
          ilike(experiments.description, query),
          ilike(experiments.category, query)
        )
      );
    }

    const query = conditions.length > 0
      ? this.db.select().from(experiments).where(and(...conditions))
      : this.db.select().from(experiments);

    const results = await query;
    return results.map(r => this.dbToApi(r));
  }

  async getExperimentById(id: string): Promise<Experiment | undefined> {
    const result = await this.db
      .select()
      .from(experiments)
      .where(eq(experiments.id, parseInt(id)));

    if (result.length === 0) return undefined;
    return this.dbToApi(result[0]);
  }

  async getFeaturedExperiments(): Promise<Experiment[]> {
    const results = await this.db
      .select()
      .from(experiments)
      .limit(6);

    return results.map(r => this.dbToApi(r));
  }

  async getRelatedExperiments(experimentId: string): Promise<Experiment[]> {
    const experiment = await this.getExperimentById(experimentId);
    if (!experiment || !experiment.relatedExperiments || experiment.relatedExperiments.length === 0) {
      return [];
    }

    const relatedIds = experiment.relatedExperiments.map(id => parseInt(id));
    
    // Build OR conditions for each related ID
    const conditions = relatedIds.map(id => eq(experiments.id, id));
    
    const results = await this.db
      .select()
      .from(experiments)
      .where(or(...conditions));

    return results.map(r => this.dbToApi(r));
  }

  async createExperiment(insertExp: InsertExperiment): Promise<Experiment> {
    const dbInsert: InsertExperimentDB = {
      title: insertExp.title,
      description: insertExp.description,
      category: insertExp.category,
      curriculumStage: insertExp.curriculumStage,
      difficulty: insertExp.difficulty,
      duration: insertExp.duration,
      materialsNeeded: insertExp.materialsNeeded,
      householdItemsOnly: insertExp.householdItemsOnly,
      thumbnailUrl: insertExp.thumbnailUrl,
      steps: insertExp.steps,
      scienceExplained: insertExp.scienceExplained,
      learningOutcomes: insertExp.learningOutcomes,
      safetyNotes: insertExp.safetyNotes,
      relatedExperiments: insertExp.relatedExperiments?.map(id => parseInt(id)),
    };

    const result = await this.db.insert(experiments).values(dbInsert).returning();
    return this.dbToApi(result[0]);
  }

  // User operations for Replit Auth
  // Reference: blueprint:javascript_log_in_with_replit
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Progress tracking operations
  async getProgress(userId: string, experimentId: number): Promise<ExperimentProgress | undefined> {
    const [progress] = await this.db
      .select()
      .from(experimentProgress)
      .where(
        and(
          eq(experimentProgress.userId, userId),
          eq(experimentProgress.experimentId, experimentId)
        )
      );
    return progress;
  }

  async getAllProgressByUser(userId: string): Promise<ExperimentProgress[]> {
    const results = await this.db
      .select()
      .from(experimentProgress)
      .where(eq(experimentProgress.userId, userId));
    return results;
  }

  async upsertProgress(progressData: InsertProgress): Promise<ExperimentProgress> {
    // Defensive guard against invalid experimentId
    if (!Number.isFinite(progressData.experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const existing = await this.getProgress(progressData.userId, progressData.experimentId);
    
    if (existing) {
      // Update existing progress
      const [updated] = await this.db
        .update(experimentProgress)
        .set({
          completed: progressData.completed ?? existing.completed,
          notes: progressData.notes ?? existing.notes,
          completedAt: progressData.completedAt ?? existing.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(experimentProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new progress
      const [created] = await this.db
        .insert(experimentProgress)
        .values({
          userId: progressData.userId,
          experimentId: progressData.experimentId,
          completed: progressData.completed ?? false,
          notes: progressData.notes,
          completedAt: progressData.completedAt,
        })
        .returning();
      return created;
    }
  }

  async updateProgressNotes(userId: string, experimentId: number, notes: string): Promise<ExperimentProgress> {
    // Defensive guard against invalid experimentId
    if (!Number.isFinite(experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const existing = await this.getProgress(userId, experimentId);
    return this.upsertProgress({
      userId,
      experimentId,
      completed: existing?.completed ?? false,
      notes,
      completedAt: existing?.completedAt ?? null,
    });
  }

  async markExperimentComplete(userId: string, experimentId: number, completed: boolean): Promise<ExperimentProgress> {
    // Defensive guard against invalid experimentId
    if (!Number.isFinite(experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const existing = await this.getProgress(userId, experimentId);
    return this.upsertProgress({
      userId,
      experimentId,
      completed,
      notes: existing?.notes ?? null,
      completedAt: completed ? new Date() : null,
    });
  }

  // Quiz operations
  async getQuizById(quizId: number): Promise<Quiz | undefined> {
    if (!Number.isFinite(quizId)) {
      throw new Error("Invalid quizId: must be a finite number");
    }
    
    const results = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);
    
    return results[0];
  }

  async getQuizByExperimentId(experimentId: number): Promise<Quiz | undefined> {
    if (!Number.isFinite(experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const results = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.experimentId, experimentId))
      .limit(1);
    
    return results[0];
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    if (!Number.isFinite(quizId)) {
      throw new Error("Invalid quizId: must be a finite number");
    }
    
    return await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.orderIndex);
  }

  async submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    if (!Number.isFinite(attempt.quizId)) {
      throw new Error("Invalid quizId: must be a finite number");
    }
    
    const results = await this.db
      .insert(quizAttempts)
      .values(attempt)
      .returning();
    
    return results[0];
  }

  async getUserQuizAttempts(userId: string, quizId: number): Promise<QuizAttempt[]> {
    if (!Number.isFinite(quizId)) {
      throw new Error("Invalid quizId: must be a finite number");
    }
    
    return await this.db
      .select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.quizId, quizId)
      ))
      .orderBy(sql`${quizAttempts.completedAt} DESC`);
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    if (!Number.isFinite(quiz.experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const results = await this.db
      .insert(quizzes)
      .values(quiz)
      .returning();
    
    return results[0];
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    if (!Number.isFinite(question.quizId)) {
      throw new Error("Invalid quizId: must be a finite number");
    }
    
    const results = await this.db
      .insert(quizQuestions)
      .values(question)
      .returning();
    
    return results[0];
  }

  // Curriculum operations
  async getAllCurriculumUnits(): Promise<CurriculumUnit[]> {
    return await this.db
      .select()
      .from(curriculumUnits)
      .orderBy(curriculumUnits.stage, curriculumUnits.term);
  }

  async getCurriculumUnitsByStage(stage: string): Promise<CurriculumUnit[]> {
    return await this.db
      .select()
      .from(curriculumUnits)
      .where(eq(curriculumUnits.stage, stage))
      .orderBy(curriculumUnits.term);
  }

  async getCurriculumUnitById(unitId: string): Promise<CurriculumUnit | undefined> {
    const results = await this.db
      .select()
      .from(curriculumUnits)
      .where(eq(curriculumUnits.unitId, unitId))
      .limit(1);
    
    return results[0];
  }

  async getExperimentCurriculumUnits(experimentId: number): Promise<CurriculumUnit[]> {
    if (!Number.isFinite(experimentId)) {
      throw new Error("Invalid experimentId: must be a finite number");
    }
    
    const results = await this.db
      .select({
        id: curriculumUnits.id,
        unitId: curriculumUnits.unitId,
        stage: curriculumUnits.stage,
        component: curriculumUnits.component,
        term: curriculumUnits.term,
        name: curriculumUnits.name,
        description: curriculumUnits.description,
        outcomes: curriculumUnits.outcomes,
        weeks: curriculumUnits.weeks,
        createdAt: curriculumUnits.createdAt,
      })
      .from(curriculumUnits)
      .innerJoin(
        experimentCurriculumUnits,
        eq(curriculumUnits.id, experimentCurriculumUnits.curriculumUnitId)
      )
      .where(eq(experimentCurriculumUnits.experimentId, experimentId))
      .orderBy(curriculumUnits.stage, curriculumUnits.term);
    
    return results;
  }
}

// Use DB storage when DATABASE_URL is available
export const storage: IStorage = process.env.DATABASE_URL ? new DBStorage() : new MemStorage();
