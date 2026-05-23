import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const pool = new Map();

function prewarm(voice) {
  console.log(`Prewarming voice: ${voice}`);
  const p = (async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    return tts;
  })();
  pool.set(voice, p);
  p.catch(() => pool.delete(voice));
  return p;
}

async function acquireConnection(voice) {
  const existing = pool.get(voice) ?? prewarm(voice);
  prewarm(voice);
  return existing;
}

async function run() {
  console.log("Starting connection pool test...");
  
  // Prewarm a voice
  prewarm("en-GB-RyanNeural");
  
  // Wait 1s
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Acquiring connection (first time)...");
  const tts1 = await acquireConnection("en-GB-RyanNeural");
  console.log("Acquired successfully! Connection is:", tts1.constructor.name);
  
  console.log("Requesting stream...");
  const { audioStream } = tts1.toStream("Hello from pool.");
  const chunks = [];
  await new Promise((resolve, reject) => {
    audioStream.on("data", c => chunks.push(c));
    audioStream.on("end", resolve);
    audioStream.on("error", reject);
  });
  console.log(`Stream successful! Bytes: ${Buffer.concat(chunks).length}`);
  
  console.log("Acquiring connection (second time, should use prewarmed replacement)...");
  const tts2 = await acquireConnection("en-GB-RyanNeural");
  const { audioStream: stream2 } = tts2.toStream("Hello again.");
  const chunks2 = [];
  await new Promise((resolve, reject) => {
    stream2.on("data", c => chunks2.push(c));
    stream2.on("end", resolve);
    stream2.on("error", reject);
  });
  console.log(`Stream 2 successful! Bytes: ${Buffer.concat(chunks2).length}`);
}

run();
