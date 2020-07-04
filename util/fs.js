export async function fileExists (path) {
  try {
    await beaker.hyperdrive.stat(path)
    return true
  } catch (e) {
    return false
  }
}
