import { getDataPath, getEntityId } from './entity.js'
import { fileExists } from './fs.js'

const FILE_NAME = 'trash.json'
const TYPE = 'trash'
const VERSION = 1

export async function deleteEntity (entity = getEntityId()) {
  const path = getTrashFilePath(entity)
  const data = {
    entity,
    type: TYPE,
    version: VERSION
  }
  await beaker.hyperdrive.writeFile(path, data, 'json')
}

export function getTrashFilePath (entity) {
  return `${getDataPath(entity)}${FILE_NAME}`
}

export async function getTrashTime (entity) {
  const path = getTrashFilePath(entity)
  const { ctime } = await beaker.hyperdrive.stat(path)
  return ctime
}

export async function isEntityTrashed (entity) {
  const path = getTrashFilePath(entity)
  return await fileExists(path)
}

export async function restoreEntity (entity) {
  const path = getTrashFilePath(entity)
  await beaker.hyperdrive.unlink(path)
}
