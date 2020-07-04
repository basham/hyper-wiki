import { css, define } from 'https://cdn.pika.dev/uce'

const sprites = '/.ui/icons.svg'

define('hw-icon', {
  style: selector => css`
    ${selector} {
      display: flex;
    }

    ${selector} svg {
      fill: none;
      height: var(--size-2);
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: calc(2rem/16);
      width: var(--size-2);
    }
  `,
  init () {
    const href = `${sprites}#${this.props.name}`
    this.html`<svg aria-hidden='true'><use href=${href}/></svg>`
  }
})
