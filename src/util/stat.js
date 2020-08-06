import { getDataPath } from './entity.js'
import { fileExists } from './fs.js'

const FILE_NAME = 'stat.json'
const TYPE = 'stat'

export async function archiveEntity (entity) {
  return await setKeyToNow(entity, 'archived')
}

export async function createStat (entity) {
  const created = new Date()
  const data = {
    entity,
    type: TYPE,
    created,
    updated: created
  }
  await writeStat(entity, data)
  return data
}

export async function deleteEntity (entity) {
  return await setKeyToNow(entity, 'deleted')
}

async function deleteKey (entity, key) {
  const data = await readStat(entity)
  const keys = Array.isArray(key) ? key : [key]
  keys.forEach((k) => {
    delete data[k]
  })
  await writeStat(entity, data)
}

export async function getStat (entity) {
  const stat = await readStat(entity)
  const { archived = null, deleted = null } = stat
  const isArchived = !!archived
  const isDeleted = !!deleted
  return {
    ...stat,
    archived,
    deleted,
    isArchived,
    isDeleted
  }
}

export function getStatFilePath (entity) {
  return `${getDataPath(entity)}${FILE_NAME}`
}

export async function hasStat (entity) {
  const path = getStatFilePath(entity)
  return await fileExists(path)
}

export async function readStat (entity) {
  const path = getStatFilePath(entity)
  return await beaker.hyperdrive.readFile(path, 'json')
}

export async function restoreEntity (entity) {
  return await deleteKey(entity, 'deleted')
}

async function setKey (entity, key, value) {
  const stat = await readStat(entity)
  await writeStat(entity, { ...stat, [key]: value })
}

async function setKeyToNow (entity, key) {
  return await setKey(entity, key, new Date())
}

export async function unarchiveEntity (entity) {
  return await deleteKey(entity, 'archived')
}

export async function updateEntity (entity) {
  return await setKeyToNow(entity, 'updated')
}

async function writeStat (entity, data) {
  const path = getStatFilePath(entity)
  return await beaker.hyperdrive.writeFile(path, data, 'json')
}
