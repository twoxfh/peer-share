<script lang="ts">
  import Peer from 'peerjs';
  import ConnectionManager from './ConnectionManager.svelte';
  import Workspace from './Workspace.svelte';
  let peer: Peer;
  peer = new Peer();
  let id = '';
  peer.on('open', i => console.log((id = i)));
  let connection: Peer.DataConnection | null = null;
  $: if (connection) connection.on('close', () => (left = true));
  let left = false;
  peer.on('connection', conn => conn.on('open', () => (connection = conn)));
  window.addEventListener('beforeunload', _ => {
    if (connection) connection.close();
    peer.destroy();
  });
  peer.on('error', e => console.error(e));
</script>

{#if !connection && id}
  <ConnectionManager bind:connection {peer} {id} />
{/if}
{#if connection && !left}
  <Workspace {connection} />
{/if}
{#if left}
  <div>Peer to Peer Connection to remote person is closed</div>
{/if}
