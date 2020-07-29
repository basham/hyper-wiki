import { define, html } from 'https://cdn.pika.dev/uce'

define('hw-view-404', {
  async init () {
    this.html`${render()}`
  }
})

function render () {
  return html`
    <hw-header />
    <main class='page padding-8'>
      <h1>File not found</h1>
    </main>
  `
}
