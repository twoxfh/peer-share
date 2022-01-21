import App from './App.svelte';
window.app = new App({
  target: document.body,
});

export default window.app;
declare global {
  interface Window {
    app: App;
  }
}
