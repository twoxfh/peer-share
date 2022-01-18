export default async function () {
  if (!window.WritableStream) {
    const pfill = await import('web-streams-polyfill/ponyfill/es2018');
    for (const key in pfill) {
      if (Object.prototype.hasOwnProperty.call(pfill, key)) {
        (window as any)[key] = (pfill as any)[key];
      }
    }
  }
}
