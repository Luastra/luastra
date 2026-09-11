const admittedMediaTypes = new Set(["image/jpeg", "image/png"]);
const defaultMaximumBytes = 25 * 1024 * 1024;
const defaultMaximumDimension = 8192;
const defaultMaximumPixels = 40 * 1024 * 1024;

function fail(message) { throw new Error(message); }
function view(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  fail("image bytes must be an ArrayBuffer or Uint8Array");
}
function uint32(bytes, offset) {
  return ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
}
function ascii(bytes, offset, count) {
  let result = "";
  for (let index = 0; index < count; index += 1) result += String.fromCharCode(bytes[offset + index]);
  return result;
}

function inspectPng(bytes) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.byteLength < 45 || !signature.every((value, index) => bytes[index] === value) || uint32(bytes, 8) !== 13 || ascii(bytes, 12, 4) !== "IHDR") return null;
  const width = uint32(bytes, 16);
  const height = uint32(bytes, 20);
  let offset = 8;
  let sawIend = false;
  while (offset + 12 <= bytes.byteLength) {
    const length = uint32(bytes, offset);
    if (length > bytes.byteLength - offset - 12) fail("PNG contains an invalid chunk length");
    const type = ascii(bytes, offset + 4, 4);
    offset += 12 + length;
    if (type === "IEND") {
      if (length !== 0 || offset !== bytes.byteLength) fail("PNG contains trailing or invalid content");
      sawIend = true;
      break;
    }
  }
  if (!sawIend) fail("PNG is incomplete");
  return { mediaType: "image/png", width, height, orientation: "normal" };
}

function inspectJpeg(bytes) {
  if (bytes.byteLength < 14 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) return null;
  const startsOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  let dimensions = null;
  while (offset < bytes.byteLength - 2) {
    if (bytes[offset] !== 0xff) fail("JPEG contains an invalid marker");
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9) break;
    if (marker === 0xda) {
      const eoi = bytes.byteLength - 2;
      if (bytes[eoi] !== 0xff || bytes[eoi + 1] !== 0xd9) fail("JPEG is incomplete");
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.byteLength) fail("JPEG is incomplete");
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.byteLength) fail("JPEG contains an invalid segment length");
    if (startsOfFrame.has(marker)) {
      if (length < 8) fail("JPEG frame is invalid");
      dimensions = { mediaType: "image/jpeg", height: (bytes[offset + 3] << 8) | bytes[offset + 4], width: (bytes[offset + 5] << 8) | bytes[offset + 6], orientation: "normal" };
    }
    offset += length;
  }
  if (!dimensions) fail("JPEG dimensions are unavailable");
  return dimensions;
}

export function inspectRasterImage(value, {
  declaredMediaType = null,
  maximumBytes = defaultMaximumBytes,
  maximumWidth = defaultMaximumDimension,
  maximumHeight = defaultMaximumDimension,
  maximumPixels = defaultMaximumPixels,
} = {}) {
  const bytes = view(value);
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 4 || maximumBytes > defaultMaximumBytes ||
      !Number.isSafeInteger(maximumWidth) || maximumWidth < 1 || maximumWidth > defaultMaximumDimension ||
      !Number.isSafeInteger(maximumHeight) || maximumHeight < 1 || maximumHeight > defaultMaximumDimension ||
      !Number.isSafeInteger(maximumPixels) || maximumPixels < 1 || maximumPixels > defaultMaximumPixels) fail("invalid image admission limits");
  if (bytes.byteLength < 14 || bytes.byteLength > maximumBytes) fail("image byte size is outside the admitted limit");
  const metadata = inspectPng(bytes) ?? inspectJpeg(bytes);
  if (!metadata || !admittedMediaTypes.has(metadata.mediaType)) fail("image content is not an admitted PNG or JPEG");
  if (declaredMediaType !== null && declaredMediaType !== metadata.mediaType) fail("image MIME type does not match its bytes");
  if (!Number.isSafeInteger(metadata.width) || !Number.isSafeInteger(metadata.height) || metadata.width < 1 || metadata.height < 1 ||
      metadata.width > maximumWidth || metadata.height > maximumHeight || metadata.width * metadata.height > maximumPixels) fail("image dimensions exceed the admitted limit");
  return Object.freeze({ ...metadata, bytes: bytes.byteLength });
}

export const rasterImageLimits = Object.freeze({
  mediaTypes: Object.freeze([...admittedMediaTypes]),
  maximumBytes: defaultMaximumBytes,
  maximumWidth: defaultMaximumDimension,
  maximumHeight: defaultMaximumDimension,
  maximumPixels: defaultMaximumPixels,
});
