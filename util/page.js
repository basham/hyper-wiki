import cuid from 'https://cdn.pika.dev/cuid'
import { DATA_FOLDER, getDataPath, getEntityPath } from './entity.js'
import { getTrashTime, isEntityTrashed } from './trash.js'
import { PAGE_ICON, PAGE_TITLE } from '../constants.js'

const FILE_NAME = 'page.json'
const TYPE = 'page'
const VERSION = 1

export async function createPage () {
  const entity = cuid()
  const path = getPageFilePath(entity)
  const file = {
    entity,
    type: TYPE,
    version: VERSION,
    data: {
      icon: '',
      title: '',
      content: ''
    }
  }
  await beaker.hyperdrive.writeFile(path, file, 'json')
  return getEntityPath(entity)
}

export function getEntityFromPath (value) {
  const match = value.match(/c\w+/)
  return match ? match[0] : match
}

export function getPageFilePath (entity) {
  return `${getDataPath(entity)}${FILE_NAME}`
}

export async function getPage (entity) {
  const path = getPageFilePath(entity)
  const file = await readPage(entity)
  const { data, ...meta } = file
  const { content: rawContent = '', icon: rawIcon = '', title: rawTitle = '' } = data
  const { ctime, mtime } = await beaker.hyperdrive.stat(path)
  const dtime = await getTrashTime(entity)
  const deleted = await isEntityTrashed(entity)
  const url = getEntityPath(entity)
  const defaultIcon = PAGE_ICON
  const defaultTitle = PAGE_TITLE
  return {
    ...meta,
    ctime,
    dtime,
    mtime,
    deleted,
    content: beaker.markdown.toHTML(rawContent),
    defaultIcon,
    defaultTitle,
    icon: rawIcon || PAGE_ICON,
    rawContent,
    rawIcon,
    rawTitle,
    title: rawTitle || PAGE_TITLE,
    url
  }
}

export function getPageFromPath (path) {
  const entity = getEntityFromPath(path)
  return getPage(entity)
}

export async function getPages (query = {}) {
  const results = await beaker.hyperdrive.query({
    path: `${DATA_FOLDER}/*/${FILE_NAME}`,
    reverse: true,
    sort: 'ctime',
    type: 'file',
    ...query
  })
  const all = await Promise.all(results.map(({ path }) => getPageFromPath(path)))
  const active = all
    .filter(({ deleted }) => !deleted)
  const deleted = all
    .filter(({ deleted }) => deleted)
  return {
    active,
    deleted
  }
}

export async function readPage (entity) {
  const path = getPageFilePath(entity)
  return await beaker.hyperdrive.readFile(path, 'json')
}

export async function updatePage (options = {}) {
  const { entity, ...data } = options
  const path = getPageFilePath(entity)
  const file = await readPage(entity)
  const newFile = {
    ...file,
    data: {
      ...file.data,
      ...data
    }
  }
  await beaker.hyperdrive.writeFile(path, newFile, 'json')
}
