import App from './App.svelte';
import ponyfill from './ponyfill';
function mount() {
  window.app = new App({
    target: document.body,
  });
}
ponyfill().then(mount);
export default window.app;
declare global {
  interface Window {
    app: App;
  }
}
