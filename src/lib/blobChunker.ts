import { writable } from 'svelte/store';
export const chunkSize = writable(5 * 1024 * 1024);
let csize: number = 5 * 1024 * 1024;
chunkSize.subscribe(value => (csize = value));

export async function getChunk(blob: Blob, chunkFrom: number) {
  const from = chunkFrom;
  chunkFrom += csize;
  if (chunkFrom >= blob.size) chunkFrom = blob.size;
  return { chunkFrom, value: await blob.slice(from, chunkFrom).arrayBuffer() };
}
export async function* getChunkIter(blob: Blob) {
  for (let i = 0; i < blob.size; ) {
    const { value, chunkFrom } = await getChunk(blob, i);
    i = chunkFrom;
    yield value;
  }
}
export function getStream(blob: Blob) {
  let i: number;
  return new ReadableStream<ArrayBuffer>({
    start() {
      i = 0;
    },
    async pull(controller) {
      const { value, chunkFrom } = await getChunk(blob, i);
      i = chunkFrom;
      if (i < blob.size) controller.enqueue(value);
      else controller.close();
    },
  });
}
