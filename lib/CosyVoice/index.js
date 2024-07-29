import { Client } from "@gradio/client"
import { logger } from 'node-karin'
import { Config } from '#template'
import FormData from 'form-data'
import axios from 'axios'
import path from 'path'

/**
 * 获取指定位数随机字母
 * @param {number} length
 * @returns {string}
 */
function getRandomAlphaNumeric(length) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

/**
 * 发送prompt音频到CosyVoice
 * @param {Buffer} buffer - 要发送给CosyVoice的文件数据
 * @param {string} file - 文件名
 * @returns {string} - 文件链接
 */
export async function uploadPrompt(buffer, file) {
  const form = new FormData()
  form.append('files', buffer, file)
  const response = await axios.post(`${Config.Config.API.endsWith('/') ? Config.Config.API : Config.Config.API + '/'}upload?upload_id=${getRandomAlphaNumeric(10)}`, form, {
    headers: {
      ...form.getHeaders()
    }
  })
  return response.data[0]
}

/**
 * @typedef {Object} PromptWavUpload
 * @property {string} path - The path of the uploaded WAV file.
 * @property {string} url - The URL of the uploaded WAV file.
 * @property {string} orig_name - The original name of the uploaded file.
 * @property {number} size - The size of the uploaded file in bytes.
 * @property {string} mime_type - The MIME type of the uploaded file.
 * @property {Object} meta - Metadata for the uploaded file.
 * @property {string} meta._type - The type of the metadata.
 */
/**
 * @typedef {Object} Parameters
 * @property {string} tts_text - The text to be converted to speech.
 * @property {string} mode_checkbox_group - The mode of the operation.
 * @property {string} sft_dropdown - The selected voice.
 * @property {string} prompt_text - The prompt text for the operation.
 * @property {PromptWavUpload} prompt_wav_upload - The details of the uploaded WAV file.
 * @property {null} prompt_wav_record - The recorded WAV file, if any.
 * @property {string} instruct_text - The instructional text.
 * @property {number} seed - The seed value for randomness.
 * @property {number} speed_factor - The speed factor for the operation.
 */
/**
 * @typedef {Object} Data
 * @property {string} path - The path of the file.
 * @property {string} url - The URL of the file.
 * @property {number|null} size - The size of the file in bytes, or null if not specified.
 * @property {string} orig_name - The original name of the file.
 * @property {string|null} mime_type - The MIME type of the file, or null if not specified.
 * @property {boolean} is_stream - Indicates whether the file is a stream.
 */

/**
 * @typedef {Object} Response
 * @property {string} type - The type of the response.
 * @property {string} time - The time the response was generated.
 * @property {Data[]} data - The array of data objects.
 * @property {string} endpoint - The API endpoint that generated the response.
 * @property {number} fn_index - The function index associated with the response.
 */
/**
 * 生成音频
 * @param {Object} data
 * @type {Parameters}
 * @returns {Response}
 */
export async function generateAudio(data) {
  const client = await Client.connect(Config.Config.API)
  return client.predict(
    "/generate_audio", data)
}

/**
 * 获取音频数据
 * @param {string} file
 * @param {boolean} base64
 * @returns
 */
export async function getAudio(file, base64 = false) {
  try {
    const url = `http://127.0.0.1:50000/file=${path.normalize(file)}`
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const audioBuffer = response.data
    return base64 ? audioBuffer.toString('base64') : audioBuffer
  } catch (error) {
    logger.error('Error fetching audio data:', error)
    return false
  }
}
