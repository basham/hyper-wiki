import { css, define } from 'https://cdn.pika.dev/uce'
import { PAGE_ICON, PAGE_TITLE } from '../constants.js'
import { getEntityPath } from '../util/entity.js'
import { getPageFilePath } from '../util/page.js'

define('hw-link', {
  extends: 'a',
  style: selector => css`
    ${selector} {
      text-decoration: none;
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
        const info = await beaker.hyperdrive.getInfo()
        this.href = '/'
        this.html`<span class='title'>${info.title}</span>`
        return
      }
      const path = getPageFilePath(entity)
      const { metadata } = await beaker.hyperdrive.stat(path)
      const icon = metadata.icon || PAGE_ICON
      const title = metadata.title || PAGE_TITLE
      this.href = getEntityPath(entity)
      this.html`${icon} <span class='title'>${title}</span>`
    } catch (e) {}
  }
})
