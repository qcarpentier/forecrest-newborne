export async function load(key) {
  try {
    var r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}

export async function save(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value));
  } catch (e) {
    // silent fail
  }
}
