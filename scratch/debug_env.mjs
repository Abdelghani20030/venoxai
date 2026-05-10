import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
console.log("Here:", here);
const candidates = [
  resolve(here, ".env"),
  resolve(here, "..", ".env"),
  resolve(here, "..", "..", ".env"),
  resolve(here, "..", "..", "..", ".env"),
];

candidates.forEach(c => {
  console.log(`Checking ${c}: ${existsSync(c)}`);
});
