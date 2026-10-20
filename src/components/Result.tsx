import { useCallback, useEffect, useRef, useState } from 'react'
import { ADVICE_NOTE, DISCLAIMER, DISCLAIMER_LONG } from '../data/advice'
import { TOTAL_MAX, TOTAL_MIN } from '../data/tiers'
import type { TestResult } from '../utils/scoring'
import {
  buildSummary,
  canAutoDownload,
  copyText,
  downloadDataUrl,
  renderResultImage,
} from '../utils/share'
import ShareModal from './ShareModal'
import CopyFallbackModal from './CopyFallbackModal'
import { getPortraitUrl } from '../utils/portraits'

interface ResultProps {
  result: TestResult
  onRetest: () => void
  onHome: () => void
  onOpenCodex: () => void
  notify: (message: string, kind?: 'success' | 'error' | 'info') => void
}

export default function Result({ result, onRetest, onHome, onOpenCodex, notify }: ResultProps) {
  const { tier, total, progress, dimensions, topDimensions, hasTie, advice } = result

  const [copied, setCopied] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [portraitFailed, setPortraitFailed] = useState(false)
  const [manualCopy, setManualCopy] = useState<{ title: string; hint: string } | null>(null)
  const barsRef = useRef<HTMLDivElement | null>(null)
  const copyButtonRef = useRef<HTMLButtonElement | null>(null)
  const shareButtonRef = useRef<HTMLButtonElement | null>(null)
  const manualCopyTriggerRef = useRef<HTMLElement | null>(null)

  // 进度条入场动画
  useEffect(() => {
    const t = window.setTimeout(() => setRevealed(true), 120)
    return () => window.clearTimeout(t)
  }, [])

  // 结果变化时重置分享图与复制状态，避免残留上一次的摘要
  useEffect(() => {
    setImageUrl('')
    setCopied(false)
    setPortraitFailed(false)
    setManualCopy(null)
  }, [result.createdAt])

  /** 打开手动复制窗口；摘要始终由当前 result 现场生成。 */
  const openManualCopy = useCallback(
    (title: string, hint: string, trigger: HTMLElement | null) => {
      manualCopyTriggerRef.current = trigger
      setManualCopy({ title, hint })
    },
    [],
  )

  const handleCopy = useCallback(async () => {
    const text = buildSummary(result)
    const ok = await copyText(text)
    if (ok) {
      setCopied(true)
      notify('结果摘要已复制到剪贴板', 'success')
      window.setTimeout(() => setCopied(false), 2400)
      return
    }
    notify('自动复制失败，已打开手动复制窗口', 'error')
    openManualCopy(
      '手动复制结果摘要',
      '自动复制没有成功。下面是本次完整的结果摘要，可以全选或长按后复制。',
      copyButtonRef.current,
    )
  }, [result, notify, openManualCopy])

  const ensureImage = useCallback(async (): Promise<string | null> => {
    if (imageUrl) return imageUrl
    setGenerating(true)
    try {
      const url = await renderResultImage(result)
      setImageUrl(url)
      return url
    } catch (err) {
      console.error('生成分享图失败：', err)
      notify('生成分享图失败，请稍后重试', 'error')
      return null
    } finally {
      setGenerating(false)
    }
  }, [imageUrl, result, notify])

  const handleSaveImage = useCallback(async () => {
    const url = await ensureImage()
    if (!url) return

    if (canAutoDownload()) {
      // 只能确认「发起了下载」，不能确认文件已落到用户的下载文件夹
      if (downloadDataUrl(url, `脑腐指数-${tier.name}-${total}分.png`)) {
        notify('已发起图片下载，请查看浏览器下载列表。', 'success')
        return
      }
      notify('浏览器没有触发下载，已打开预览，可长按图片保存', 'error')
      setModalOpen(true)
      return
    }

    // 移动端：弹出预览，提示长按保存
    setModalOpen(true)
    notify('已生成分享图，长按图片即可保存', 'success')
  }, [ensureImage, notify, tier.name, total])

  const handleShareLink = useCallback(async () => {
    const text = buildSummary(result)
    const shareData = {
      title: '我的脑腐指数测试结果',
      text,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        notify('已唤起系统分享', 'success')
        return
      }
    } catch (err) {
      // 用户取消分享时不算失败
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.warn('系统分享失败，回退到复制：', err)
    }
    const ok = await copyText(text)
    if (ok) {
      notify('当前环境不支持分享，已改为复制摘要', 'success')
      return
    }
    notify('分享和自动复制都失败了，已打开手动复制窗口', 'error')
    openManualCopy(
      '手动复制结果摘要',
      '系统分享和自动复制都没有成功。下面是本次完整的结果摘要，可以全选或长按后复制。',
      shareButtonRef.current,
    )
  }, [result, notify, openManualCopy])

  return (
    <div className="page page--result">
      {/* ---------- 段位卡片 ---------- */}
      <section
        className={`tier-card ${revealed ? 'tier-card--in' : ''}`}
        style={{
          // @ts-expect-error CSS 自定义属性
          '--tier-color': tier.color,
          '--tier-color2': tier.color2,
        }}
      >
        <div className="tier-card__glow" aria-hidden="true" />
        <p className="tier-card__eyebrow">Your Brain Rot Tier</p>

        <figure className="tier-card__portrait">
          {portraitFailed ? (
            <div className="tier-card__portrait-fallback" role="img" aria-label={tier.name + '段位图标'}>
              <span>{tier.icon}</span>
              <p>人物画像暂时无法显示</p>
            </div>
          ) : (
            <img key={tier.portrait} src={getPortraitUrl(tier)} width={768} height={768}
              alt={tier.name + '段位人物画像'} decoding="async" onError={() => setPortraitFailed(true)} />
          )}
        </figure>
        <p className="tier-card__portrait-credit">
          <a href="https://www.testwhat.com/brainrot-types.html" target="_blank" rel="noopener noreferrer">人物画像：TestWhat</a>
        </p>

        <p className="tier-card__level">
          第 {tier.level} / 8 段位 · {tier.enName}
        </p>
        <h1 className="tier-card__name">{tier.name}</h1>
        <p className="tier-card__tagline">「{tier.tagline}」</p>
        <p className="tier-card__desc">{tier.description}</p>
      </section>

      {/* ---------- 总分与脑腐进度 ---------- */}
      <section className="score-card">
        <div className="score-card__total">
          <span className="score-card__label">总分</span>
          <span className="score-card__value">
            {total}
            <span className="score-card__max"> / {TOTAL_MAX}</span>
          </span>
          <span className="score-card__range">
            区间 {TOTAL_MIN}—{TOTAL_MAX}，本段位 {tier.min}—{tier.max}
          </span>
        </div>

        <div className="score-card__progress">
          <div className="score-card__progress-head">
            <span>脑腐进度</span>
            <strong style={{ color: tier.color }}>{progress}%</strong>
          </div>
          <div className="pbar pbar--lg" ref={barsRef}>
            <div
              className="pbar__fill"
              style={{
                width: revealed ? `${progress}%` : '0%',
                background: `linear-gradient(90deg, ${tier.color}, ${tier.color2})`,
              }}
            />
          </div>
          <p className="score-card__formula">
            计算方式：（总分 {total} − {TOTAL_MIN}）÷ {TOTAL_MAX - TOTAL_MIN} × 100% = {progress}%
          </p>
        </div>
      </section>

      {/* ---------- 五维得分 ---------- */}
      <section className="section section--tight">
        <h2 className="section__title section__title--left">脑腐档案 · 五维得分</h2>
        <div className="dim-scores">
          {dimensions.map((d, i) => (
            <div
              key={d.key}
              className={`dim-score ${revealed ? 'dim-score--in' : ''}`}
              style={{
                // @ts-expect-error CSS 自定义属性
                '--dim-color': d.color,
                '--dim-color2': d.color2,
                transitionDelay: `${i * 90}ms`,
              }}
            >
              <div className="dim-score__head">
                <span className="dim-score__name">
                  <span className="dim-score__icon">{d.icon}</span>
                  {d.name}
                </span>
                <span className="dim-score__value" style={{ color: d.color }}>
                  {d.score}
                  <span className="dim-score__max"> / 12</span>
                </span>
              </div>
              <div className="pbar">
                <div
                  className="pbar__fill"
                  style={{
                    width: revealed ? `${d.percent}%` : '0%',
                    background: `linear-gradient(90deg, ${d.color}, ${d.color2})`,
                  }}
                />
              </div>
              <p className="dim-score__detail">{d.detail}</p>
            </div>
          ))}
        </div>

        <div className="top-dims">
          <span className="top-dims__label">{dimensions.every((d) => d.score === dimensions[0].score) ? '五个维度得分一致' : hasTie ? '得分靠前的维度（含同分）' : '得分靠前的维度'}</span>
          <div className="top-dims__list">
            {topDimensions.map((d) => (
              <span key={d.key} className="top-dims__chip" style={{ borderColor: d.color }}>
                {d.icon} {d.name} {d.score}/12
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 建议 ---------- */}
      <section className="section section--tight">
        <h2 className="section__title section__title--left">🧾 脑腐处方笺</h2>
        <p className="section__subtitle section__subtitle--left">
          按你各维度的实际得分挑选：得分偏高的维度给具体做法，得分不高的维度以维持为主。
          挑一两条最容易做到的先坚持一周就好。
        </p>
        <ul className="advice">
          {advice.map((item, i) => (
            <li key={i} className="advice__item" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="advice__num">{i + 1}</span>
              <span className="advice__text">{item}</span>
            </li>
          ))}
        </ul>
        <p className="advice-note">{ADVICE_NOTE}</p>
      </section>

      {/* ---------- 分享 ---------- */}
      <section className="section section--tight">
        <h2 className="section__title section__title--left">分享你的脑腐段位</h2>
        <div className="share-actions">
          <button type="button" className="btn btn--primary" onClick={handleCopy} ref={copyButtonRef}>
            {copied ? '✅ 已复制' : '📋 复制结果摘要'}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleSaveImage}
            disabled={generating}
          >
            {generating ? '⏳ 生成中…' : '🖼️ 保存分享图'}
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleShareLink} ref={shareButtonRef}>
            🔗 一键分享
          </button>
        </div>
        {imageUrl && (
          <button type="button" className="share-preview-link" onClick={() => setModalOpen(true)}>
            查看已生成的分享图 →
          </button>
        )}
        <p className="share-note">
          分享图在你的设备上本地生成，不会上传任何数据；不登录、不付费。
        </p>
      </section>

      {/* ---------- 操作 ---------- */}
      <section className="section section--tight">
        <div className="result-actions">
          <button type="button" className="btn btn--ghost" onClick={onHome}>
            返回首页
          </button>
          <button type="button" className="btn btn--secondary" onClick={onOpenCodex}>
            查看人物图鉴
          </button>
          <button type="button" className="btn btn--primary" onClick={onRetest}>
            重新测试
          </button>
        </div>
      </section>

      <footer className="footer">
        <p className="footer__disclaimer">
          <strong>{DISCLAIMER}</strong>
          <br />
          {DISCLAIMER_LONG}
        </p>
      </footer>

      {modalOpen && imageUrl && (
        <ShareModal imageUrl={imageUrl} onClose={() => setModalOpen(false)} />
      )}

      {manualCopy && (
        <CopyFallbackModal
          title={manualCopy.title}
          hint={manualCopy.hint}
          text={buildSummary(result)}
          onClose={() => setManualCopy(null)}
          returnFocusTo={manualCopyTriggerRef.current}
        />
      )}
    </div>
  )
}
