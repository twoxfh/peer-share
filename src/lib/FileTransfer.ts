import type Peer from 'peerjs';
import streamSaver from 'streamsaver';
import { getChunkIter } from './blobChunker';
import getLock from './Lock';
streamSaver.mitm = 'https://vigneshpa.github.io/stream-saver-mitm/';

export default class FileTransfer {
  reqres: ReqRes<FileTransfer['requestHandler']>;
  streamPull: (() => Promise<ArrayBuffer | 'stop'>) | null;
  constructor(public connection: Peer.DataConnection) {
    this.reqres = new ReqRes(connection, this.requestHandler.bind(this));
    this.streamPull = null;
  }
  async requestHandler(message: {
    filename: string;
    size: number;
  }): Promise<'accepted' | 'canceled'>;
  async requestHandler(message: 'stream-pull'): Promise<ArrayBuffer | 'stop'>;
  async requestHandler(message: any): Promise<any> {
    if (message === 'stream-pull') {
      if (!this.streamPull) throw new Error('Currently not streaming');
      return await this.streamPull();
    }
    if (message.filename) {
      const { filename, size } = message;
      if (!confirm('Do you want to download\n' + filename)) return 'canceled';
      const ft = this;
      const readable = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const data = await ft.reqres.request('stream-pull');
          if (data === 'stop') controller.close();
          else controller.enqueue(new Uint8Array(data));
        },
      });
      const writable = streamSaver.createWriteStream(filename, { size });
      readable.pipeTo(writable);
      return 'accepted';
    }
  }
  async sendFile(file: File) {
    if (this.streamPull) throw new Error('Already streaming another file');
    const response = await this.reqres.request({ filename: file.name, size: file.size });
    if (response === 'accepted') {
      const iter = getChunkIter(file);
      this.streamPull = async () => {
        const { value, done } = await iter.next();
        if (value) return value;
        if (done) {
          this.streamPull = null;
          return 'stop';
        }
        throw new Error('No value got');
      };
    }
  }
}

class ReqRes<T extends (message: any) => Promise<any>> {
  connection: Peer.DataConnection;
  resolver: ((data: any) => void) | null;
  constructor(conn: Peer.DataConnection, requestHandler: T) {
    this.connection = conn;
    this.resolver = null;
    this.connection.on('data', async data => {
      if (data.response) {
        this.resolver!(data.message);
      }
      if (data.request) {
        const lock = await getLock();
        const res = await requestHandler(data.message);
        this.connection.send({ response: true, message: res });
        lock.releaseLock();
      }
    });
    this.request = (async (message: any) => {
      const lock = await getLock();
      return new Promise(resolve => {
        this.connection.send({ request: true, message });
        this.resolver = data => {
          lock.releaseLock();
          resolve(data);
        };
      });
    }) as any;
  }
  request: T;
}
