import fs from "node:fs/promises";
import { exportDeck } from "./engine.mjs";
import { review } from "./quality.mjs";
import {
  trainingPackage,
  materials,
  validateTraining,
  trainerScript,
} from "./training.mjs";
const [input, output = "presentation.pptx"] = process.argv.slice(2);
if (!input) {
  console.error("Użycie: npm run export -- deck.json wynik.pptx");
  process.exit(1);
}
const deck = JSON.parse(await fs.readFile(input, "utf8"));
validateTraining(deck);
await fs.writeFile(output, await exportDeck(deck));
await fs.writeFile(
  output + ".review.json",
  JSON.stringify(review(deck), null, 2),
);
await fs.writeFile(output + ".trainer.md", trainerScript(deck));
await fs.writeFile(output + ".training.zip", await trainingPackage(deck));
for (const [name, content] of Object.entries(materials(deck)))
  await fs.writeFile(output + "." + name, content);
console.log(output);
