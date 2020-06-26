import { define, html } from 'https://cdn.pika.dev/uce'

let pathname = location.pathname
if (pathname.endsWith('/')) pathname += 'index.html'

define('cb-list', {
  async init () {
    const files = await beaker.hyperdrive.query({
      path: 'journal/*.md',
      reverse: true,
      sort: 'name',
      type: 'file'
    })
    this.html`<ul>${files.map(renderItem)}</ul>`
  }
})

function renderItem (props) {
  const { path, stat } = props
  const { icon, title } = stat.metadata
  return html`
    <li><a href=${path}>${icon} ${title}</a></li>
  `
}
