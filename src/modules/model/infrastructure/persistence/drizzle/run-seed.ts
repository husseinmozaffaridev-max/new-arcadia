import { db } from "./client";
import { seedIFEProject } from "./seed";

async function main() {
  const projectId = process.argv[2] || process.env.PROJECT_ID || "1";

  console.log(`\n======================================================`);
  console.log(` Seeding In-Flight Entertainment System (IFE)`);
  console.log(` Target Project ID: ${projectId}`);
  console.log(`======================================================\n`);

  try {
    const result = await seedIFEProject({ projectId }, db);

    console.log(`✓ Models seeded:`);
    console.log(`  - OA: ${result.models.oa}`);
    console.log(`  - SA: ${result.models.sa}`);
    console.log(`  - LA: ${result.models.la}`);
    console.log(`  - PA: ${result.models.pa}`);
    console.log(`\n✓ Seed completed successfully!`);
    console.log(`  - 18 Diagrams matching Capella reference model`);
    console.log(`  - 61 Elements across 4 layers`);
    console.log(`  - 52 Relationships & Allocations`);
    console.log(`  - Traceability realization links\n`);
    process.exit(0);
  } catch (error) {
    console.error("✗ Seeding failed with error:", error);
    process.exit(1);
  }
}

main();
