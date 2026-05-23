import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const voices = [
  "en-GB-RyanNeural",
  "en-GB-SoniaNeural",
  "en-US-BrianMultilingualNeural",
  "en-US-AvaMultilingualNeural"
];

async function testAll() {
  for (const voice of voices) {
    console.log(`\nTesting voice: ${voice}`);
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream("Hello, this is a test of voice compatibility.");
      
      const chunks = [];
      await new Promise((resolve, reject) => {
        audioStream.on("data", (chunk) => {
          chunks.push(chunk);
        });
        audioStream.on("end", resolve);
        audioStream.on("close", resolve);
        audioStream.on("error", reject);
        setTimeout(() => reject(new Error("Timeout")), 10000);
      });
      console.log(`SUCCESS: Got ${chunks.length} chunks, total bytes ${Buffer.concat(chunks).length}`);
    } catch (err) {
      console.error(`FAILED for voice ${voice}:`, err.message || err);
    }
  }
}

testAll();
