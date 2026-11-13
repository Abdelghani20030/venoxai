// scripts/extract-vocab-git.mjs — re-extract the 5 vocab CSVs from git 0981f50
// via child_process (avoids PowerShell's UTF-16 redirection encoding).
import { execFileSync } from "child_process";
import { writeFileSync } from "fs";

const files = ["global", "langeek", "idioms", "phrasal", "slang"];
for (const name of files) {
  const out = execFileSync("git", ["show", `0981f50:artifacts/venoxa/public/data/${name}.csv`], {
    maxBuffer: 64 * 1024 * 1024,
    encoding: "utf8",
  });
  writeFileSync(`attached_assets/${name}_full.csv`, out.replace(/\r\n/g, "\n"), "utf8");
  console.log(name, "ok,", out.length, "chars");
}
