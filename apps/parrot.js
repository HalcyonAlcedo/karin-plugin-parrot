import karin, { YamlEditor, segment } from 'node-karin'
import { Config, basename } from '#template'
import { Client } from "@gradio/client"
import { getRecord, uploadPrompt } from "../lib/CosyVoice/index.js"
import fs from 'fs'

export const study = karin.command(/^#学舌/, async (e) => {
  const msg = e.msg.replace(/^#学舌/, '')
  if (e.reply_id) {
    const record = await getRecord(e)
    if (record) {
      // 生成数据文件
      if (!fs.existsSync(`./data/${basename}/list.yaml`)) {
        fs.writeFileSync(`./data/${basename}/list.yaml`, 'config:\n  record:', 'utf8')
      }
      const yamlEditor = new YamlEditor(`./data/${basename}/list.yaml`)
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
      // 上传数据
      const file = await uploadPrompt(record.buffer, record.name)
      const prompt = msg
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
    }
  }
  return e.reply(`啾啾，没啥可学的~`)
})

export const recurrent = karin.command(/^:/, async (e) => {
  const msg = e.msg.replace(/^:/, '')
  // 如果没有配置则直接跳出
  console.log(`./data/${basename}/list.yaml`)
  if (!fs.existsSync(`./data/${basename}/list.yaml`)) {
    return
  }
  // 获取配置数据
  const yamlEditor = new YamlEditor(`./data/${basename}/list.yaml`)
  const record = JSON.parse(yamlEditor.get(`files.${yamlEditor.get('config.record')}`))
  // 生成音频
  const client = await Client.connect(Config.Config.API)
  const result = await client.predict(
    "/generate_audio", {
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
  // 发送音频
  if (await e.bot.SendApi('can_send_record')) {
    e.reply(segment.record(`file://${result.data[0].path}`))
  } else {
    e.reply('诶~发不出来啊！')
  }
})
