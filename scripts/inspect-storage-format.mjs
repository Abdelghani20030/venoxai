// scripts/inspect-storage-format.mjs — how does installed supabase-js (2.119.0) persist sessions?
import { readFileSync } from "fs";

const src = readFileSync("artifacts/venoxa/node_modules/@supabase/supabase-js/dist/umd/supabase.js", "utf8");
console.log("umd size:", src.length);

const show = (needle, max = 6) => {
  let i = -1, n = 0;
  while ((i = src.indexOf(needle, i + 1)) !== -1 && n < max) {
    console.log(`\n-- ${needle} @${i} --`);
    console.log(src.slice(Math.max(0, i - 140), i + 240).replace(/\s+/g, " "));
    n++;
  }
  if (n === 0) console.log(`(no match: ${needle})`);
};

show("setItem");
show("JSON.stringify(session)");
show("JSON.stringify(");
