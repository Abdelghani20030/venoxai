// Debug: print shaped/segmented name codepoints.
import { segmentName, shapeArabicRun } from "../../../artifacts/api-server/src/lib/fonts/arabic-shaper";
const hex = (s: string) => [...s].map(c => "U+" + c.codePointAt(0)!.toString(16).padStart(4, "0")).join(" ");
const cases = ["María O'Brien-الغامدي", "الغامدي", "فاطمة الزهراء", "أحمد", "محمد عبد الله"];
for (const c of cases) {
  console.log(`IN : ${c}`);
  console.log(`SHAPE(${c.includes("María") ? "'الغامدي'" : "whole"}): ${shapeArabicRun(c.includes("María") ? "الغامدي" : c)}`);
  console.log(`     cps: ${hex(shapeArabicRun(c.includes("María") ? "الغامدي" : c))}`);
  const segs = segmentName(c);
  console.log("SEGMENTS:", segs.map(s => `[${s.isArabic ? "AR" : "LT"}] ${JSON.stringify(s.text)} (${hex(s.text)})`).join("   |   "));
  console.log("");
}
