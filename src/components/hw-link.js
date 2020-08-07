import { css, define } from '../web_modules/uce.js'
import { className } from '../util/dom.js'
import { getPage } from '../util/page.js'

const NAME = 'hw-link'
const cn = className(NAME)

define(NAME, {
  extends: 'a',
  style: () => css`
    .${cn()} {
      text-decoration: none;
    }

    .${cn('icon')} {
      font-family: var(--font-code);
    }

    .${cn('title')} {
      text-decoration: underline;
    }
  `,
  async init () {
    this.classList.add(cn())
    this.dispatchEvent(new CustomEvent('loading', { bubbles: true }))
    await this.render()
    document.addEventListener('render', this.render.bind(this))
    this.dispatchEvent(new CustomEvent('loaded', { bubbles: true }))
  },
  async render () {
    try {
      const { entity } = this.dataset
      if (!entity) {
        const { title } = await beaker.hyperdrive.getInfo()
        this.href = '/'
        this.html`<span class=${cn('title')}>${title}</span>`
        return
      }
      const { icon, title, url } = await getPage(entity)
      this.href = url
      this.html`<span class=${cn('icon')}>${icon}</span><span class=${cn('title')}>${title}</span>`
    } catch (e) {}
  },
  onclick (event) {
    event.preventDefault()
    history.pushState({}, '', this.href)
    this.dispatchEvent(new CustomEvent('refresh', { bubbles: true }))
  }
})
