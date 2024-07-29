# karin parrot

使用CosyVoice模仿语音进行学舌的插件

## 安装

### 安装插件

karin根目录执行以下命令安装Karin parrot插件
```bash
git clone https://github.com/HalcyonAlcedo/karin-plugin-parrot.git ./plugins/karin-plugin-parrot
```
安装依赖
```bash
pnpm install --filter=karin-plugin-parrot
```

### 安装CosyVoice
请参考[CosyVoice](https://github.com/FunAudioLLM/CosyVoice)官方安装方法

### 安装SenseVoice
请参考[SenseVoice](https://github.com/FunAudioLLM/SenseVoice)官方安装方法

### 安装KarinSupport
> KarinSupport用于提供skil转码功能，默认使用本地转码可不安装此功能，如果本地转码无法正常运行，可尝试使用KarinSupport

KarinSupport目前提供docker安装方法

你可以从docker hub或aliyun下载镜像进行部署

docker hub
```bash
docker pull zyc404/karin-support:latest
```
aliyun
```bash
docker pull registry.cn-beijing.aliyuncs.com/alcedo/karin-support:latest
```

下载完成后运行镜像到容器即可
```bash
docker run -d -p 7005:7005 [镜像ID]
```
## 配置
推荐使用manage插件进行配置

CosyVoice地址(API)：输入CosyVoice的访问地址，如果按照官方安装流程进行的安装并运行，可以在命令行中看到```Running on local URL:  http://127.0.0.1:50000```字样，此时配置项填写http://127.0.0.1:50000

SenseVoice地址(Sense)：输入SenseVoice的访问地址，如果按照官方安装流程进行的安装并运行，可以在命令行中看到```Running on local URL:  http://127.0.0.1:7860```字样，此时配置项填写http://127.0.0.1:7860

KarinSupport地址(Support)：输入Support的主页地址，假如你部署在本地7005端口，此时配置项填写http://127.0.0.1:7005/

## 使用

对需要学习的音频消息进行引用，然后然后输入``` #学舌 音频的文字内容 ```进行学习，如果配置了SenseVoice则只需要输入``` #学舌```即可

学习后可以输入``` :内容 ```模仿学习的音频发送内容，注意冒号是英文冒号
