import { Client } from "@gradio/client"
import { Config } from '#template'
import FormData from 'form-data'
import axios from 'axios'

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
 * 发送带解析音频到SenseVoice
 * @param {Buffer} buffer - 要发送给SenseVoice的文件数据
 * @param {string} file - 文件名
 * @returns {string} - 文件链接
 */
async function uploadPrompt(buffer, file) {
  const form = new FormData()
  form.append('files', buffer, file)
  const response = await axios.post(`${Config.Config.Sense.endsWith('/') ? Config.Config.Sense : Config.Config.Sense + '/'}upload?upload_id=${getRandomAlphaNumeric(10)}`, form, {
    headers: {
      ...form.getHeaders()
    }
  })
  return response.data[0]
}

/**
 * 生成音频
 * @param {Buffer} data - 音频数据
 * @param {string} file - 文件名
 * @returns {string} - 内容
 */
export async function modelInference(data, file) {
  const path = await uploadPrompt(data, file)
  const client = await Client.connect(Config.Config.Sense)
  return client.predict(
    "/model_inference", {
    input_wav: {
      path: path,
      url: `${Config.Config.Sense.endsWith('/') ? Config.Config.Sense : Config.Config.Sense + '/'}file=${path}`,
      orig_name: file,
      size: data.length,
      mime_type: "audio/wav",
      meta: { _type: "gradio.FileData" }
    },
    language: "auto",
  })
}
