import { MsEdgeTTS } from "msedge-tts";

async function test() {
  try {
    const tts = new MsEdgeTTS();
    const voices = await tts.getVoices();
    console.log("Total voices found:", voices.length);
    // Find voices that contain "Brian" or "Ava" or "Ryan" or "Sonia"
    const matching = voices.filter(v => 
      v.Name.includes("Brian") || 
      v.Name.includes("Ava") || 
      v.Name.includes("Ryan") || 
      v.Name.includes("Sonia") ||
      v.ShortName.includes("Brian") || 
      v.ShortName.includes("Ava") || 
      v.ShortName.includes("Ryan") || 
      v.ShortName.includes("Sonia")
    );
    console.log("Matching voices details:");
    matching.forEach(v => {
      console.log(`- FriendlyName: "${v.FriendlyName}", ShortName: "${v.ShortName}", Gender: "${v.Gender}"`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
