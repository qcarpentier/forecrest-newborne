var MAX_SHARED_HASH_LENGTH = 200000;
var MAX_SNAPSHOT_TEXT_LENGTH = 750000;
var MAX_SNAPSHOT_DEPTH = 18;
var MAX_ARRAY_LENGTH = 5000;
var DANGEROUS_KEYS = { "__proto__": true, "constructor": true, "prototype": true };

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  var proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function sanitizeSerializable(value, depth) {
  if (depth > MAX_SNAPSHOT_DEPTH) return null;
  if (value == null) return value;

  var type = typeof value;
  if (type === "string" || type === "boolean") return value;
  if (type === "number") return Number.isFinite(value) ? value : null;

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map(function (item) {
      return sanitizeSerializable(item, depth + 1);
    });
  }

  if (!isPlainObject(value)) return null;

  var next = {};
  Object.keys(value).forEach(function (key) {
    if (DANGEROUS_KEYS[key]) return;
    next[key] = sanitizeSerializable(value[key], depth + 1);
  });
  return next;
}

export function sanitizeSnapshot(snapshot) {
  var clean = sanitizeSerializable(snapshot, 0);
  return isPlainObject(clean) ? clean : null;
}

export function parseSnapshotText(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Snapshot is empty");
  }
  if (text.length > MAX_SNAPSHOT_TEXT_LENGTH) {
    throw new Error("Snapshot too large");
  }

  var parsed = JSON.parse(text);
  var clean = sanitizeSnapshot(parsed);
  if (!clean) {
    throw new Error("Snapshot is invalid");
  }
  return clean;
}

export function encodeSharedSnapshot(snapshot) {
  var clean = sanitizeSnapshot(snapshot);
  if (!clean) {
    throw new Error("Snapshot is invalid");
  }

  var json = JSON.stringify(clean);
  if (json.length > MAX_SNAPSHOT_TEXT_LENGTH) {
    throw new Error("Snapshot too large");
  }

  return btoa(encodeURIComponent(json));
}

export function decodeSharedSnapshot(rawHash) {
  if (!rawHash || typeof rawHash !== "string") {
    throw new Error("Missing shared snapshot");
  }
  if (rawHash.length > MAX_SHARED_HASH_LENGTH) {
    throw new Error("Shared snapshot too large");
  }

  var decoded = decodeURIComponent(atob(rawHash));
  return parseSnapshotText(decoded);
}
