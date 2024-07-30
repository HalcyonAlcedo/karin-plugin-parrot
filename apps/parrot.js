import { uploadPrompt, generateAudio, getAudio } from "../lib/CosyVoice/index.js"
import { modelInference } from "../lib/SenseVoice/index.js"
import karin, { YamlEditor, segment } from 'node-karin'
import { getRecord } from "../lib/common/index.js"
import { Config, basename } from '#template'
import crypto from 'crypto'
import fs from 'fs'

export const study = karin.command(/^#学舌/, async (e) => {
  const msg = e.msg.replace(/^#学舌/, '')
  if (e.reply_id) {
    const record = await getRecord(e)
    if (record) {
      // 生成数据文件
      const cfgName = crypto.createHash('md5').update(Config.Config.API).digest('hex')
      if (!fs.existsSync(`./data/${basename}/${cfgName}.yaml`)) {
        fs.writeFileSync(`./data/${basename}/${cfgName}.yaml`, 'config:\n  record:', 'utf8')
      }
      const yamlEditor = new YamlEditor(`./data/${basename}/${cfgName}.yaml`)
      // 如果存在数据则直接切换
      if (yamlEditor.has(`files.${record.name}`)) {
        if (yamlEditor.has('config.record')) {
          yamlEditor.set('config.record', record.name)
        } else {
          yamlEditor.add('config.record', record.name)
        }
        yamlEditor.save()
        return e.reply(`啾啾，${JSON.parse(yamlEditor.get(`files.${record.name}`)).uesr || '不知道是谁'}的声音，已经学会啦~`)
      }
      // 获取音频内容
      let prompt
      if (msg) {
        prompt = msg
      } else {
        prompt = (await modelInference(record.buffer, record.name)).data[0]
      }
      if (prompt) {
        // 上传数据
        const file = await uploadPrompt(record.buffer, record.name)
        // 写入prompt数据
        yamlEditor.add(`files.${record.name}`, JSON.stringify({
          path: file,
          name: record.name,
          size: record.size,
          prompt: prompt,
          user: record.user
        }))
        // 设置prompt目标
        if (yamlEditor.has('config.record')) {
          yamlEditor.set('config.record', record.name)
        } else {
          yamlEditor.add('config.record', record.name)
        }
        // 保存配置
        yamlEditor.save()
        return e.reply(`啾啾，${record.user}的声音，已经学会啦~`)
      } else {
        return e.reply(`啾啾，听不懂~`)
      }
    }
  }
  return e.reply(`啾啾，没啥可学的~`)
})

export const recurrent = karin.command(/^:/, async (e) => {
  const msg = e.msg.replace(/^:/, '')
  const cfgName = crypto.createHash('md5').update(Config.Config.API).digest('hex')
  // 如果没有配置则直接跳出
  if (!fs.existsSync(`./data/${basename}/${cfgName}.yaml`)) {
    return
  }
  // 获取配置数据
  const yamlEditor = new YamlEditor(`./data/${basename}/${cfgName}.yaml`)
  const record = JSON.parse(yamlEditor.get(`files.${yamlEditor.get('config.record')}`))
  // 生成音频
  try {
    const result = await generateAudio({
      tts_text: msg,
      mode_checkbox_group: "3s极速复刻",
      sft_dropdown: "中文女",
      prompt_text: record.prompt,
      prompt_wav_upload: {
        path: record.path,
        url: `${Config.Config.API.endsWith('/') ? Config.Config.API : Config.Config.API + '/'}file=${record.path}`,
        orig_name: record.name,
        size: record.size,
        mime_type: "audio/wav",
        meta: { _type: "gradio.FileData" }
      },
      prompt_wav_record: null,
      instruct_text: "",
      seed: 0,
      speed_factor: 1,
    })
    // 获取音频数据
    const audio = await getAudio(result.data[0].path, true)
    // 发送音频
    if (await e.bot.SendApi('can_send_record')) {
      e.reply(segment.record(`base64://${audio}`))
    } else {
      e.reply('诶~发不出来啊！')
    }
  } catch (error) {
    // 音频接口失效
    e.reply('音频样本失效！')
  }

})
