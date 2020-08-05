import { css, define, html } from '../web_modules/uce.js'
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
  observedAttributes: ['readonly'],
  attributeChanged () {
    this.render()
  },
  async render () {
    const dates = await getDates()
    const readonly = this.props.readonly === 'true'
    const props = { dates, readonly }
    this.html`${render(props)}`
  }
})

function render (props) {
  const { dates, readonly } = props
  return html`
    <dl>
      <dt>Dates</dt>
      <dd .hidden=${readonly}>
        <button onclick=${addDate}>
          <hw-icon name='plus' />
          Add date
        </button>
      </dd>
      ${dates.map((date) => renderDate(props, date))}
    </dl>
  `
}

function renderDate (props, date) {
  const { readonly } = props
  const { startDate } = date
  return html`
    <dd>
      <span>
        ${startDate}
      </span>
      <button
        .hidden=${readonly}
        onclick=${() => editDate(date)}>
        Edit
      </button>
      <button
        .hidden=${readonly}
        onclick=${() => removeDate(date)}>
        Remove
      </button>
    </dd>
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
    startDate: formatDate(result)
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
