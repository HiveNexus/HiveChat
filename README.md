<div align="center">
   <img width="32" height="32" src="https://jiantuku.oss-cn-beijing.aliyuncs.com/share/logo.png" />
   <img height="32" alt="HiveChat" src="https://jiantuku.oss-cn-beijing.aliyuncs.com/share/hivechat.png" />
   <p>中文 ｜ <a href="https://github.com/HiveNexus/HiveChat/blob/main/README_EN.md">English</a><p>
   <p>专为中小团队设计的 AI 聊天应用，支持 Deepseek、Open AI、Claude、Gemini 等模型。</p>
</div>

## 1. 功能概览

管理员一人配置，全团队轻松使用各种 AI 模型。

* 支持配置邮箱登录或企业微信、钉钉、飞书登录
* LaTeX 和 Markdown 渲染
* DeepSeek 思维链展示
* 图像理解
* AI 智能体
* 云端数据存储
* 支持的大模型服务商：
    * Open AI
    * Claude
    * Gemini
    * DeepSeek
    * Moonshot(月之暗面)
    * 火山方舟（豆包）
    * 阿里百炼（千问）
    * 百度千帆
    * 腾讯混元
    * 智谱
    * Open Router
    * Grok
    * Ollama
    * 硅基流动
 * 同时支持自定义添加任意 Open AI 风格的服务商

### 普通用户端
登录账号，即可对话。

![image](https://jiantuku.oss-cn-beijing.aliyuncs.com/share/003.png)

### 管理后台
* 管理员配置 AI 大模型服务商
* 可手动添加用户，也可开启或关闭账号注册，适用于公司/学校/组织等小型团队
* 查看和管理全部用户

![image](https://jiantuku.oss-cn-beijing.aliyuncs.com/share/001.png)

<details>
  <summary>更多图片</summary>
   用户管理
   <img src="https://jiantuku.oss-cn-beijing.aliyuncs.com/share/002.png" />
   开启或关闭用户注册
   <img src="https://jiantuku.oss-cn-beijing.aliyuncs.com/share/004.png" />
</details>

## 2. 在线演示

注：以下为演示站，数据随时会被清空

* 用户端：https://chat.yotuku.cn/
    * 可自行注册账号体验
* 管理员端：https://hivechat-demo.vercel.app/
    * Email: admin@demo.com
    * Password: helloHivechat

## 3. 技术栈

* Next.js
* Tailwindcss
* Auth.js
* PostgreSQL
* Drizzle ORM
* Ant Design

## 4. 安装和部署
### 方法 1：本地部署

>注意：
>旧版本升级到 2025 年 2 月 22 日更新的版本，需要重新手动执行 `npm run initdb`, 部分数据库结构进行了更新

1. 克隆本项目到本地
```
git clone https://github.com/HiveNexus/hivechat.git
```

2. 安装依赖库

```shell
cd hivechat
npm install
```

3. 修改本地配置文件

将样例文件复制到 `.env`
```shell
cp .env.example .env
```

修改 .env 文件

```env
# PostgreSQL 数据库连接 URL，此处为示例，需本地安装或连接远程 PostgreSQL
# 注意，本地安装暂不支持使用 Vercel 或 Neon 提供的 Serverless PostgreSQL
DATABASE_URL=postgres://postgres:password@localhost/hivechat

#用于用户信息等敏感信息的加密，可以使用 openssl rand -base64 32 生成一个随机的 32 位字符串作为密钥，此处为示例，请替换为自己生成的值。
AUTH_SECRET=hclqD3nBpMphLevxGWsUnGU6BaEa2TjrCQ77weOVpPg=

# 管理员授权码，初始化后，凭此值设置管理员账号，此处为示例，请替换为自己生成的值。
ADMIN_CODE=22113344

# 生产环境设置为正式域名，开启飞书等第三方登录时回调时会使用
NEXTAUTH_URL=http://127.0.0.1:3000

是否开启邮箱登录，开启值设为 ON，关闭时修改为 OFF，未设置时默认开启
EMAIL_AUTH_STATUS=ON

# 是否开启飞书登录，开启值设为 ON，关闭时修改为 OFF，详细说明见底部附2
FEISHU_AUTH_STATUS=OFF
FEISHU_CLIENT_ID="cli_xxxxxxxxxxxxxxxx"
FEISHU_CLIENT_SECRET="xxxxxxxxHOEWIoE7eDc1Lhc0042OXXXX"

# 是否开启企业微信登录，开启值设为 ON，关闭时修改为 OFF
WECOM_AUTH_STATUS=OFF
WECOM_CLIENT_ID="ww728c371c2fXXXXXX"
WECOM_AGENT_ID="100XXXX"
WECOM_CLIENT_SECRET="H-7J4jzG0m1axpXLGshaCDlMOZxdjvkX6bIVLuXXXXXX"

# 是否开启钉钉登录，开启值设为 ON，关闭时修改为 OFF
DINGDING_AUTH_STATUS=OFF
DINGDING_CLIENT_ID="dingpcfi2kpuplXXXXXX"
DINGDING_CLIENT_SECRET="3vk9-VFCExNckqNUk_CL2F-HEgz7qGN-BimH0lZ1gUx6hWO7g_an2lnkk6XXXXXX"
```

4. 初始化数据库
```shell
npm run initdb
```
5. 启动程序

```
//测试开发
npm run dev
//正式启动
npm run build
npm run start  
```
6. 初始化管理员账号

访问 `http://localhost:3000/setup` (实际使用的域名和端口号)，即可进入管理员账号设置页面，设置完成后，即可正常使用系统。

### 方法 2：Docker 部署
1. 克隆本项目到本地
```
git clone https://github.com/HiveNexus/hivechat.git
```

2. 修改本地配置文件

将样例文件复制到 `.env`
```shell
cp .env.example .env
```
根据实际情况如下的配置项
修改 `AUTH_SECRET` 和 `ADMIN_CODE`，正式环境务必重新设置，测试用途时可不修改。
修改 .env 文件

```env
# PostgreSQL 数据库连接 URL，Docker 部署时可留空
DATABASE_URL=

#用于用户信息等敏感信息的加密，可以使用 openssl rand -base64 32 生成一个随机的 32 位字符串作为密钥，此处为示例，请替换为自己生成的值，测试用途时可不修改。
AUTH_SECRET=hclqD3nBpMphLevxGWsUnGU6BaEa2TjrCQ77weOVpPg=

# 管理员授权码，初始化后，凭此值设置管理员账号，此处为示例，请替换为自己生成的值。
ADMIN_CODE=22113344

# 生产环境设置为正式域名，开启飞书等第三方登录时回调时会使用
NEXTAUTH_URL=http://127.0.0.1:3000

# 是否开启邮箱登录，开启值设为 ON，关闭时修改为 OFF，未设置时默认开启
EMAIL_AUTH_STATUS=ON

# 是否开启飞书登录，开启值设为 ON，关闭时修改为 OFF，详细说明见底部附2
FEISHU_AUTH_STATUS=OFF
FEISHU_CLIENT_ID="cli_xxxxxxxxxxxxxxxx"
FEISHU_CLIENT_SECRET="xxxxxxxxHOEWIoE7eDc1Lhc0042OXXXX"

# 是否开启企业微信登录，开启值设为 ON，关闭时修改为 OFF
WECOM_AUTH_STATUS=OFF
WECOM_CLIENT_ID="ww728c371c2fXXXXXX"
WECOM_AGENT_ID="100XXXX"
WECOM_CLIENT_SECRET="H-7J4jzG0m1axpXLGshaCDlMOZxdjvkX6bIVLuXXXXXX"

# 是否开启钉钉登录，开启值设为 ON，关闭时修改为 OFF
DINGDING_AUTH_STATUS=OFF
DINGDING_CLIENT_ID="dingpcfi2kpuplXXXXXX"
DINGDING_CLIENT_SECRET="3vk9-VFCExNckqNUk_CL2F-HEgz7qGN-BimH0lZ1gUx6hWO7g_an2lnkk6XXXXXX"
```

3. 启动容器
```   
docker compose up -d
```

4. 初始化管理员账号
   
访问 `http://localhost:3000/setup` (实际使用的域名和端口号)，即可进入管理员账号设置页面，设置完成后，即可正常使用系统。


### 方法 3：在 Vercel 上部署

>注意：
>旧版本升级到 2025 年 2 月 22 日更新的版本，请手动登入到 Vercel 数据库管理页面，将 `models` 表删除，然后重新部署。因为涉及到表结构的调整，脚本执行无法自动跳过，会导致部署卡住，全新部署不存在此问题。

点击下面的按钮，即可开始部署。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HiveNexus/hivechat.git&project-name=hivechat&env=DATABASE_URL&env=AUTH_SECRET&env=ADMIN_CODE&env=EMAIL_AUTH_STATUS&env=FEISHU_AUTH_STATUS&env=FEISHU_CLIENT_ID&env=FEISHU_CLIENT_SECRET)

默认将代码克隆的自己的 Github 后，需要填写环境变量：

<img width="726" alt="image" src="https://jiantuku.oss-cn-beijing.aliyuncs.com/share/vercel01.png" />

```
# PostgreSQL 数据库连接 URL，Vercel 平台提供了免费的托管服务，详情见下面说明
DATABASE_URL=postgres://postgres:password@localhost/hivechat

#用于用户信息等敏感信息的加密，可以使用 openssl rand -base64 32 生成一个随机的 32 位字符串作为密钥，此处为示例，请替换为自己生成的值。
AUTH_SECRET=hclqD3nBpMphLevxGWsUnGU6BaEa2TjrCQ77weOVpPg=

# 管理员授权码，初始化后，凭此值设置管理员账号，此处为示例，请替换为自己生成的值。
ADMIN_CODE=22113344

# 生产环境设置为正式域名，开启飞书等第三方登录时回调时会使用
# 首次可使用 `https://Vercel中的项目名.vercel.app`
NEXTAUTH_URL=https://hivechat-xxx.vercel.app

是否开启邮箱登录，开启值设为 ON，关闭时设为 OFF
EMAIL_AUTH_STATUS=ON

# 是否开启飞书登录，开启值设为 ON，关闭时修改为 OFF，详细说明见底部附2
FEISHU_AUTH_STATUS=OFF
FEISHU_CLIENT_ID="cli_xxxxxxxxxxxxxxxx"
FEISHU_CLIENT_SECRET="xxxxxxxxHOEWIoE7eDc1Lhc0042OXXXX"

# 是否开启企业微信登录，开启值设为 ON，关闭时修改为 OFF
WECOM_AUTH_STATUS=OFF
WECOM_CLIENT_ID="ww728c371c2fXXXXXX"
WECOM_AGENT_ID="100XXXX"
WECOM_CLIENT_SECRET="H-7J4jzG0m1axpXLGshaCDlMOZxdjvkX6bIVLuXXXXXX"

# 是否开启钉钉登录，开启值设为 ON，关闭时修改为 OFF
DINGDING_AUTH_STATUS=OFF
DINGDING_CLIENT_ID="dingpcfi2kpuplXXXXXX"
DINGDING_CLIENT_SECRET="3vk9-VFCExNckqNUk_CL2F-HEgz7qGN-BimH0lZ1gUx6hWO7g_an2lnkk6XXXXXX"
```
#### 附1：Vercel（Neon）PostgreSQL 配置

1. 在 Vercel 平台顶部导航，选择「Storage」标签，点击 Create Databse
2. 选择 Neon(Serverless Postgres)
<img width="400" alt="image" src="https://jiantuku.oss-cn-beijing.aliyuncs.com/share/vercel02.png" />

3. 按照指引完成创建后，复制此处 `DATABASE_URL` 的值，填入到上一步的 `DATABASE_URL` 中
<img width="800" alt="image" src="https://jiantuku.oss-cn-beijing.aliyuncs.com/share/vercel03.png" />

4. 初始化管理员账号

按照以上方法安装部署完成后，访问 `http://localhost:3000/setup` (实际使用的域名和端口号)，即可进入管理员账号设置页面，设置完成后，即可正常使用系统。

#### 附2：第三方登录配置说明
* [企业微信登录配置说明](https://k2swpw8zgf.feishu.cn/wiki/WBH5w6mcuiYui0kNhmecdxtqnac)
* [钉钉登录配置说明](https://k2swpw8zgf.feishu.cn/wiki/PcLVwBMcsiCm8Ikcp3pc7rVXn3f)
* [飞书登录配置说明](https://k2swpw8zgf.feishu.cn/wiki/Fr80wA8HHi7ZN7kxb6xcU1i7nae)