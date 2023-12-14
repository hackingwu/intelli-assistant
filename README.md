# intellij-assistant

## 项目简介

你的智能私人助理，从文本，图片，文件中 识别并创建日程信息，让你不漏掉任务重要事项。
背景：我妻子是一名律师，当他收到法院开庭传票或未来计划性的事情，往往是在桌面的日历本上手写下日程。还有几次因为忘了日程，差点耽误大事的经历。于是我想开发个小程序帮他去识别一些传票（短信，图片，PDF)，在手机上创建日程，提前提醒。

他需要一个OCR识别图片和PDF，我选用了百度智能云，因为他有足够多的免费额度。

还需要一个识别日程的功能，chatgpt做的很好，具有语义理解，时间推理（例如明天下午），地点人物等实体识别（识别日程地点）和关键信息提取（日程名称）。选用Azure Openai，国内使用起来最方便。

客户端选择微信小程序，用户使用成本最小，也支持添加系统日历的功能。

## server

spring-boot + h2数据库

src/main/resource/application.properties 把对应的项值填充了

mvn clean install 就可以生成一个可执行的jar包，很简单。在前面放一个nginx，绑定域名既可以上线。

[x] 用户管理（新建，查询，邀请评价）

[x]日程管理（新建，删除，列表查询）

[x]统计（用户操作分析）



## weapp

用微信开发者 打开该目录即可

app.js中的API_KEY，ADMIN_HOST按照你的实际情况填写好。 APK_KEY对应就是服务端项目的application.properties的server.api.key的值

[x]从文本，图片，PDF识别日程，修改并创建

[x]我的日程（列表，删除，再次创建）

[ ]分享日程

[ ]交互优化

# 试用

<img style="height: 200px;" src="imgs/public.png" alt="QR Code">
