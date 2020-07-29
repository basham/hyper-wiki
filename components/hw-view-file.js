import { define, html } from 'https://cdn.pika.dev/uce'

define('hw-view-file', {
  async init () {
    const props = await load()
    this.html`${render(props)}`
  }
})

async function load () {
  const path = location.pathname
  const file = await beaker.hyperdrive.readFile(path)
  const content = parseFile(path, file)
  return {
    content
  }
}

function parseFile (path, file) {
  if (/\.md$/i.test(path)) {
    return beaker.markdown.toHTML(file)
  }
  if (/\.html$/i.test(path)) {
    return file
  }
  const escapedFile = file
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<pre><div class='fs-1'>${escapedFile}</div></pre>`
}

function render (props) {
  const { content } = props
  return html`
    <hw-header />
    <main class='page padding-8'>
      ${html([content])}
    </main>
  `
}
