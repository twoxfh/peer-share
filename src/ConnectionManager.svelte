<script lang="ts">
  import type Peer from 'peerjs';
  import QRCode from "qrcode";

  export let id: string;
  export let url: string = window.location.protocol + "//" + window.location.host + '#' + id;  
  export let peer: Peer;
  export let connection: Peer.DataConnection | null;
  let remoteId = '';
  function connect(con?: string) {
    if (con) remoteId = con;
    let conn = peer.connect(remoteId, { reliable: true, serialization: 'binary' });
    conn.on('open', () => (connection = conn));
    history.replaceState(null, document.title, window.location.pathname);
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
  <p>
    {#await QRCode.toDataURL(url)}
    <p>Generating QR Code...</p>
    {:then src}
      <img {src} alt={url} width="200" />
    {:catch err}
      <p>Failed to generate QR Code.</p>
    {/await} 
  </p>
  </div>
  <label>
    Connect to <input type="text" bind:value={remoteId} />
  </label>
  <button on:click={() => connect()}>Connect</button>
</div>
