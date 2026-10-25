// @ts-nocheck
/**
 * edge-ws.ts — Native Microsoft Edge "readaloud" WebSocket TTS client.
 *
 * Implements the 2026 protocol revived in rany2/edge-tts 7.3.0
 * (constants.py + drm.py + communicate.py, ported 1:1):
 *   • wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1
 *     ?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4
 *     &ConnectionId=<hex32>&Sec-MS-GEC=<v2>&Sec-MS-GEC-Version=2-143.0.3650.75
 *   • Edge-143 UA + Read-Aloud extension Origin + per-connection "muid" cookie
 *   • speech.config (no Z) → SSML (X-Timestamp with trailing "Z" — a Microsoft
 *     Edge bug that must be preserved), MP3 arrives in binary frames:
 *     [u16 BE header length][headers][payload] with "Path:audio"
 *   • turn ends on the text frame "Path:turn.end"
 *   • 403 → read the handshake response's Date header, shift the clock-skew
 *     and regenerate the token (drm.py:handle_client_response_error)
 *
 * One fresh connection per chunk — Python does exactly this per partial text,
 * and reusing sockets across the 2026 service outages proved unreliable.
 */

import WebSocket from "ws";
import { randomUUID } from "node:crypto";
import {
  generateSecMsGecV2,
  adjClockSkewSeconds,
  getUnixTimestamp,
  parseRFC1123Date,
  EDGE_WSS_URL,
  EDGE_SEC_GEC_VERSION,
  EDGE_USER_AGENT,
} from "./edge-drm";

/** Raised when the handshake is 403 but a server Date header was available. */
class SkewAdjustmentNeeded extends Error {
  serverDate: string;
  constructor(serverDate: string) {
    super("Edge TTS 403 — clock skew adjustment needed");
    this.name = "SkewAdjustmentNeeded";
    this.serverDate = serverDate;
  }
}

/** uuid4 hex, lowercase (drm.py:connect_id). */
function connectId(): string {
  return randomUUID().replace(/-/g, "");
}

/** Random uppercase 32-hex muid (drm.py:_generate_muid). */
function newMuid(): string {
  return connectId().toUpperCase();
}

/** Python time.strftime("%a %b %d %Y %H:%M:%S GMT+0000 (Coordinated Universal Time)", gmtime). */
function dateString(): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const pp = (n: number) => String(n).padStart(2, "0");                    // %d/%H/%M/%S zero-padded
  return (
    `${days[now.getUTCDay()]} ${months[now.getUTCMonth()]} ${pp(now.getUTCDate())} ` +
    `${now.getUTCFullYear()} ${pp(now.getUTCHours())}:${pp(now.getUTCMinutes())}:${pp(now.getUTCSeconds())}` +
    " GMT+0000 (Coordinated Universal Time)"
  );
}

/** Remove character ranges the service rejects; keeps \t \n \r (communicate.py). */
function stripIncompatibleCharacters(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31)) out += " ";
    else out += ch;
  }
  return out;
}

/** xml.sax.saxutils.escape — & < > only. */
function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripBytes(b: Buffer): Buffer {
  const wsSet = new Set([0x20, 0x09, 0x0a, 0x0d, 0x0b, 0x0c]);
  let s = 0, e = b.length;
  while (s < e && wsSet.has(b[s])) s++;
  while (e > s && wsSet.has(b[e - 1])) e--;
  return b.subarray(s, e);
}

/** Largest prefix of the segment that is valid UTF-8 (communicate.py:_find_safe_utf8_split_point). */
function safeUtf8SplitPoint(seg: Buffer): number {
  let cut = seg.length;
  while (cut > 0) {
    const leadPos = cut - 1;
    const lead = seg[leadPos];
    if (lead < 0x80) return cut;                       // ASCII tail → valid
    if ((lead & 0xc0) === 0x80) { cut = leadPos; continue; } // continuation tail → drop it
    const leadByteEntire = cut - leadPos;
    let need: number;
    if (lead >= 0xf8) return cut;                      // invalid lead byte — treat as opaque
    else if (lead >= 0xf0) need = 4;
    else if (lead >= 0xe0) need = 3;
    else if (lead >= 0xc0) need = 2;
    else need = 1;
    if (leadByteEntire >= need) return cut;            // full multibyte sequence included
    cut = leadPos;                                     // incomplete tail → end before it
    if (cut <= 0) return 0;
  }
  return cut;
}

/** Move a split point back so it can't cut an XML entity (communicate.py:_adjust_split_point_for_xml_entity). */
function adjustSplitPointForXmlEntity(buf: Buffer, splitAtIn: number): number {
  let splitAt = splitAtIn;
  while (splitAt > 0) {
    const before = buf.subarray(0, splitAt);
    const amp = before.lastIndexOf(0x26); // '&'
    if (amp < 0) break;
    const entityEnd = before.indexOf(0x3b, amp); // ';'
    if (entityEnd !== -1 && entityEnd < splitAt) break;   // terminated entity — safe
    splitAt = amp;
  }
  return splitAt;
}

/**
 * Split (already XML-escaped) UTF-8 bytes into ≤ byteLength chunks at
 * newline/space/UTF-8/entity-safe boundaries — communicate.py:split_text_by_byte_length.
 */
function splitTextBytes(text: Buffer, byteLength: number): Buffer[] {
  const chunks: Buffer[] = [];
  let rest = text;
  while (rest.length > byteLength) {
    // prefer the rightmost newline inside the limit, then the rightmost space
    let splitAt = rest.subarray(0, byteLength).lastIndexOf(0x0a);
    if (splitAt < 0) splitAt = rest.subarray(0, byteLength).lastIndexOf(0x20);
    if (splitAt < 0) splitAt = safeUtf8SplitPoint(rest.subarray(0, byteLength));
    splitAt = adjustSplitPointForXmlEntity(rest, splitAt);
    const chunk = stripBytes(rest.subarray(0, splitAt > 0 ? splitAt : 1));
    if (chunk.length > 0) chunks.push(chunk);
    rest = rest.subarray(splitAt > 0 ? splitAt : 1);
  }
  const remaining = stripBytes(rest);
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Synthesize one pre-split chunk on a fresh connection (Python __stream).
 * `useSkewDate` re-reads the token after a skew correction on retry.
 */
function synthesizePiece(ssmlText: string, voice: string, timeoutMs: number, isRetry: boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const skipSkewProbe = isRetry; // a retry after a skew fix never needs another 403 probe
    try {
      const connectionId = connectId();
      const gec = skipSkewProbe ? generateSecMsGecV2(getUnixTimestamp()) : generateSecMsGecV2();
      const url =
        `${EDGE_WSS_URL}&ConnectionId=${connectionId}` +
        `&Sec-MS-GEC=${encodeURIComponent(gec)}` +
        `&Sec-MS-GEC-Version=${encodeURIComponent(EDGE_SEC_GEC_VERSION)}`;

      const ws = new WebSocket(url, {
        headers: {
          "User-Agent": EDGE_USER_AGENT,
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-US,en;q=0.9",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
          "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
          "Cookie": `muid=${newMuid()};`,
        },
        perMessageDeflate: false,
        handshakeTimeout: Math.min(timeoutMs, 5000),
      });

      const chunks: Buffer[] = [];
      let finished = false;
      let audioWasReceived = false;

      const fail = (err: Error) => {
        if (finished) return;
        finished = true;
        try { ws.terminate(); } catch { /* ignore */ }
        clearTimeout(timer);
        reject(err);
      };
      const succeed = () => {
        if (finished) return;
        if (!audioWasReceived) { fail(new Error("Edge returned no audio")); return; }
        finished = true;
        clearTimeout(timer);
        try { ws.close(); } catch { /* ignore */ }
        resolve(Buffer.concat(chunks));
      };

      const timer = setTimeout(() => fail(new Error("Edge TTS timeout")), timeoutMs);

      ws.on("unexpected-response", (_req: unknown, res: { statusCode?: number; headers?: Record<string, string | string[] | undefined> }) => {
        const status = res?.statusCode ?? 0;
        const date = res?.headers?.date;
        if (status === 403 && typeof date === "string") fail(new SkewAdjustmentNeeded(date));
        else fail(new Error(`Edge TTS handshake rejected: ${status || "no response"}`));
      });

      ws.on("open", () => {
        // X-Timestamp without "Z": speech.config (communicate.py:send_command_request)
        ws.send(
          `X-Timestamp:${dateString()}\r\n` +
          "Content-Type:application/json; charset=utf-8\r\n" +
          "Path:speech.config\r\n\r\n" +
          '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
          '"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"' +
          "}," +
          '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"' +
          "}}}}\r\n",
        );
        // X-Timestamp with trailing "Z": Edge bug, do not "fix" (ssml_headers_plus_data)
        ws.send(
          `X-RequestId:${connectId()}\r\n` +
          "Content-Type:application/ssml+xml\r\n" +
          `X-Timestamp:${dateString()}Z\r\n` +
          "Path:ssml\r\n\r\n" +
          "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
          `<voice name='${voice}'>` +
          "<prosody pitch='+0Hz' rate='+0%' volume='+0%'>" +
          ssmlText +
          "</prosody></voice></speak>",
        );
      });

      ws.on("message", (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          const raw = data instanceof Buffer ? data : Buffer.from(data);
          if (raw.length < 2) { fail(new Error("Binary frame missing header length")); return; }
          const headerLen = raw.readUInt16BE(0);
          if (headerLen > raw.length) { fail(new Error("Binary header length out of range")); return; }
          const headerBlock = raw.subarray(2, 2 + headerLen).toString("utf8");
          let path: string | null = null;
          let contentType: string | null = null;
          for (const line of headerBlock.split("\r\n")) {
            const idx = line.indexOf(":");
            if (idx < 0) continue;
            const k = line.slice(0, idx);
            const v = line.slice(idx + 1);
            if (k === "Path") path = v;
            else if (k === "Content-Type") contentType = v;
          }
          if (path !== "audio") { fail(new Error("Binary frame path is not audio")); return; }
          const payload = raw.subarray(headerLen + 2);
          // No Content-Type is acceptable only with an empty payload (turn terminator)
          if (contentType === null) {
            if (payload.length === 0) return;
            fail(new Error("Binary frame without Content-Type but with data"));
            return;
          }
          if (contentType !== "audio/mpeg") { fail(new Error(`Unexpected audio Content-Type: ${contentType}`)); return; }
          if (payload.length === 0) { fail(new Error("Binary frame missing audio data")); return; }
          audioWasReceived = true;
          chunks.push(Buffer.from(payload));
          return;
        }

        const text = data.toString("utf8");
        const sep = text.indexOf("\r\n\r\n");
        const headerBlock = sep >= 0 ? text.slice(0, sep) : text;
        let path = "";
        for (const line of headerBlock.split("\r\n")) {
          const idx = line.indexOf(":");
          if (idx > 0 && line.slice(0, idx) === "Path") { path = line.slice(idx + 1); break; }
        }
        if (path === "turn.end") succeed();
        // response / turn.start / audio.metadata — silently ignored
      });

      ws.on("error", (err: Error) => fail(err.message.includes("403")
        ? new Error(`Edge TTS handshake rejected: 403`)
        : err));
      ws.on("close", () => {
        if (finished) return;
        // Python's loop exits on close and only complains when no audio arrived.
        if (audioWasReceived) succeed();
        else fail(new Error("Edge connection closed before audio"));
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Full text → concatenated MP3, mirroring synthesize.stream(): escape before
 * splitting, one connection per chunk, and a single 403-driven clock-skew
 * correction followed by a retry.
 */
export async function edgeSynthesizeMp3(
  voice: string,
  text: string,
  timeoutMs = 8000,
): Promise<Buffer> {
  const raw = escapeXml(stripIncompatibleCharacters(text));
  const pieces = splitTextBytes(Buffer.from(raw, "utf8"), 4096);
  const parts: Buffer[] = [];
  for (const piece of pieces) {
    let done = false;
    let skewAttempted = false;
    while (!done) {
      try {
        parts.push(await synthesizePiece(piece.toString("utf8"), voice, timeoutMs, skewAttempted));
        done = true;
      } catch (err) {
        if (err instanceof SkewAdjustmentNeeded && !skewAttempted) {
          const serverTs = parseRFC1123Date(err.serverDate);
          if (serverTs === null) throw err;
          // drm.py:adj_clock_skew_seconds(server_date_parsed - client_date)
          adjClockSkewSeconds(serverTs - getUnixTimestamp());
          skewAttempted = true; // regenerate the token with the corrected time and retry once
          continue;
        }
        throw err;
      }
    }
  }
  const mp3 = Buffer.concat(parts);
  if (mp3.length < 200) throw new Error("Edge produced too little audio");
  return mp3;
}
