import { css, define, html } from '../web_modules/uce.js'
import { fileExists } from '../util/fs.js'
import { debounce } from '../util/operators.js'
import { hasStat } from '../util/stat.js'

define('hw-root', {
  style: selector => css`
  ${selector} {
    visibility: hidden;
  }

  ${selector}[loaded] {
    visibility: initial;
  }
`,
  async init () {
    this.loadingChildren = new Set()
    this.debounceLoadedCheck = debounce(this.loadedCheck.bind(this), 100)
    const props = await load()
    this.html`${render(props)}`
  },
  onloading (event) {
    this.loadingChildren.add(event.target)
  },
  onloaded (event) {
    this.loadingChildren.delete(event.target)
    this.debounceLoadedCheck()
  },
  loadedCheck () {
    if (this.loadingChildren.size === 0) {
      this.setAttribute('loaded', '')
    }
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
