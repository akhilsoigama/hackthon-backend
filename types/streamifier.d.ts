declare module 'streamifier' {
  import { Readable } from 'stream'

  function createReadStream(buffer: Buffer): Readable

  const streamifier: {
    createReadStream(buffer: Buffer): Readable
  }

  export = streamifier
}
