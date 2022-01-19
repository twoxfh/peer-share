const chunkSize = 5 * 1024 * 1024;
export function getNumberOfChunks(size: number) {
  return Math.ceil(size / chunkSize);
}
export async function getChunk(blob: Blob, chunkNumber: number, noc?: number) {
  const noOfChunks = noc ?? getNumberOfChunks(blob.size);
  if (chunkNumber >= noOfChunks) throw new Error('Chunk out of bounds');
  if (chunkNumber !== noOfChunks - 1)
    return await blob.slice(chunkNumber * chunkSize, (chunkNumber + 1) * chunkSize).arrayBuffer();
  else return await blob.slice(chunkNumber * chunkSize).arrayBuffer();
}
export async function* getChunkIter(blob: Blob) {
  const noOfChunks = getNumberOfChunks(blob.size);
  for (let i = 0; i < noOfChunks; i++) {
    yield await getChunk(blob, i, noOfChunks);
  }
}
export function getStream(blob: Blob) {
  const noOfChunks = getNumberOfChunks(blob.size);
  let i: number;
  return new ReadableStream<ArrayBuffer>({
    start() {
      i = 0;
    },
    async pull(controller) {
      if (i < noOfChunks) controller.enqueue(await getChunk(blob, i++, noOfChunks));
      else controller.close();
    },
  });
}
