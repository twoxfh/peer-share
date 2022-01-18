<script lang="ts">
  import type Peer from 'peerjs';

  export let id: string;
  export let peer: Peer;
  export let connection: Peer.DataConnection | undefined;
  let remoteId = '';
  function connect() {
    let conn = peer.connect(remoteId, { reliable: true, serialization: 'binary' });
    conn.on('open', () => (connection = conn));
  }
</script>

<div class="container">
  <div>Your peer id is {id}</div>
  <label>
    Connect to <input type="text" bind:value={remoteId} />
  </label>
  <button on:click={() => connect()}>Connect</button>
</div>
