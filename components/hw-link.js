import { css, define } from 'https://cdn.pika.dev/uce'
import { PAGE_ICON, PAGE_TITLE } from '../constants.js'

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
    const { metadata } = await beaker.hyperdrive.stat(this.href)
    const { icon = PAGE_ICON, title = PAGE_TITLE } = metadata
    this.html`${icon} <span class='title'>${title}</span>`
  }
})
