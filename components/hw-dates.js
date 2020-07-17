import { css, define, html } from 'https://cdn.pika.dev/uce'
import { getDates, createDate, deleteDate, formatDate, isDateValid, updateDate } from '../util/date.js'

define('hw-dates', {
  style: selector => css`
    ${selector} {
    }
  `,
  init () {
    this.render()
    document.addEventListener('dates-updated', this.render.bind(this))
  },
  async render () {
    const dates = await getDates()
    const props = { dates }
    this.html`${render(props)}`
  }
})

function render (props) {
  const { dates } = props
  return html`
    <div>
      <button onclick=${addDate}>
        Add date
      </button>
    </div>
    <ol class='list-plain'>
      ${dates.map(renderDate)}
    </ol>
  `
}

function renderDate (props) {
  const { startDate } = props
  return html`
    <li>
      <span>
        ${startDate}
      </span>
      <button
        onclick=${() => editDate(props)}>
        Edit
      </button>
      <button
        onclick=${() => removeDate(props)}>
        Remove
      </button>
    </li>
  `
}

async function addDate () {
  const result = prompt('Add date', formatDate())
  if (!isDateValid(result)) {
    return
  }
  await createDate({
    startDate: formatDate(result)
  })
  refresh()
}

async function editDate (props) {
  const { id, rawStartDate } = props
  const result = prompt('Edit date', rawStartDate)
  if (!isDateValid(result)) {
    return
  }
  await updateDate({
    id,
    data: {
      startDate: formatDate(result)
    }
  })
  refresh()
}

async function removeDate (props) {
  const { id } = props
  await deleteDate(id)
  refresh()
}

function refresh () {
  document.dispatchEvent(new CustomEvent('dates-updated'))
}
