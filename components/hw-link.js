import { css, define } from '../web_modules/uce.js'
import { getPage } from '../util/page.js'

define('hw-link', {
  extends: 'a',
  style: selector => css`
    ${selector} {
      text-decoration: none;
    }

    ${selector} > .icon {
      font-family: var(--font-code);
    }

    ${selector} > .title {
      text-decoration: underline;
    }
  `,
  async init () {
    this.render()
    document.addEventListener('render', this.render.bind(this))
  },
  async render () {
    try {
      const { entity } = this.dataset
      if (!entity) {
        const { title } = await beaker.hyperdrive.getInfo()
        this.href = '/'
        this.html`<span class='title'>${title}</span>`
        return
      }
      const { icon, title, url } = await getPage(entity)
      this.href = url
      this.html`<span class='icon'>${icon}</span><span class='title'>${title}</span>`
    } catch (e) {}
  }
})
