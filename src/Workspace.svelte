<script lang="ts">
  import type Peer from 'peerjs';
  import FileTransfer from './lib/FileTransfer';

  export let connection: Peer.DataConnection;

  let files: FileList;

  const ft = new FileTransfer(connection);

  async function send() {
    for (let file of files) {
      ft.sendFile(file);
      alert('Sent file ' + file.name);
    }
  }
</script>

<div class="container">
  <input type="file" multiple bind:files />
  <button on:click={send}>Send</button>
</div>
