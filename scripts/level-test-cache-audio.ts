/**
 * Venoxa Level Test — pre-cache listening audio (run manually).
 *
 * Generates the MP3 for every listening item's `audio_script` with Microsoft
 * Edge TTS and stores the bytes in `lt_audio`. The API streams those bytes via
 * short-lived signed URLs, so learners never hit Edge TTS directly and audio
 * stays identical between local dev and production.
 *
 * Run AFTER migrations/level-test.sql and the item seed:
 *   node --env-file=.env scripts/level-test-cache-audio.ts
 *   node --env-file=.env scripts/level-test-cache-audio.ts --force
 *   node --env-file=.env scripts/level-test-cache-audio.ts --dry-run
 *
 * Env:
 *   DATABASE_URL                     required
 *   LEVEL_TEST_AUDIO_VOICE           default en-US-AriaNeural
 *   LEVEL_TEST_AUDIO_CONCURRENCY     default 2
 */
import { edgeSynthesizeMp3 } from '../artifacts/api-server/src/routes/edge-ws.ts';
import { createPgPool } from '../lib/pg-pool.ts';

const DB_URL = (process.env.DATABASE_URL ?? '').trim();
const VOICE = (process.env.LEVEL_TEST_AUDIO_VOICE ?? 'en-US-AriaNeural').trim();
const CONCURRENCY = Math.max(1, Number(process.env.LEVEL_TEST_AUDIO_CONCURRENCY ?? 2));
const WORDS_PER_SECOND = 2.5;

const args = new Set(process.argv.slice(2).map((arg) => arg.replace(/^--/, '')));
const FORCE = args.has('force');
const DRY_RUN = args.has('dry-run');

interface ListeningItem {
  id: string;
  audio_script: string;
  has_audio: boolean;
}

function estimateDurationMs(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1000, Math.round((words / WORDS_PER_SECOND) * 1000));
}

async function main(): Promise<void> {
  if (!DB_URL) {
    console.error('Missing DATABASE_URL. Add it to .env and retry.');
    process.exit(1);
  }
  if (!DRY_RUN && !VOICE) {
    console.error('Missing LEVEL_TEST_AUDIO_VOICE.');
    process.exit(1);
  }

  // Shared pool factory: handles TLS for remote hosts (Supabase pooler
  // requires SSL; a bare Pool() would connect unencrypted and be refused).
  const pool = createPgPool(DB_URL);
  const client = await pool.connect();
  try {
    const result = await client.query<ListeningItem>(
      `select i.id, i.audio_script,
              exists(select 1 from lt_audio a where a.item_id = i.id) as has_audio
         from lt_items i
        where i.type = 'listening' and i.audio_script is not null
        order by i.id`,
    );
    const all = result.rows;
    const pending = all.filter((item) => FORCE || !item.has_audio);

    console.log(
      `[audio] voice=${VOICE} concurrency=${CONCURRENCY} listening=${all.length} ` +
        `pending=${pending.length}${FORCE ? ' (force)' : ''}${DRY_RUN ? ' (dry-run)' : ''}`,
    );

    if (DRY_RUN) {
      for (const item of pending) {
        const words = item.audio_script.trim().split(/\s+/).filter(Boolean).length;
        console.log(`[audio] would synthesize ${item.id} (${words} words)`);
      }
      return;
    }

    let next = 0;
    let done = 0;
    let failed = 0;

    const worker = async () => {
      for (;;) {
        const index = next++;
        if (index >= pending.length) return;
        const item = pending[index];
        try {
          const bytes = await edgeSynthesizeMp3(VOICE, item.audio_script, 30_000);
          if (!bytes || bytes.length < 512) {
            throw new Error(`Edge TTS returned ${bytes?.length ?? 0} bytes`);
          }
          const durationMs = estimateDurationMs(item.audio_script);
          await client.query(
            `insert into lt_audio (item_id, content_type, bytes, duration_ms)
             values ($1, 'audio/mpeg', $2, $3)
             on conflict (item_id) do update
               set content_type = excluded.content_type,
                   bytes = excluded.bytes,
                   duration_ms = excluded.duration_ms,
                   created_at = now()`,
            [item.id, bytes, durationMs],
          );
          done++;
          console.log(`[audio] ${done + failed}/${pending.length} ${item.id} ${bytes.length} bytes ~${durationMs}ms`);
        } catch (error) {
          failed++;
          console.error(`[audio] ${item.id} failed: ${(error as Error).message}`);
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));

    console.log(`[audio] cached=${done} failed=${failed} skipped=${all.length - pending.length}`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[audio] fatal:', error);
  process.exit(1);
});
