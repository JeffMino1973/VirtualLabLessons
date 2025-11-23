// Import all experiment images
import biologyPlant from "@assets/generated_images/Biology_plant_growth_experiment_5df15ee3.png";
import volcano from "@assets/generated_images/Volcano_eruption_baking_soda_5214d055.png";
import chemistryColors from "@assets/generated_images/Chemistry_mixing_colors_experiment_b9bd8a55.png";
import rainbow from "@assets/generated_images/Rainbow_light_refraction_prism_75fddc8c.png";
import physicsForces from "@assets/generated_images/Physics_forces_motion_experiment_4bf72128.png";
import earthScience from "@assets/generated_images/Earth_science_geology_experiment_0dedf2de.png";
import heroImage from "@assets/generated_images/Hero_image_students_home_experiments_d3f42215.png";

// Map of image identifiers to imported paths
export const experimentImages: Record<string, string> = {
  "Biology_plant_growth_experiment_5df15ee3.png": biologyPlant,
  "Volcano_eruption_baking_soda_5214d055.png": volcano,
  "Chemistry_mixing_colors_experiment_b9bd8a55.png": chemistryColors,
  "Rainbow_light_refraction_prism_75fddc8c.png": rainbow,
  "Physics_forces_motion_experiment_4bf72128.png": physicsForces,
  "Earth_science_geology_experiment_0dedf2de.png": earthScience,
  "Hero_image_students_home_experiments_d3f42215.png": heroImage,
};

// Helper function to get image path from database URL
export function getExperimentImage(thumbnailUrl: string | undefined): string {
  if (!thumbnailUrl) {
    // Return a placeholder if no image URL
    return "";
  }

  // Extract filename from path like "/assets/generated_images/filename.png"
  const filename = thumbnailUrl.split("/").pop();
  
  if (filename && experimentImages[filename]) {
    return experimentImages[filename];
  }

  // Return original URL as fallback
  return thumbnailUrl;
}
