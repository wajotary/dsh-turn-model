# dsh-turn-model

在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）里，给**每一个已完成回合**标出「这一轮是哪个模型回答的」。

纯文本、一行、不占地方：不画图标、不加徽标、不改 DSH 源码、**不联网、不读环境变量、不写任何文件**。

Show which model answered each completed turn in DeepSeek Harness — a single plain-text line, no badge, no network access, no file writes.

## 效果

每个已完成回合的**操作行上方**会出现一行灰色小字：

```
模型：deepseek-v4.1-flash
```

- 鼠标悬停显示完整 `供应商/模型名`（如 `volcengine/deepseek-v4.1-flash`）。
- 该回合中途换过模型时，显示 `模型：A / B`（多路由用 ` / ` 连接）。
- **取不到模型归属时整行不渲染**（宁可不显示，也不显示错的）。
- 只对「已完成」回合渲染；正在进行的回合不显示。

## 安装

面板安装：**设置 → 插件**（或插件中心）里搜索 `dsh-turn-model`，安装后刷新页面。

命令行安装（`<profile>` 换成你的 profile 名，桌面端通常为 `desktop`）：

```sh
dsh plugin --profile desktop add dsh-turn-model
```

无需构建步骤：本包只有一个宿主空壳（`lib/index.js`）和一个浏览器半区（`lib/client.js`），后者是手写 ES 模块，由 dsh 的模块加载器直接装载。包内**没有任何运行时依赖**。

## 启用 / 停用 / 卸载

- **停用**：插件面板里的开关；等价做法是在 profile 的 `package.json` → `dsh.profile.bundles` 里去掉 `"dsh-turn-model"`。
- **卸载**：`dsh plugin --profile desktop remove dsh-turn-model`。

## 工作机制

| 项 | 说明 |
|---|---|
| 挂载位置 | dsh 客户端扩展座 `conversation.chat.turnTail`（已完成回合的特性行链，与费用/统计类插件同一处） |
| 数据来源 | 回合节点的 `data.tokenUsage.routes`，即 dsh 自己为该回合记录的 `{ provider, model }` 归属 |
| 宿主半区 | 只有一个空 `apply()`，作用是让本包在 profile 里有一个可装载的条目 |
| 渲染 | 走客户端的 `slots` 服务注册；不修改任何现有 DOM 结构 |

## 兼容性与已知限制（请务必读这一条）

- 实测版本：**dsh 0.2.0-rc.2**（桌面端 / web，Windows）。
- ⚠️ 本插件读取的是 **dsh 的内部结构**（`turn-tail` 节点的 `data.tokenUsage.routes` 与 `conversation.chat.turnTail` 这一扩展座），不是公开稳定 API。**dsh 升级后它可能静默失效** —— 症状是那一行不再出现、且**不会报错**。若出现这种情况，请提 issue（附 dsh 版本号）。
- 本包**未声明** `@deepseek-ai/dsh*` 的 `peerDependencies`，因此不会触发宿主的版本门控：任何 dsh 版本都能装上，但只有实测版本保证效果。
- 本包不提供任何宿主服务、不注册工具、不注入提示词；关掉它只是少一行字，没有副作用。

## 隐私

浏览器半区只读取当前会话在内存中的 Chat 快照，**不做任何网络请求**（`dshhub.permissions.network` 为空数组），不读环境变量或凭据，不写磁盘。

## 开发

```
package.json        清单：dsh.bundle.patch / dsh.client.platform / dshhub 元数据
cordis.patch.yml    本 bundle 的补丁层：把 turn-model 这一行挂到 loader 树上
lib/index.js        宿主半区（空壳）
lib/client.js       浏览器半区（手写 JS，无需 esbuild/tsdown）
locale/zh.json      面板里的名称与介绍（中文）
locale/en.json      面板里的名称与介绍（英文，兜底）
icon.svg            面板图标
```

本地调试：把本目录当作包安装到你的 profile（`dsh plugin --profile <profile> add <本目录>`），改 `lib/client.js` 后刷新页面即可；若改动不生效，重启一次 dsh。

## License

[MIT](LICENSE)

---

## English

**dsh-turn-model** adds one plain-text line above the action row of every **completed turn**, showing which model actually answered that turn.

- Row: `模型：deepseek-v4.1-flash` (the label stays Chinese in this release); hover shows `provider/model`.
- Turns that switched models render `模型：A / B`.
- Renders only for completed turns, and **renders nothing** if the model attribution is unavailable.
- No badge, no icon, no network access, no file writes, no DSH source changes.

Install (GUI): **Settings → Plugins** → search `dsh-turn-model`. Install (CLI):

```sh
dsh plugin --profile desktop add dsh-turn-model
```

Disable via the plugin panel's switch, or by removing `"dsh-turn-model"` from `dsh.profile.bundles` in the profile's `package.json`. Uninstall with `dsh plugin --profile desktop remove dsh-turn-model`.

**Caveat:** the plugin reads an internal dsh structure (`data.tokenUsage.routes` on the turn-tail node plus the `conversation.chat.turnTail` slot). Tested on dsh **0.2.0-rc.2**; a dsh upgrade may break it **silently** (the line simply stops appearing, with no error). Issues with your dsh version are welcome.
