import { css, define } from 'https://cdn.pika.dev/uce'

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
    const { icon = '📄', title = this.href } = metadata
    this.html`${icon} <span class='title'>${title}</span>`
  }
})
