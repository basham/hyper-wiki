import { getDataPath, getEntityId } from './entity.js'
import { fileExists } from './fs.js'

const FILE_NAME = '.trash'
const TYPE = 'trash'
const VERSION = 1

export async function deleteEntity (entity = getEntityId()) {
  const path = getTrashFilePath(entity)
  const metadata = {
    entity,
    type: TYPE,
    version: VERSION
  }
  await beaker.hyperdrive.writeFile(path, '', { metadata })
}

export function getTrashFilePath (entity) {
  return `${getDataPath(entity)}${FILE_NAME}`
}

export async function isEntityTrashed (entity) {
  const path = getTrashFilePath(entity)
  return await fileExists(path)
}

export async function restoreEntity (entity) {
  const path = getTrashFilePath(entity)
  await beaker.hyperdrive.unlink(path)
}
