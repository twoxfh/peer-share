<script lang="ts">
  import type Peer from 'peerjs';

  export let id: string;
  export let peer: Peer;
  export let connection: Peer.DataConnection | null;
  let remoteId = '';
  function connect(con?: string) {
    if (con) remoteId = con;
    let conn = peer.connect(remoteId, { reliable: true, serialization: 'binary' });
    conn.on('open', () => (connection = conn));
    window.location.hash = '';
  }
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    if (hash) connect(hash);
  }
</script>

<div class="container">
  <div>Your peer id is {id}</div>
  <div>
    <a href="#{id}" target="_blank"> Share this link to others to connect </a>
  </div>
  <label>
    Connect to <input type="text" bind:value={remoteId} />
  </label>
  <button on:click={() => connect()}>Connect</button>
</div>
