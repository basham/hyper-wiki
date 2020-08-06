import { css, define } from '../web_modules/uce.js'

const sprites = '/.ui/icons.svg'

define('hw-icon', {
  style: selector => css`
    ${selector} {
      --icon-size: var(--size-2);
      display: flex;
    }

    ${selector} svg {
      fill: none;
      height: var(--icon-size);
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: calc(2rem/16);
      width: var(--icon-size);
    }
  `,
  init () {
    this.dispatchEvent(new CustomEvent('loading', { bubbles: true }))
    const href = `${sprites}#${this.props.name}`
    this.html`<svg aria-hidden='true'><use href=${href}/></svg>`
    this.dispatchEvent(new CustomEvent('loaded', { bubbles: true }))
  }
})
