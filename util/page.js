import cuid from 'https://cdn.pika.dev/cuid'
import { DATA_FOLDER, getDataPath, getEntityPath } from './entity.js'
import { isEntityTrashed } from './trash.js'

const DATA_FILE_NAME = 'page.json'
const CONTENT_FILE_NAME = 'page.md'
const TYPE = 'page'
const VERSION = 1

export async function createPage () {
  const entity = cuid()
  const contentPath = getPageContentFilePath(entity)
  const dataPath = getPageDataFilePath(entity)
  const data = {
    entity,
    type: TYPE,
    version: VERSION,
    data: {
      icon: '',
      title: ''
    }
  }
  await beaker.hyperdrive.writeFile(dataPath, data, 'json')
  await beaker.hyperdrive.writeFile(contentPath, '')
  return getEntityPath(entity)
}

export function getPageContentFilePath (entity) {
  return `${getDataPath(entity)}${CONTENT_FILE_NAME}`
}

export function getPageDataFilePath (entity) {
  return `${getDataPath(entity)}${DATA_FILE_NAME}`
}

export async function getPageData (entity) {
  const path = getPageDataFilePath(entity)
  return await beaker.hyperdrive.readFile(path, 'json')
}

export async function getPages (query = {}) {
  const results = await beaker.hyperdrive.query({
    path: `${DATA_FOLDER}/*/${DATA_FILE_NAME}`,
    reverse: true,
    sort: 'ctime',
    type: 'file',
    ...query
  })
  const all = await Promise.all(results.map(async ({ path }) => {
    const data = await beaker.hyperdrive.readFile(path, 'json')
    const trashed = await isEntityTrashed(data.entity)
    return [data, trashed]
  }))
  const active = all
    .filter(([data, trashed]) => !trashed)
    .map(([data]) => data)
  const trashed = all
    .filter(([data, trashed]) => trashed)
    .map(([data]) => data)
  return {
    active,
    trashed
  }
}

export async function updatePageTitle (options = {}) {
  const { entity, title } = options
  const path = getPageDataFilePath(entity)
  const data = await getPageData(entity)
  const newData = {
    ...data,
    data: {
      ...data.data,
      title
    }
  }
  await beaker.hyperdrive.writeFile(path, newData, 'json')
}
