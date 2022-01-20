<script lang="ts">
  import type Peer from 'peerjs';
  import FileTransfer from './lib/FileTransfer';
  import { humanFileSize } from './lib/utils';
  import { chunkSize } from './lib/blobChunker';

  export let connection: Peer.DataConnection;

  let files: FileList;
  let value: number = 0;
  let max: number = 100;

  const ft = new FileTransfer(connection, progress => ({ loaded: value, total: max } = progress));

  async function send() {
    for (let file of files) {
      await ft.sendFile(file);
    }
  }
</script>

<div class="container">
  <div>
    <input type="file" multiple bind:files />
    <button on:click={send}>Send</button>
  </div>
  <div>
    <label>
      Chunk Size : <select bind:value={$chunkSize}>
        <option value={1 * 1024 * 1024}>1MB</option>
        <option value={5 * 1024 * 1024}>5MB</option>
        <option value={10 * 1024 * 1024}>10MB</option>
        <option value={25 * 1024 * 1024}>25MB</option>
      </select>
    </label>
  </div>
  <div>
    <progress {value} {max} />
    {humanFileSize(value)} of {humanFileSize(max)}
    <br />
    <button on:click={() => ft.cancel()}>Cancel</button>
  </div>
</div>

<style>
  div {
    padding: 0.3rem;
    margin: 0.3rem;
  }
</style>
