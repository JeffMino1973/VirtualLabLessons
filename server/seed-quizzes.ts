import { storage } from "./storage";

async function seedQuizzes() {
  try {
    console.log("Seeding quizzes...");

    // Quiz for Experiment 1: Growing Beans
    const quiz1 = await storage.createQuiz({
      experimentId: 1,
      title: "Bean Growing Quiz",
      description: "Test your knowledge about plant growth and germination",
      passingScore: 70,
    });

    await storage.createQuizQuestion({
      quizId: quiz1.id,
      questionText: "What process happens when a seed starts to grow?",
      options: ["Photosynthesis", "Germination", "Pollination", "Respiration"],
      correctAnswerIndex: 1,
      explanation: "Germination is the process by which a seed begins to grow into a new plant.",
      orderIndex: 0,
    });

    await storage.createQuizQuestion({
      quizId: quiz1.id,
      questionText: "What do seeds need to germinate?",
      options: ["Only water", "Only sunlight", "Water and warmth", "Only soil"],
      correctAnswerIndex: 2,
      explanation: "Seeds need water and warmth to germinate. Sunlight becomes important after the plant has sprouted.",
      orderIndex: 1,
    });

    await storage.createQuizQuestion({
      quizId: quiz1.id,
      questionText: "Which part of the plant grows first from a germinating seed?",
      options: ["Leaves", "Stem", "Root", "Flower"],
      correctAnswerIndex: 2,
      explanation: "The root grows first to anchor the plant and absorb water and nutrients from the soil.",
      orderIndex: 2,
    });

    await storage.createQuizQuestion({
      quizId: quiz1.id,
      questionText: "Why did we use a clear container in this experiment?",
      options: [
        "To make it look nice",
        "To observe the roots growing",
        "Because plastic is cheap",
        "To keep the seeds warm"
      ],
      correctAnswerIndex: 1,
      explanation: "Using a clear container allows us to observe the entire germination process, including root development.",
      orderIndex: 3,
    });

    // Quiz for Experiment 2: Bread Mold
    const quiz2 = await storage.createQuiz({
      experimentId: 2,
      title: "Bread Mold Experiment Quiz",
      description: "Test your understanding of mold growth and microorganisms",
      passingScore: 70,
    });

    await storage.createQuizQuestion({
      quizId: quiz2.id,
      questionText: "What type of organism is mold?",
      options: ["Bacteria", "Virus", "Fungus", "Plant"],
      correctAnswerIndex: 2,
      explanation: "Mold is a type of fungus that grows in multicellular filaments called hyphae.",
      orderIndex: 0,
    });

    await storage.createQuizQuestion({
      quizId: quiz2.id,
      questionText: "What conditions help mold grow faster?",
      options: ["Dry and cold", "Dry and warm", "Moist and warm", "Moist and cold"],
      correctAnswerIndex: 2,
      explanation: "Mold grows best in warm, moist conditions where it can break down organic matter.",
      orderIndex: 1,
    });

    await storage.createQuizQuestion({
      quizId: quiz2.id,
      questionText: "Why should you never eat moldy food?",
      options: [
        "It tastes bad",
        "Mold can produce harmful toxins",
        "It looks unappetizing",
        "It has no nutrients"
      ],
      correctAnswerIndex: 1,
      explanation: "Some molds produce mycotoxins that can be harmful to human health when consumed.",
      orderIndex: 2,
    });

    console.log("✓ Seeded quizzes successfully!");
  } catch (error) {
    console.error("Error seeding quizzes:", error);
    throw error;
  }
}

seedQuizzes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
