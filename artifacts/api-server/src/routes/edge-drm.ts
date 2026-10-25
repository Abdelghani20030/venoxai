// @ts-nocheck
/**
 * edge-drm.ts — Microsoft Edge TTS v2 DRM token generator.
 *
 * Faithful JS port of rany2/edge-tts >= 7.3.0 (drm.py), the version that made
 * the read-aloud service work again in Oct 2026. The service validates a
 * short-lived anti-abuse token:
 *
 *   Sec-MS-GEC-Version: 2-143.0.3650.75
 *   Sec-MS-GEC:         "<16 hex CS64>-<64 hex obfuscated-SHA256>"
 *
 * Both digests are computed over "<100ns file-time ticks rounded down to a
 * 5-minute window><TRUSTED_CLIENT_TOKEN>". The SHA-256 is deliberately
 * obfuscated (truncated sigma rotations, adjusted round constants / initial
 * state) and the 16-hex part is a CRC-like "CS64" keyed by the first 8 digest
 * bytes. Every arithmetic step is masked to u32 exactly like the reference so
 * the overflow semantics match bit-for-bit.
 */

export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WIN_EPOCH = 11644473600;
const U32 = 0xffffffffn;
const MASKER = (x) => BigInt.asUintN(32, x);
const B32 = (n) => (typeof n === "bigint" ? BigInt.asUintN(32, n) : BigInt(n >>> 0));

// ── Verified constant tables (drm.py:23-150) ────────────────────────────────
const SHA256_INITIAL = [
  0x6a09e667n, 0xbb67ae85n, 0x3c6ef372n, 0xa54ff53an,
  0x510e527fn, 0x9b05688cn, 0x1f83d9abn, 0x5be0cd19n,
];
const SHA256_STATE = [
  0xfd9fbea2n, 0x91243ce7n, 0xbe499094n, 0xcd2e1e0an,
  0x6c006f49n, 0x04bd35abn, 0xfeb0a7e4n, 0x03effbd2n,
];
const SHA256_SCHEDULE = [
  0xeb24bf9en, 0x1558691fn, 0xa0c09ee2n, 0x0cfa32ban,
  0xa622ee8cn, 0xd1dd9491n, 0xc0dd25a0n, 0xf9e70ab6n,
  0xf0c31573n, 0x7058ce4en, 0x7188e606n, 0x00e5ab33n,
  0xd258b060n, 0x72766564n,
];
const SHA256_ROUND_CONSTANTS = [
  0x428a2f98n, 0x71374491n, 0xb5c0fbcfn, 0xe9b5dba5n,
  0x3956c25bn, 0x59f111f1n, 0x923f82a4n, 0xab1c5ed5n,
  0xd807aa98n, 0x12835b01n, 0x243185ben, 0x550c7dc3n,
  0x72be5d74n, 0x80deb1fen, 0x9bdc06a7n, 0xc19bf174n,
  0xe49b69c1n, 0xefbe4786n, 0x0fc19dc6n, 0x240ca1ccn,
  0x2de92c6fn, 0x4a7484aan, 0x5cb0a9dcn, 0x76f988dan,
  0x983e5152n, 0xa831c66dn, 0xb00327c8n, 0xbf597fc7n,
  0xc6e00bf3n, 0xd5a79147n, 0x06ca6351n, 0x14292967n,
  0x27b70a85n, 0x2e1b2138n, 0x4d2c6dfcn, 0x53380d13n,
  0x650a7354n, 0x766a0abbn, 0x81c2c92en, 0x92722c85n,
  0xa2bfe8a1n, 0xa81a664bn, 0xc24b8b70n, 0xc76c51a3n,
  0xd192e819n, 0xd6990624n, 0xf40e3585n, 0x106aa070n,
  0x19a4c116n, 0x1e376c08n, 0x2748774cn, 0x34b0bcb5n,
  0x391c0cb3n, 0x4ed8aa4an, 0x5b9cca4fn, 0x682e6ff3n, 0x748f82een,
  0x78a5636fn, 0x84c87814n, 0x8cc70208n, 0x90befffan,
  0xa4506cebn, 0xbef9a3f7n, 0xc67178f2n,
];
const SHA256_ADJUSTMENT = 0xc9dc06a7n;
const SHA256_BLOCK_CONSTANTS = [
  ...SHA256_ROUND_CONSTANTS.slice(0, 14),
  SHA256_ADJUSTMENT,
  ...SHA256_ROUND_CONSTANTS.slice(15),
];
const SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80n;
const SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0n;

const CS64_COEFFICIENTS = [
  [0xe82e91b1n, 0xb32700d0n], [0x44de24c6n, 0x88dff51dn],
  [0x3beb65bcn, 0x29514038n], [0xc89c5933n, 0xb328cbdfn],
  [0x8d1ec211n, 0xd405b4d5n], [0x314ef5d5n, 0x26e55f3cn],
  [0xe92491b1n, 0x607801c6n], [0xf0a5b9d5n, 0x82b2c1fbn],
  [0x06064cf3n, 0xfa51a3dan], [0xda79fa60n, 0x207cc464n],
  [0xbed20560n, 0x3c3c74f3n], [0x89f9c9f8n, 0xd2d14b61n],
  [0x35fa38c6n, 0xbb04a2c1n], [0xcb49e3c6n, 0xc5626167n],
];
const CS64_FACTOR = 0x82893933n;
const CS64_ADJUSTMENT0 = 0xf2f90b1an;
const CS64_ADJUSTMENT1 = 0x0b1a0000n;

// ── helpers ─────────────────────────────────────────────────────────────────

/** Rotate a masked u32 left by 16 bits — drm.py:_rol16. */
function rol16(value) {
  return MASKER((value << 16n) | (value >> 16n));
}

/** LE-u32 words of data, zero-padded to even count — drm.py:_words_le4_even. */
function wordsLE4Even(data) {
  const padLen = ((-data.length) % 4 + 4) % 4;
  const padded = data.length || padLen ? Buffer.concat([data, Buffer.alloc(padLen)]) : data;
  if (padded.length === 0) return [];
  const words = [];
  for (let i = 0; i < padded.length; i += 4) words.push(B32(padded.readUInt32LE(i)));
  if (words.length % 2) words.push(0n);
  return words;
}

/** Truncated small-sigma-zero — drm.py:_sigma0. */
function sigma0(v) {
  return MASKER((v >> 7n) ^ (v << 25n) ^ (v >> 18n) ^ (v << 14n) ^ (v >> 3n));
}

/** Truncated small-sigma-one — drm.py:_sigma1. */
function sigma1(v) {
  return MASKER((v >> 17n) ^ (v << 15n) ^ (v >> 19n) ^ (v << 13n) ^ (v >> 10n));
}

/**
 * SHA-256 rounds, obfuscated — drm.py:_sha256_rounds.
 *
 * e * 2^32 + e repeats e across all 64 bits, so right shifts see ROTR-x's low
 * 32 bits (high bits are masked off afterwards — the reference never masks
 * these intermediate sums either; the masks are applied on the assignments).
 *
 * Rounds in [firstRound, aligned) use plain register roles (only ever the two
 * resumed rounds 14/15). Rounds at every multiple-of-8 boundary from `aligned`
 * use the reference's rotation-in-names scheme; for sub-round r of a block the
 * registers involved are rotated by r, which the index arithmetic below
 * reproduces exactly.
 */
function sha256Rounds(stateIn, words, firstRound = 0) {
  const W = (i) => B32(Number(words[i]));
  const K = (i) => BigInt(constants[i]);
  let constants = SHA256_ROUND_CONSTANTS;
  if (firstRound === 14) constants = SHA256_BLOCK_CONSTANTS;
  const aligned = Math.min(64, Math.floor((firstRound + 7) / 8) * 8);

  // Plain-role rounds (drm.py:199-210)
  let [a, b, c, d, e, f, g, h] = stateIn;
  for (let i = firstRound; i < aligned; i++) {
    const re = B32(e) * 0x100000001n;
    const ra = B32(a) * 0x100000001n;
    const t1 = MASKER(
      B32(h)
      + (MASKER((re >> 6n)) ^ MASKER(re >> 11n) ^ MASKER(re >> 25n))
      + (B32(g) ^ (B32(e) & (B32(f) ^ B32(g))))
      + K(i)
      + W(i),
    );
    const t2 = MASKER(
      (MASKER(ra >> 2n) ^ MASKER(ra >> 13n) ^ MASKER(ra >> 22n))
      + (MASKER(B32(a) & B32(b)) | MASKER(B32(c) & (B32(a) | B32(b)))),
    );
    const newA = MASKER(t1 + t2);
    const newE = MASKER(B32(d) + t1);
    [a, b, c, d, e, f, g, h] = [newA, a, b, c, newE, e, f, g];
  }

  // Rotated-role blocks (drm.py:214-334). reg[] index map per sub-round r:
  //   sigma input  = (4 - r) mod 8   ... [4:e, 3:d, 2:c, 1:b, 0:a, 7:h, 6:g, 5:f]
  //   sigma-a rot  = (-r) mod 8      ... [0:a, 7:h, 6:g, 5:f, 4:e, 3:d, 2:c, 1:b]
  //   t1 h-term & final assignment = (7 - r) mod 8
  //   += t1 assignment             = (3 - r) mod 8
  const reg = [a, b, c, d, e, f, g, h];
  for (let i0 = aligned; i0 < 64; i0 += 8) {
    for (let r = 0; r < 8; r++) {
      const sigIdx = (4 - r + 8) % 8;
      const chE = sigIdx, chF = (sigIdx + 1) % 8, chG = (sigIdx + 2) % 8;
      const raIdx = (8 - r) % 8;
      const majA = raIdx, majB = (raIdx + 1) % 8, majC = (raIdx + 2) % 8;
      const sumIdx = (7 - r + 8) % 8;
      const addIdx = (3 - r + 8) % 8;
      const wi = i0 + r;

      const re = B32(reg[sigIdx]) * 0x100000001n;
      const ra = B32(reg[raIdx]) * 0x100000001n;
      const t1 = MASKER(
        B32(reg[sumIdx])
        + (MASKER(re >> 6n) ^ MASKER(re >> 11n) ^ MASKER(re >> 25n))
        + (B32(reg[chG]) ^ (B32(reg[chE]) & (B32(reg[chF]) ^ B32(reg[chG]))))
        + K(wi)
        + W(wi),
      );
      reg[addIdx] = MASKER(B32(reg[addIdx]) + t1);
      reg[sumIdx] = MASKER(
        t1
        + (MASKER(ra >> 2n) ^ MASKER(ra >> 13n) ^ MASKER(ra >> 22n))
        + MASKER(
          B32(reg[majA]) & B32(reg[majB])
          | B32(reg[majC]) & (B32(reg[majA]) | B32(reg[majB])),
        ),
      );
    }
  }
  return reg;
}

/** Expand obfuscated schedule words — drm.py:_expand_sha256_schedule. */
function expandSchedule(words, firstWord = 16) {
  for (let index = firstWord; index < 64; index++) {
    const x = words[index - 2];
    const y = words[index - 15];
    const s1 = MASKER((x >> 17n) ^ (x << 15n) ^ (x >> 19n) ^ (x << 13n) ^ (x >> 10n));
    const s0 = MASKER((y >> 7n) ^ (y << 25n) ^ (y >> 18n) ^ (y << 14n) ^ (y >> 3n));
    words.push(MASKER(s1 + words[index - 7] + s0 + words[index - 16]));
  }
}

/** Initial obfuscated SHA-256 state from the first 7 token bytes — drm.py:_sha256_init. */
function sha256Init(data) {
  const d = Buffer.from(data.subarray(0, 7));
  const w14 = BigInt(d.readUInt32BE(0) >>> 8);   // int.from_bytes(data[:3], "big")
  const w15 = BigInt(d.readUInt32BE(3));         // int.from_bytes(data[3:7], "big")
  const words = [
    0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
    w14, w15,
  ];
  for (let index = 16; index <= 29; index++) {
    let value = SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) {
      // value ADDS the (adjusted) sigma — the reference is `value +=` (drm.py:358-362)
      value = MASKER(
        value
        + (index === 16
          ? (sigma1(words[index - 2]) ^ SHA256_SIGMA1_ADJUSTMENT)
          : sigma1(words[index - 2])),
      );
    }
    if (index - 7 >= 14) value = MASKER(value + words[index - 7]);
    if (index - 15 >= 14) {
      value = MASKER(
        value
        + (index === 29
          ? (sigma0(words[index - 15]) ^ SHA256_SIGMA0_ADJUSTMENT)
          : sigma0(words[index - 15])),
      );
    }
    words.push(value);
  }
  words.push(
    MASKER(
      sigma1(words[28])
      + words[23]
      + sigma0(words[15])
      + words[14]
      + SHA256_ADJUSTMENT
      - SHA256_ROUND_CONSTANTS[14],
    ),
  );
  expandSchedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  return SHA256_INITIAL.map((x, i) => MASKER(x + working[i]));
}

/** The obfuscated SHA-256 digest over the token string — drm.py:_sha256_digest. */
function sha256Digest(data) {
  if (data.length < 7) throw new Error("Token salt must contain at least seven bytes");
  const length = 57 + data.length;                            // fake byte length the service expects
  const zeros = (((55 - length) % 64) + 64) % 64;             // Python's always-positive modulo
  const suffix = Buffer.concat([
    Buffer.from(data.subarray(7)),
    Buffer.from([0x80]),
    Buffer.alloc(zeros),
    (() => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(length) * 8n); return b; })(),
  ]);

  let state = sha256Init(data.subarray(0, 7));
  for (let offset = 0; offset < suffix.length; offset += 64) {
    const block = suffix.subarray(offset, offset + 64);
    const words = [];
    for (let i = 0; i < 64; i += 4) words.push(BigInt(block.readUInt32BE(i)));
    expandSchedule(words);
    const working = sha256Rounds(state, words, 0);
    state = state.map((x, i) => MASKER(x + working[i]));
  }
  const out = Buffer.alloc(32);
  state.forEach((w, i) => out.writeUInt32BE(Number(BigInt.asUintN(32, w)), i * 4));
  return out;
}

/** CS64 (CRC-like) digest — literal port of drm.py:_cs64_digest. */
function cs64Digest(data, digest) {
  let keyA = Number(BigInt.asUintN(32, BigInt(digest.readUInt32LE(0))));
  let keyB = Number(BigInt.asUintN(32, BigInt(digest.readUInt32LE(4))));
  keyA = (keyA | 1) >>> 0;
  keyB = (keyB | 1) >>> 0;
  const kA = BigInt(keyA), kB = BigInt(keyB);

  const factors = [MASKER(kA * CS64_FACTOR), MASKER(kB * CS64_FACTOR)];
  const terms = CS64_COEFFICIENTS.map(
    (coefs, i) => MASKER(coefs[0] * factors[i % 2]),
  );
  const offsets = CS64_COEFFICIENTS.map((coefs) => coefs[1]);

  const words = wordsLE4Even(Buffer.concat([Buffer.from([0]), Buffer.from(data)]));
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    let term = word * (index % 2 === 0 ? kA : kB);
    let offset = rol16(word) * (index % 2 === 0 ? 0xef0569fbn : 0xc31713dbn);
    if (index === 0) {
      term = MASKER(term);
      term = MASKER(term + MASKER(CS64_ADJUSTMENT0 * factors[0]));
      offset = MASKER(offset + CS64_ADJUSTMENT1);
    }
    terms.push(MASKER(term));
    offsets.push(MASKER(offset));
  }

  let swapAcc = 0n, swapLast = 0n, state = 0n, acc = 0n;
  for (let index = 0; index < terms.length; index += 2) {
    const x = terms[index], y = terms[index + 1];

    const t1 = rol16(MASKER(offsets[index] + x));
    const q1 = MASKER(t1 * 0x76f50f34n);
    swapAcc = MASKER(swapAcc + MASKER(rol16(q1) * 0xc3efea97n + q1));

    const t2 = rol16(MASKER(offsets[index + 1] + y));
    const q2 = MASKER(t2 * 0x1881ce3cn);
    swapLast = MASKER(rol16(q2) * 0x35bd1ec9n + q2);
    swapAcc = MASKER(swapAcc + swapLast);

    state = MASKER(state * kA + x);
    state = MASKER(rol16(state) * 0xcf98b111n);
    state = MASKER(rol16(state) * 0x87085b9fn);
    state = MASKER(rol16(state) * 0x12ceb96dn);
    state = MASKER(rol16(state) * 0x257e1d83n);
    acc = MASKER(acc + state);

    let t3 = MASKER(state * kB + y);
    t3 = MASKER(rol16(t3) * 0xa27416f5n);
    t3 = MASKER(rol16(t3) * 0xd38396ffn);
    state = MASKER(
      rol16(MASKER(rol16(t3) * 0x7c932b89n)) * 0xbfa49f69n,
    );
    acc = MASKER(acc + state);
  }
  return [MASKER(swapLast ^ state), MASKER(swapAcc ^ acc)];
}

function tokenHash(data) {
  const digest = sha256Digest(data);
  const [a, b] = cs64Digest(data, digest);
  const cs64 = Buffer.concat([
    (() => { const x = Buffer.alloc(4); x.writeUInt32LE(Number(BigInt.asUintN(32, a))); return x; })(),
    (() => { const x = Buffer.alloc(4); x.writeUInt32LE(Number(BigInt.asUintN(32, b))); return x; })(),
  ]).toString("hex").toUpperCase();
  return [cs64, digest.toString("hex").toUpperCase()];
}

// ── Clock skew state (drm.py:class DRM) ─────────────────────────────────────

let clockSkewSeconds = 0;

/** Add a measured skew correction in seconds (called on 403 with server Date). */
export function adjClockSkewSeconds(deltaSeconds) {
  clockSkewSeconds += deltaSeconds;
}

export function getUnixTimestamp() {
  return Date.now() / 1000 + clockSkewSeconds;
}

/** Parse an RFC 2616 Date header; returns seconds or null. */
export function parseRFC1123Date(header) {
  if (!header) return null;
  const t = Date.parse(header);
  return Number.isFinite(t) ? t / 1000 : null;
}

/**
 * Generate the v2 Sec-MS-GEC token — drm.py:generate_sec_ms_gec_v2.
 * ticks: float seconds (+skew) → +WIN_EPOCH → floor to 5-min window → ×1e7.
 * The float arithmetic mirrors the reference exactly (JS numbers are IEEE
 * doubles like Python floats; at this magnitude the product is exact).
 */
export function generateSecMsGecV2(unixSeconds) {
  const now = unixSeconds ?? getUnixTimestamp();
  let ticks = now + WIN_EPOCH;
  ticks -= ticks % 300;
  const tickInt = BigInt(Math.round(ticks * 10000000));
  const str = Buffer.from(tickInt.toString() + TRUSTED_CLIENT_TOKEN, "ascii");
  const [cs64, sha] = tokenHash(str);
  return `${cs64}-${sha}`;
}

export const EDGE_WSS_URL =
  `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
export const EDGE_SEC_GEC_VERSION = "2-143.0.3650.75";
export const EDGE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0";
