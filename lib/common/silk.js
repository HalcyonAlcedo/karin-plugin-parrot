import { decode, isSilk } from 'silk-wasm'
import { Writable, Duplex } from 'stream'
import { logger } from 'node-karin'
import ffmpeg from 'fluent-ffmpeg'

/**
 * silk转wav
 * @param {Buffer} buffer
 * @returns
 */
export async function silk2wav(buffer) {
  try {
    const inputBuffer = buffer
    const pcm = isSilk(inputBuffer) ? Buffer.from((await decode(inputBuffer, 48000)).data) : inputBuffer
    const readable = Duplex.from(pcm)
    const wav = await convertToWav(readable)
    return wav
  } catch (error) {
    logger.error(error)
    return false
  }
}

class MemoryWritableStream extends Writable {
  constructor() {
    super({ objectMode: true })
    this.chunks = []
  }
  _write(chunk, encoding, callback) {
    this.chunks.push(chunk)
    callback()
  }
  getData() {
    return Buffer.concat(this.chunks)
  }
}

/**
 *  ffmpeg转码wav
 * @param {Buffer} inputBuffer
 * @returns
 */
async function convertToWav(inputBuffer) {
  return new Promise((resolve, reject) => {
    const outputBuffer = new MemoryWritableStream()
    ffmpeg(inputBuffer)
      .inputFormat('s16le')
      .audioCodec('pcm_s16le')
      .toFormat('wav')
      .on('end', () => resolve(outputBuffer.getData()))
      .on('error', (err) => reject(err))
      .pipe(outputBuffer, { end: true })
  })
}
