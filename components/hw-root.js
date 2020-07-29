import { define, html } from 'https://cdn.pika.dev/uce'
import { fileExists } from '../util/fs.js'
import { hasStat } from '../util/stat.js'

define('hw-root', {
  async init () {
    const props = await load()
    this.html`${render(props)}`
  }
})

async function load () {
  const state = await getState()
  return {
    state
  }
}

async function getState () {
  const path = location.pathname
  if (path === '/') {
    return 'index'
  }
  if (await fileExists(path)) {
    return 'file'
  }
  if (await hasStat()) {
    return 'page'
  }
  return '404'
}

function render (props) {
  const { state } = props
  return html([`<hw-view-${state} />`])
}
