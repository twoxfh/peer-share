<script lang="ts">
  import Peer from 'peerjs';
  import ConnectionManager from './ConnectionManager.svelte';
  import Workspace from './Workspace.svelte';
  let peer: Peer;
  peer = new Peer();
  let id = '';
  peer.on('open', i => console.log((id = i)));
  let connection: Peer.DataConnection;
  peer.on('connection', conn => {
    console.log(conn);
    conn.on('open', () => (connection = conn));
  });
  window.addEventListener('beforeunload', _ => peer.destroy());
  peer.on('error', e => console.error(e));
</script>

{#if !connection && id}
  <ConnectionManager bind:connection {peer} {id} />
{/if}
{#if connection}
  <Workspace {connection} />
{/if}
