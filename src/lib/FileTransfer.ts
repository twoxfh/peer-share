import type Peer from 'peerjs';
import streamSaver from 'streamsaver';
streamSaver.mitm = 'https://vigneshpa.github.io/stream-saver-mitm/';

type IdleData = {
  filename: string;
  size: number;
};

type ReciveData = ArrayBuffer | 'stop';

type SendData = 'get' | 'stopped';

export default class FileTransfer {
  connection: Peer.DataConnection;
  mode: 'idle' | 'send' | 'recive';
  readController: ReadableStreamDefaultController | null;
  getChunk: (() => Promise<{ value: ArrayBuffer | null; done: boolean }>) | null;
  constructor(conn: Peer.DataConnection) {
    console.log('Attaching file transfer object to ', conn);
    this.connection = conn;
    this.mode = 'idle';
    this.readController = null;
    this.getChunk = null;
    this.connection.on('data', data => {
      console.log('recived data', data);
      if (this.mode === 'idle') {
        const { filename, size } = data as IdleData;
        const stream = new ReadableStream({
          start: controller => {
            this.readController = controller;
            this.connection.send('get');
          },
        });
        const writer = streamSaver.createWriteStream(filename, { size });
        stream.pipeTo(writer);
        this.mode = 'recive';
      } else if (this.mode === 'recive') {
        if (!this.readController) throw new Error("Don't send data before get");
        const message = data as ReciveData;
        if (typeof message === 'string') {
          this.readController.close();
          this.readController = null;
          this.connection.send('stopped');
          this.mode = 'idle';
        } else {
          this.readController.enqueue(new Uint8Array(message));
          this.connection.send('get');
        }
      } else if (this.mode === 'send') {
        const message = data as SendData;
        if (message === 'get') {
          this.getChunk!().then(({ value, done }) => {
            if (value) {
              this.connection.send(value);
            }
            if (done) {
              this.connection.send('stop');
            }
          });
        } else if (message === 'stopped') {
          this.getChunk = null;
          this.mode = 'idle';
        }
      }
    });
  }
  sendFile(file: File) {
    if (this.mode !== 'idle') throw new Error('This connection is not idle');
    const chunkSize = 10 * 1024 * 1024;
    let currentPos = 0;
    let nextDone = false;
    this.getChunk = async () => {
      const done = nextDone;
      let value: ArrayBuffer | null = null;
      if (!done) {
        if (currentPos + chunkSize <= file.size) {
          value = await file.slice(currentPos, currentPos + chunkSize).arrayBuffer();
          currentPos += chunkSize;
        } else {
          value = await file.slice(currentPos).arrayBuffer();
          nextDone = true;
        }
      }
      return { value, done };
    };
    this.mode = 'send';
    this.connection.send({ filename: file.name, size: file.size } as IdleData);
  }
}
