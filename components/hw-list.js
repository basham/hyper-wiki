import { define, html } from 'https://cdn.pika.dev/uce'

define('hw-list', {
  async init () {
    const files = await beaker.hyperdrive.query({
      path: 'journal/*.md',
      reverse: true,
      sort: 'name',
      type: 'file'
    })
    this.html`<ul class='list-plain'>${files.map(renderItem)}</ul>`
  }
})

function renderItem (props) {
  const { path } = props
  return html`
    <li><a href=${path} is='hw-link'></a></li>
  `
}
