import fs from "node:fs/promises";
import { importImage } from "./images.mjs";
const [file, id] = process.argv.slice(2);
if (!file || !id)
  throw Error("Użycie: node image-import.mjs obraz.png ID_Z_PLANU");
console.log(JSON.stringify(await importImage(await fs.readFile(file), id)));
