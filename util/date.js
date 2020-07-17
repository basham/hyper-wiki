import cuid from 'https://cdn.pika.dev/cuid'
import dayjs from 'https://cdn.pika.dev/dayjs'
import { DATA_FOLDER, getDataPath, getEntityId } from './entity.js'
import { sortBy } from './sort.js'

const FILE_NAME = 'date.json'
const TYPE = 'date'
const VERSION = 1

const DATE_FORMAT = 'YYYY-MM-DD'
const DATE_DISPLAY = 'ddd, MMM D, YYYY'
const DATETIME_DISPLAY = `${DATE_DISPLAY}, h:mm A`

export function displayDateTime (value) {
  return dayjs(value).format(DATETIME_DISPLAY)
}

export async function createDate (data = {}) {
  const entity = getEntityId()
  const id = cuid()
  const path = getDateFilePath({ entity, id })
  const file = {
    id,
    entity,
    type: TYPE,
    version: VERSION,
    data
  }
  await beaker.hyperdrive.writeFile(path, file, 'json')
}

export async function deleteDate (id) {
  const entity = getEntityId()
  const path = getDateFilePath({ entity, id })
  await beaker.hyperdrive.unlink(path)
}

export function formatDate (value) {
  return dayjs(value).format(DATE_FORMAT)
}

export async function getDate (path) {
  const file = await beaker.hyperdrive.readFile(path, 'json')
  const { data, ...meta } = file
  const { startDate: rawStartDate } = data
  return {
    ...meta,
    rawStartDate,
    startDate: dayjs(rawStartDate).format(DATE_DISPLAY)
  }
}

export async function getDates () {
  const entity = getEntityId()
  const results = await beaker.hyperdrive.query({
    path: `${DATA_FOLDER}/${entity}/*.${FILE_NAME}`,
    type: 'file'
  })
  const all = await Promise.all(results.map(({ path }) => getDate(path)))
  return all.sort(sortBy({ key: 'rawStartDate', reverse: true }))
}

export function getDateFilePath (options) {
  const { entity, id } = options
  return `${getDataPath(entity)}${id}.${FILE_NAME}`
}

export function isDateValid (value) {
  return dayjs(value).isValid()
}

export async function updateDate (options) {
  const { id, data, entity = getEntityId() } = options
  const path = getDateFilePath({ entity, id })
  const file = {
    id,
    entity,
    type: TYPE,
    version: VERSION,
    data
  }
  await beaker.hyperdrive.writeFile(path, file, 'json')
}
