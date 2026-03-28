import { getAdapter } from "./storageAdapter";

export async function load(key) {
  try {
    return await getAdapter().load(key);
  } catch (e) {
    return null;
  }
}

export async function save(key, value) {
  try {
    await getAdapter().save(key, value);
  } catch (e) {
    // silent fail
  }
}
