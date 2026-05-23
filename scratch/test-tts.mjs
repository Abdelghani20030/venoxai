import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

async function test() {
  console.log("Initializing MsEdgeTTS...");
  try {
    const tts = new MsEdgeTTS();
    const voice = "en-US-AvaMultilingualNeural";
    console.log("Setting metadata for voice:", voice);
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    console.log("Requesting stream...");
    const { audioStream } = tts.toStream("Hello, this is a test of the Microsoft Edge Text to Speech engine.");
    
    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on("data", (chunk) => {
        console.log(`Received chunk: ${chunk.length} bytes`);
        chunks.push(chunk);
      });
      audioStream.on("end", () => {
        console.log("Stream ended.");
        resolve();
      });
      audioStream.on("close", () => {
        console.log("Stream closed.");
        resolve();
      });
      audioStream.on("error", (err) => {
        console.error("Stream error:", err);
        reject(err);
      });
      setTimeout(() => reject(new Error("Timeout")), 10000);
    });
    
    console.log(`Success! Total chunks: ${chunks.length}, Total bytes: ${Buffer.concat(chunks).length}`);
  } catch (err) {
    console.error("Failed during execution:", err);
  }
}

test();
