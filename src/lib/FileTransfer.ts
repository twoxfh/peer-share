import type Peer from 'peerjs';
import streamSaver from 'streamsaver';
streamSaver.mitm = 'https://vigneshpa.github.io/stream-saver-mitm/';

export default class FileTransfer {
  connection: Peer.DataConnection;
  locked: boolean;
  lock() {
    if (this.locked) throw new Error('This connection is locked');
    this.locked = true;
  }
  releaseLock() {
    if (!this.locked) throw new Error('Cannot release a unlocked connection');
    this.ondata = () => {};
    this.locked = false;
  }
  ondata: (data: string | ArrayBuffer) => void;
  constructor(connection: Peer.DataConnection) {
    this.locked = false;
    this.ondata = () => {};
    connection.on('data', data => {
      this.ondata(data);
      console.log(data, typeof data);
      if (data.downloadFile) {
        this.lock();
        const { filename, size } = data;
        console.log('Recived request to download file', filename);
        const stream = this.getStream();
        const saver = streamSaver.createWriteStream(filename, { size });
        stream.pipeTo(saver);
      }
    });
    this.connection = connection;
  }
  sendFile(file: File) {
    this.lock();
    this.ondata = async data => {
      if (data === `stream-get-start`) {
        console.log('Starting to read from source');
        const reader = file.stream().getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (value) this.connection.send(new Uint8Array(value).buffer);
          if (done) {
            this.connection.send('stop');
            this.releaseLock();
            break;
          }
        }
      }
    };
    this.connection.send({
      downloadFile: true,
      filename: file.name,
      size: file.size,
    });
  }
  getStream() {
    const ft = this;
    return new ReadableStream<Uint8Array>({
      start(controller) {
        ft.ondata = data => {
          if (typeof data === 'string') {
            if (data === 'error') controller.error();
            else if (data === 'stop') {
              setTimeout(() => controller.close(), 1000);
              ft.releaseLock();
            }
          } else {
            controller.enqueue(new Uint8Array(data));
          }
        };
        ft.connection.send(`stream-get-start`);
      },
    });
  }
}
