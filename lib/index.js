/**
 * dsh-turn-model — host half.
 *
 * 本插件不注册任何宿主服务：逐轮模型归属由 DSH 客户端自己算好并挂在
 * conversation.chat.turnTail 节点上，浏览器半区（./client）直接读取并渲染。
 * 这里只提供一个合法的 cordis 插件外壳，让 profile 的行能挂起来。
 */

/** Stable cordis plugin name. */
export const name = 'turn-model'

/** No host services required. */
export const inject = []

/** Mount nothing; the browser half owns the row. */
export function apply() {}
