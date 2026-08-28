import { extname } from "node:path";

const maximumAssetBytes = 25 * 1024 * 1024;
export const maximumProjectAssetBytes = 100 * 1024 * 1024;

const policies = new Map([
  [".png", { mediaType: "image/png", magic: (bytes) => bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) }],
  [".jpg", { mediaType: "image/jpeg", magic: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  [".jpeg", { mediaType: "image/jpeg", outputExtension: ".jpg", magic: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  [".webp", { mediaType: "image/webp", magic: (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP" }],
  [".avif", { mediaType: "image/avif", magic: (bytes) => bytes.subarray(4, 8).toString("ascii") === "ftyp" && new Set(["avif", "avis"]).has(bytes.subarray(8, 12).toString("ascii")) }],
  [".mp3", { mediaType: "audio/mpeg", magic: (bytes) => bytes.subarray(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) }],
  [".m4a", { mediaType: "audio/mp4", magic: (bytes) => bytes.subarray(4, 8).toString("ascii") === "ftyp" && new Set(["M4A ", "isom", "mp42"]).has(bytes.subarray(8, 12).toString("ascii")) }],
  [".wav", { mediaType: "audio/wav", magic: (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WAVE" }],
  [".ogg", { mediaType: "audio/ogg", magic: (bytes) => bytes.subarray(0, 4).toString("ascii") === "OggS" }],
  [".woff2", { mediaType: "font/woff2", magic: (bytes) => bytes.subarray(0, 4).toString("ascii") === "wOF2" }],
]);

function fail(message) { throw new Error(message); }

export function admitAsset({ id, source, mediaType, bytes }) {
  const extension = extname(source).toLowerCase();
  const policy = policies.get(extension);
  if (!policy) fail(`asset ${id} uses an unsupported extension: ${extension || "none"}`);
  if (mediaType !== policy.mediaType) fail(`asset ${id} mediaType does not match ${extension}`);
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 4 || bytes.byteLength > maximumAssetBytes) fail(`asset ${id} must contain 4 to ${maximumAssetBytes} bytes`);
  if (!policy.magic(bytes)) fail(`asset ${id} content does not match ${mediaType}`);
  const kind = mediaType.split("/", 1)[0];
  if (!new Set(["audio", "font", "image"]).has(kind)) fail(`asset ${id} uses an unsupported kind: ${kind}`);
  return Object.freeze({ kind, outputExtension: policy.outputExtension ?? extension, maximumAssetBytes });
}

export const AssetMediaTypes = Object.freeze([...new Set([...policies.values()].map((policy) => policy.mediaType))].sort());
export const AssetKinds = Object.freeze(["audio", "font", "image"]);
