let previousLock = Promise.resolve();
export default async function getLock() {
  await previousLock;
  let ret: { releaseLock: () => void; promise: Promise<void> } = {} as any;
  previousLock = ret.promise = new Promise<void>(resolve => (ret.releaseLock = resolve));
  return ret;
}
