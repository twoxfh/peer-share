import type Peer from 'peerjs';
import { getChunkIter } from './blobChunker';
import getLock from './Lock';
import { saveBlob } from './utils';
// import streamSaver from 'streamsaver';
// streamSaver.mitm = 'https://vigneshpa.github.io/stream-saver-mitm/';

export default class FileTransfer {
  constructor(
    public connection: Peer.DataConnection,
    public progressHandler = (progress: { loaded: number; total: number }) => {}
  ) {
    connection.on('close', () => (this.requestCancel = true));
    this.reqres = new ReqRes(connection, this.requestHandler.bind(this));
    this.streamPull = null;
    this.requestCancel = false;
  }
  private reqres: ReqRes<FileTransfer['requestHandler']>;
  private requestCancel: boolean;
  private streamPull: ((cancel: boolean) => Promise<ArrayBuffer | 'stop' | 'canceled'>) | null;
  cancel(remoteRequest?: boolean) {
    if (this.streamPull) this.requestCancel = true;
    else if (!remoteRequest) this.reqres.request('stream-cancel');
  }
  async requestHandler(message: {
    filename: string;
    size: number;
  }): Promise<'accepted' | 'canceled'>;
  async requestHandler(message: 'stream-pull'): Promise<ArrayBuffer | 'stop' | 'canceled'>;
  async requestHandler(message: 'stream-cancel'): Promise<'cancelled'>;
  async requestHandler(message: any): Promise<any> {
    if (message === 'stream-pull') {
      if (!this.streamPull) throw new Error('Currently not streaming');
      return await this.streamPull(this.requestCancel);
    } else if (message === 'stream-cancel') {
      this.cancel(true);
      return 'canceled';
    } else if (message.filename) {
      const { filename, size } = message;
      if (!confirm('Do you want to download\n' + filename)) return 'canceled';
      const ft = this;
      let loaded = 0;
      const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const data = await ft.reqres.request('stream-pull');
          if (data === 'stop') controller.close();
          else if (data === 'canceled') controller.error();
          else {
            controller.enqueue(new Uint8Array(data));
            loaded += data.byteLength;
            ft.progressHandler({ loaded, total: size });
          }
        },
      });
      // const writable = streamSaver.createWriteStream(filename, { size });
      const res = new Response(body);
      res.blob().then(value => saveBlob(filename, value));
      return 'accepted';
    }
  }
  sendFile(file: File) {
    return new Promise<void>(async resolve => {
      if (this.streamPull) throw new Error('Already streaming another file');
      const response = await this.reqres.request({ filename: file.name, size: file.size });
      let loaded = 0;
      if (response === 'accepted') {
        const iter = getChunkIter(file);
        this.streamPull = async cancel => {
          if (cancel) {
            this.requestCancel = false;
            this.streamPull = null;
            resolve();
            return 'canceled';
          }
          const { value, done } = await iter.next();
          if (value) {
            loaded += value.byteLength;
            this.progressHandler({ loaded, total: file.size });
            return value;
          }
          if (done) {
            this.streamPull = null;
            resolve();
            return 'stop';
          }
          throw new Error('No value got');
        };
      }
    });
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
