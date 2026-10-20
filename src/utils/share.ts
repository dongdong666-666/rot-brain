import { DISCLAIMER } from '../data/advice'
import { TOTAL_MAX } from '../data/tiers'
import type { TestResult } from './scoring'

/** 中文字体栈，DOM 与 Canvas 共用，保证导出图片里中文正常 */
const CJK_FONT =
  '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Noto Sans SC", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif'

/** 生成可复制的结果摘要文案 */
export function buildSummary(result: TestResult): string {
  const { tier, total, progress, topDimensions, hasTie, dimensions } = result

  const topText = topDimensions
    .map((d) => `${d.icon} ${d.name} ${d.score}/12`)
    .join(hasTie ? '、' : ' + ')

  const dimLines = dimensions.map((d) => `${d.icon} ${d.name}：${d.score} / 12`).join('\n')

  return [
    '🧠 我的脑腐指数测试结果',
    '',
    `段位：${tier.icon} ${tier.name}（第 ${tier.level} / 8 档）`,
    `总分：${total} / ${TOTAL_MAX}`,
    `脑腐进度：${progress}%`,
    `${dimensions.every(d => d.score === dimensions[0].score) ? '五个维度得分一致' : hasTie ? '得分靠前的维度（含同分）' : '得分靠前的维度'}：${topText}`,
    '',
    '五维得分：',
    dimLines,
    '',
    `一句评语：${tier.tagline}`,
    '',
    '—— 脑腐指数测试 · 仅供娱乐与自我观察',
    DISCLAIMER,
  ].join('\n')
}

/**
 * 复制文本到剪贴板。
 * 优先使用 Clipboard API，失败时回退到 textarea + execCommand。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 继续走回退方案 */
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/** 手动换行，兼容所有浏览器（measureText 按字符宽度累加） */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  let current = ''
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(current)
      current = ''
      continue
    }
    const test = current + ch
    if (ctx.measureText(test).width > maxWidth && current !== '') {
      lines.push(current)
      current = ch
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawGradientBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  percent: number,
  color1: string,
  color2: string,
): void {
  // 轨道
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()

  // 进度
  if (percent <= 0) return
  const fillW = Math.max(h, (w * Math.max(0, Math.min(100, percent))) / 100)
  const grad = ctx.createLinearGradient(x, y, x + fillW, y)
  grad.addColorStop(0, color1)
  grad.addColorStop(1, color2)
  ctx.fillStyle = grad
  roundRect(ctx, x, y, fillW, h, h / 2)
  ctx.fill()
}

const CARD_W = 750
const PADDING = 48

/**
 * 把结果卡片绘制到 canvas 并导出为 PNG。
 * 使用系统字体渲染中文，不依赖 html2canvas，保证中文、背景与排版正常。
 */
export async function renderResultImage(result: TestResult): Promise<string> {
  const { tier, total, progress, dimensions, topDimensions, hasTie, advice } = result

  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const scale = dpr

  // 先用临时上下文估算高度
  const measureCanvas = document.createElement('canvas')
  const mctx = measureCanvas.getContext('2d')!

  const contentW = CARD_W - PADDING * 2
  let contentH = 0

  // 固定区块高度预估
  contentH += 46 // 顶部小标题
  contentH += 132 // 段位图标 + 名称
  contentH += 44 // 英文副标题
  contentH += 56 // 评语
  contentH += 120 // 总分条
  contentH += 40 // 脑腐进度标题
  contentH += 60 // 脑腐进度条
  contentH += 40 // 五维标题
  contentH += dimensions.length * 62 // 五个维度行
  mctx.font = `500 26px ${CJK_FONT}`
  const topLabel = dimensions.every(d => d.score === dimensions[0].score) ? '五个维度得分一致' : hasTie ? '得分靠前的维度（含同分）' : '得分靠前的维度'
  const topText = topDimensions.map(d => d.icon + ' ' + d.name).join(hasTie ? '、' : ' + ')
  const topLines = wrapText(mctx, topLabel + '：' + topText, contentW)
  contentH += topLines.length * 38 + 18

  // 建议文本需要真实测量
  mctx.font = `28px ${CJK_FONT}`
  let adviceH = 0
  const adviceLines: string[][] = []
  advice.forEach((line) => {
    const wrapped = wrapText(mctx, `· ${line}`, contentW - 40)
    adviceLines.push(wrapped)
    adviceH += wrapped.length * 42 + 12
  })
  contentH += 56 + adviceH

  // 描述文本测量
  mctx.font = `26px ${CJK_FONT}`
  const descLines = wrapText(mctx, tier.description, contentW - 40)
  contentH += 20 + descLines.length * 40

  contentH += 70 // 页脚免责声明
  contentH += 40 // 顶部留白

  const CARD_H = Math.round(contentH + PADDING * 2)

  canvas.width = CARD_W * scale
  canvas.height = CARD_H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.textBaseline = 'top'

  // ---------- 背景 ----------
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  bg.addColorStop(0, '#130b2a')
  bg.addColorStop(0.55, '#1a0f38')
  bg.addColorStop(1, '#0d0a1f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // 背景光斑
  const glow = ctx.createRadialGradient(CARD_W * 0.82, 90, 10, CARD_W * 0.82, 90, 340)
  glow.addColorStop(0, hexToRgba(tier.color, 0.38))
  glow.addColorStop(1, hexToRgba(tier.color, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow2 = ctx.createRadialGradient(60, CARD_H * 0.72, 10, 60, CARD_H * 0.72, 300)
  glow2.addColorStop(0, 'rgba(124,58,237,0.30)')
  glow2.addColorStop(1, 'rgba(124,58,237,0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  let y = PADDING

  // ---------- 顶部标题 ----------
  ctx.font = `600 26px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('脑腐指数测试 · Brain Rot Index', PADDING, y)
  y += 46

  // ---------- 段位图标 ----------
  ctx.font = '64px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.fillText(tier.icon, PADDING, y)
  ctx.font = `600 30px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText(`第 ${tier.level} / 8 段位`, PADDING + 88, y + 6)
  ctx.font = `700 44px ${CJK_FONT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(tier.name, PADDING + 88, y + 44)
  y += 124

  // ---------- 英文副标题 ----------
  ctx.font = `400 22px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText(tier.enName, PADDING, y)
  y += 44

  // ---------- 评语 ----------
  ctx.font = `600 30px ${CJK_FONT}`
  ctx.fillStyle = tier.color
  ctx.fillText(`「${tier.tagline}」`, PADDING, y)
  y += 56

  // ---------- 总分条 ----------
  const totalCardH = 104
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, PADDING, y, contentW, totalCardH, 22)
  ctx.fill()
  ctx.strokeStyle = hexToRgba(tier.color, 0.35)
  ctx.lineWidth = 1.5
  roundRect(ctx, PADDING, y, contentW, totalCardH, 22)
  ctx.stroke()

  // 左侧：总分
  ctx.font = `500 22px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('总分', PADDING + 28, y + 20)
  ctx.font = `700 44px ${CJK_FONT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${total}`, PADDING + 28, y + 44)
  const totalW = ctx.measureText(`${total}`).width
  ctx.font = `400 24px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText(`/ ${TOTAL_MAX}`, PADDING + 36 + totalW, y + 62)

  // 右侧：脑腐进度
  ctx.textAlign = 'right'
  ctx.font = `500 22px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('脑腐进度', PADDING + contentW - 28, y + 20)
  ctx.font = `700 40px ${CJK_FONT}`
  ctx.fillStyle = tier.color
  ctx.fillText(`${progress}%`, PADDING + contentW - 28, y + 46)
  ctx.textAlign = 'left'
  y += totalCardH + 24

  // ---------- 脑腐进度条 ----------
  drawGradientBar(ctx, PADDING, y, contentW, 20, progress, tier.color, tier.color2)
  y += 52

  // ---------- 五维得分 ----------
  ctx.font = `600 26px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('五维得分', PADDING, y)
  y += 40

  dimensions.forEach((d) => {
    ctx.font = '26px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    ctx.fillText(d.icon, PADDING, y - 4)
    ctx.font = `500 26px ${CJK_FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(d.name, PADDING + 38, y)

    ctx.textAlign = 'right'
    ctx.font = `700 26px ${CJK_FONT}`
    ctx.fillStyle = d.color
    ctx.fillText(`${d.score}`, PADDING + contentW - 44, y)
    ctx.font = `400 22px ${CJK_FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText('/12', PADDING + contentW, y + 4)
    ctx.textAlign = 'left'

    const barY = y + 36
    drawGradientBar(ctx, PADDING, barY, contentW, 12, d.percent, d.color, d.color2)
    y += 62
  })

  // ---------- 突出维度 ----------
  ctx.font = `500 26px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  topLines.forEach((line, i) => {
    ctx.fillText(line, PADDING, y + i * 38)
  })
  y += topLines.length * 38 + 18

  // ---------- 段位描述 ----------
  ctx.font = `400 26px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.68)'
  descLines.forEach((line, i) => {
    ctx.fillText(line, PADDING + 20, y + i * 40)
  })
  y += descLines.length * 40 + 20

  // ---------- 建议 ----------
  ctx.font = `600 26px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('🧾 脑腐处方笺', PADDING, y)
  y += 46

  ctx.font = `400 28px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  adviceLines.forEach((lines) => {
    lines.forEach((line, i) => {
      ctx.fillText(line, PADDING + 8, y + i * 42)
    })
    y += lines.length * 42 + 12
  })

  // ---------- 页脚 ----------
  const footY = CARD_H - PADDING - 34
  ctx.font = `400 20px ${CJK_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  ctx.fillText('脑腐指数测试 · 仅供娱乐和自我观察，不是医学诊断。', PADDING, footY)

  return canvas.toDataURL('image/png')
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 触发浏览器下载（桌面端） */
export function downloadDataUrl(dataUrl: string, filename: string): boolean {
  try {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  } catch {
    return false
  }
}

/** 是否支持通过 <a download> 直接保存（移动端浏览器通常为 false） */
export function canAutoDownload(): boolean {
  const a = document.createElement('a')
  const supported = 'download' in a
  const ua = navigator.userAgent
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  return supported && !isMobile
}
