// scripts/zipreader.mjs — minimal ZIP reader using only Node built-ins.
// Handles stored (0) and deflate (8) entries; enough for .xlsx / asset zips.
import { readFileSync } from "fs";
import zlib from "zlib";

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

/** @param {Buffer} buf */
function findEOCD(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  throw new Error("EOCD not found — not a ZIP file?");
}

/**
 * @param {string} file
 * @returns {Map<string, Buffer>} entry name → decompressed bytes
 */
export function readZip(file) {
  const buf = readFileSync(file);
  const eocd = findEOCD(buf);
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const out = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== CEN_SIG) break;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const locOff = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString("utf8");
    // resolve local header
    if (buf.readUInt32LE(locOff) === LOC_SIG) {
      const locNameLen = buf.readUInt16LE(locOff + 26);
      const locExtraLen = buf.readUInt16LE(locOff + 28);
      const dataStart = locOff + 30 + locNameLen + locExtraLen;
      const data = buf.slice(dataStart, dataStart + compSize);
      let bytes;
      if (method === 0) bytes = Buffer.from(data);
      else if (method === 8) bytes = zlib.inflateRawSync(data);
      else bytes = Buffer.alloc(0);
      out.set(name, bytes);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** Minimal tokenizer for well-formed simple XML (xlsx-style). */
export function* xmlTokens(xml) {
  const re = /<\?[^?]*\?><!--[^\]]*-->|<!--[^>]*-->|<\/([A-Za-z0-9_:.]+)\s*>|<([A-Za-z0-9_:.]+)([^>]*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    if (m[1]) yield { type: "close", name: m[1] };
    else if (m[2]) yield { type: m[4] === "/" ? "self" : "open", name: m[2], attrs: parseAttrs(m[3]) };
    else if (m[5]) yield { type: "text", text: decodeEntities(m[5]) };
  }
}

function parseAttrs(s) {
  const out = {};
  const re = /([A-Za-z0-9_:.]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) out[m[1]] = decodeEntities(m[2]);
  return out;
}

function decodeEntities(s) {
  return s
    .replace(/&(amp|lt|gt|quot|apos|#x?[0-9A-Fa-f]+);/g, (_, e) => {
      if (e === "amp") return "&";
      if (e === "lt") return "<";
      if (e === "gt") return ">";
      if (e === "quot") return '"';
      if (e === "apos") return "'";
      if (e[0] === "#") {
        const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return String.fromCodePoint(n);
      }
      return _;
    });
}
