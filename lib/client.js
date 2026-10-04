// dsh-turn-model — browser half.
//
// 渲染位置：conversation.chat.turnTail（已完成回合的操作行之前的特性行链），
// 也就是 dsh-cost-meter「本轮费用」和 dsh-mnemon「本会话记忆」所在的同一处。
//
// 数据来源不需要宿主半区：DSH 的 Chat 本身就把每个已结算回合的
// provider/model 归属折进了 turn-tail 节点的 data.tokenUsage.routes
// （类型：TurnTokenUsageRoute = { provider, model }，见 ui-chat 契约）。
// 该节点同时也供轮次 token 用量面板显示「模型」一行使用。
//
// 这里只做一件事：用会话标准钩子 useChat 选到本回合的 turn-tail 节点，
// 取出 routes，渲染一行模型名。取不到就整行不渲染。
//
// 手写格式与插件自带的 client 半区一致：window.__ModuleLoader__.load
// 的 factory(require) 返回模块导出对象（apply/inject）。
window.__ModuleLoader__.load({
  id: 'dsh-turn-model',
  factory: (require) => {
    const React = require('react')

    /** Diagnostics / module identity. */
    const NAME = 'turn-model'
    /** Locale-free copy: this row is intentionally tiny and reads in Chinese. */
    const PREFIX = '模型：'

    const CSS = [
      '.tm-root{display:flex;align-items:center;justify-content:center;gap:0;',
      'width:100%;min-width:0;padding:0 8px;font-size:12px;line-height:20px;',
      'color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;',
      'text-overflow:ellipsis}',
      '.tm-model{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;',
      'overflow:hidden;text-overflow:ellipsis}',
    ].join('')

    const CSS_TAG_ID = 'dsh-turn-model/turn-model.css'

    /** Install the row stylesheet once per document (same pattern as shipped plugins). */
    function ensureStyles() {
      if (typeof document === 'undefined') return
      if (document.querySelector('style[data-plugin-css=' + JSON.stringify(CSS_TAG_ID) + ']') !== null) return
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-turn-model'
      tag.dataset.pluginCss = CSS_TAG_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    /** The turn number carried by a conversation TurnLocation. */
    function turnNumberOf(turn) {
      const value = turn === null || turn === undefined ? undefined : turn.turn
      return typeof value === 'number' ? value : undefined
    }

    /** Is this turn already closed (only closed turns own a turn-tail node)? */
    function isClosedTurn(turn) {
      return turn !== null && turn !== undefined && turn.status === 'closed'
    }

    /**
     * The provider/model routes recorded for one Turn, as display text.
     * Reads the turn's hidden-or-visible turn-tail node through the live Chat snapshot.
     */
    function routesOf(snapshot, turnNumber) {
      if (snapshot === null || snapshot === undefined || turnNumber === undefined) return ''
      const locations = snapshot.locations
      const nodes = snapshot.nodes
      if (locations === null || locations === undefined || nodes === null || nodes === undefined) return ''
      let keys
      try {
        keys = locations.getTurn(turnNumber)
      } catch {
        return ''
      }
      if (!Array.isArray(keys)) return ''
      for (const key of keys) {
        let node
        try {
          node = nodes.get(key)
        } catch {
          continue
        }
        if (node === null || node === undefined || node.kind !== 'turn-tail') continue
        const data = node.data
        const usage = data === null || data === undefined ? undefined : data.tokenUsage
        const routes = usage === null || usage === undefined ? undefined : usage.routes
        if (Array.isArray(routes) && routes.length > 0) {
          return routes
            .map((route) => (route === null || route === undefined ? '' : String(route.model ?? '')))
            .filter((model) => model !== '')
            .join(' / ')
        }
      }
      return ''
    }

    /** Full `provider/model` list for the tooltip. */
    function routeDetailsOf(snapshot, turnNumber) {
      if (snapshot === null || snapshot === undefined || turnNumber === undefined) return ''
      const locations = snapshot.locations
      const nodes = snapshot.nodes
      if (locations === null || locations === undefined || nodes === null || nodes === undefined) return ''
      let keys
      try {
        keys = locations.getTurn(turnNumber)
      } catch {
        return ''
      }
      if (!Array.isArray(keys)) return ''
      for (const key of keys) {
        let node
        try {
          node = nodes.get(key)
        } catch {
          continue
        }
        if (node === null || node === undefined || node.kind !== 'turn-tail') continue
        const usage = node.data === null || node.data === undefined ? undefined : node.data.tokenUsage
        const routes = usage === null || usage === undefined ? undefined : usage.routes
        if (Array.isArray(routes) && routes.length > 0) {
          return routes
            .map((route) => (route === null || route === undefined ? '' : `${String(route.provider ?? '')}/${String(route.model ?? '')}`))
            .join('\n')
        }
      }
      return ''
    }

    /** One entry in the completed-Turn feature chain. */
    function TurnModelRow(props) {
      const { turn, useChat } = props
      const number = turnNumberOf(turn)
      const closed = isClosedTurn(turn)
      const model = typeof useChat === 'function' && number !== undefined && closed ? useChat((snapshot) => routesOf(snapshot, number)) : ''
      const details = typeof useChat === 'function' && number !== undefined && closed ? useChat((snapshot) => routeDetailsOf(snapshot, number)) : ''
      if (model === '') return null
      return React.createElement(
        'div',
        {
          className: 'tm-root',
          'data-turn-model': number,
          ...(details === '' ? {} : { title: details }),
        },
        React.createElement('span', { className: 'tm-prefix' }, PREFIX),
        React.createElement('span', { className: 'tm-model' }, model),
      )
    }

    /** Client plugin services. */
    const inject = ['slots']

    /** Contribute the row into the Chat completed-Turn chain. */
    function apply(ctx) {
      ensureStyles()
      ctx.effect(
        () =>
          ctx.slots.inject('conversation.chat.turnTail', () =>
            ctx.slots.register(
              {
                name: 'conversation.chat.turnTail',
                id: 'dsh-turn-model/turn-tail',
                order: 5,
                registrant: 'dsh-turn-model',
              },
              TurnModelRow,
            ),
          ),
        'dsh-turn-model: turn-tail model row',
      )
    }

    return { name: NAME, inject, apply }
  },
})
