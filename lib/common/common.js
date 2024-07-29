import { silk2wav } from './silk.js'
import { logger } from 'node-karin'
import { Config } from '#template'
import FormData from 'form-data'
import axios from 'axios'
import path from 'path'

/**
 * 获取消息中的音频数据并转换为wav格式
 * @param {KarinMessage} e - 消息对象
 * @returns {Object|boolean} - 获取成功时返回音频信息，失败时返回false
 * @property {Buffer} buffer - wav格式音频数据
 * @property {string} name - 文件名
 * @property {number} size - 数据大小
 * @property {string} user - 来源用户
 */
export async function getRecord(e) {
  // 获取引用消息
  const reply = await e.bot.GetMessage(e.contact, e.reply_id)
  // 获取音频
  const record = reply.elements?.find(item => item.type === 'record')
  if (record) {
    const file = record.file
    try {
      const recordFile = await e.bot.SendApi('get_record', { file })
      // 解码base64
      const buffer = Buffer.from(recordFile.base64, 'base64')
      let filename, data
      // 本地转码
      if (Config.Config.LocalTranscod) {
        const wavData = await silk2wav(buffer)
        if (wavData) {
          filename = `${path.basename(file, path.extname(file))}.wav`
          data = wavData
        } else return false
      } else {
        // 创建FormData对象
        const form = new FormData()
        form.append('file', buffer, file)
        // 发送文件到API
        const response = await axios.post(`${Config.Config.Support.endsWith('/') ? Config.Config.Support : Config.Config.Support + '/'}silk/decode`, form, {
          headers: {
            ...form.getHeaders()
          },
          responseType: 'arraybuffer'
        })
        const disposition = response.headers['content-disposition']
        filename = disposition ? disposition.match(/filename="(.+)"/)[1] : 'downloaded_file'
        data = response.data
      }

      return {
        buffer: data,
        name: filename || file,
        size: data.length,
        user: reply.sender.nick
      }
    } catch (error) {
      logger.error(error)
      return false
    }
  }
}
