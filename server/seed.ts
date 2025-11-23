import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { experiments, curriculumUnits, experimentCurriculumUnits } from "@shared/schema";
import type { InsertExperimentDB, InsertCurriculumUnit } from "@shared/schema";
import { eq } from "drizzle-orm";
import ws from "ws";
import { allCurriculumUnits } from "./curriculum-data";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

const experimentsData: Omit<InsertExperimentDB, "id">[] = [
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

async function seed() {
  console.log("Starting database seed...");
  
  try {
    // Seed curriculum units first
    console.log("Seeding curriculum units...");
    const curriculumData: InsertCurriculumUnit[] = allCurriculumUnits.map(unit => ({
      unitId: unit.id,
      stage: unit.stage,
      component: unit.component,
      term: unit.term,
      name: unit.name,
      description: unit.description,
      outcomes: unit.outcomes,
      weeks: unit.weeks,
    }));
    
    const insertedCurriculum = await db.insert(curriculumUnits).values(curriculumData).returning();
    console.log(`✓ Seeded ${insertedCurriculum.length} curriculum units`);
    
    // Insert all experiments
    const insertedExperiments = await db.insert(experiments).values(experimentsData).returning();
    console.log(`✓ Seeded ${insertedExperiments.length} experiments`);

    // Set up related experiments (same category or same stage)
    for (const exp of insertedExperiments) {
      const sameCategory = insertedExperiments
        .filter((e) => e.category === exp.category && e.id !== exp.id)
        .slice(0, 2)
        .map((e) => e.id);

      const sameStage = insertedExperiments
        .filter((e) => e.curriculumStage === exp.curriculumStage && e.id !== exp.id && !sameCategory.includes(e.id))
        .slice(0, 1)
        .map((e) => e.id);

      const relatedIds = [...sameCategory, ...sameStage].filter((id) => id !== undefined);

      if (relatedIds.length > 0) {
        await db
          .update(experiments)
          .set({ relatedExperiments: relatedIds })
          .where(eq(experiments.id, exp.id));
      }
    }
    
    console.log("✓ Updated related experiments");
    
    // Map experiments to curriculum units
    console.log("Mapping experiments to curriculum units...");
    
    // Helper function to find curriculum unit by unitId
    const findCurriculumUnit = (unitId: string) => {
      return insertedCurriculum.find(u => u.unitId === unitId);
    };
    
    // Helper function to find experiment by title
    const findExperiment = (title: string) => {
      return insertedExperiments.find(e => e.title === title);
    };
    
    // Define experiment to curriculum unit mappings
    const mappings = [
      // Growing Beans -> Plant growth and life cycles
      { experiment: "Growing Beans: Watch Seeds Sprout", units: ["es1-t1", "s1-t1"] },
      
      // Bread Mold -> Living things and food
      { experiment: "Bread Mold Experiment", units: ["comp-a-t2", "comp-c-t2"] },
      
      // Volcano Eruption -> Matter and materials
      { experiment: "Volcano Eruption: Acid-Base Reaction", units: ["es1-t4", "s1-t4"] },
      
      // Rainbow in a Jar -> Properties of matter
      { experiment: "Rainbow in a Jar: Density Layers", units: ["comp-a-t4"] },
      
      // Make a Rainbow -> Light and sound
      { experiment: "Make a Rainbow with Sunlight", units: ["s1-t5", "s1-t6"] },
      
      // Build a Simple Pendulum -> Forces and motion
      { experiment: "Build a Simple Pendulum", units: ["comp-e-t3"] },
      
      // Rock and Mineral Observation -> Earth materials
      { experiment: "Rock and Mineral Observation", units: ["es1-t2", "s1-t3"] },
      
      // Water Cycle in a Bag -> Earth systems
      { experiment: "Water Cycle in a Bag", units: ["comp-b-t2", "s1-t3"] },
    ];
    
    // Insert experiment-curriculum mappings
    let mappingCount = 0;
    for (const mapping of mappings) {
      const experiment = findExperiment(mapping.experiment);
      if (!experiment) {
        console.warn(`⚠ Experiment not found: ${mapping.experiment}`);
        continue;
      }
      
      for (const unitId of mapping.units) {
        const unit = findCurriculumUnit(unitId);
        if (!unit) {
          console.warn(`⚠ Curriculum unit not found: ${unitId}`);
          continue;
        }
        
        await db.insert(experimentCurriculumUnits).values({
          experimentId: experiment.id,
          curriculumUnitId: unit.id,
        });
        mappingCount++;
      }
    }
    
    console.log(`✓ Created ${mappingCount} experiment-curriculum mappings`);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
