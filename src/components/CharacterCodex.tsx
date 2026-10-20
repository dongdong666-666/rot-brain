import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TIERS, type Tier } from '../data/tiers'
import { getPortraitUrl } from '../utils/portraits'

interface CharacterCodexProps {
  onBack: () => void
  backLabel: string
  onTakeTest: () => void
  hasPendingTest: boolean
  lastResultLevel?: number
}

function Portrait({ tier, eager = false }: { tier: Tier; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  return failed
    ? <span className="codex-portrait-fallback" role="img" aria-label={tier.name + '段位图标'}>{tier.icon}</span>
    : <img src={getPortraitUrl(tier)} alt={tier.name + '人物画像'} width={768} height={768}
        loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
}

export default function CharacterCodex({ onBack, backLabel, onTakeTest, hasPendingTest, lastResultLevel }: CharacterCodexProps) {
  const [selected, setSelected] = useState<Tier | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!selected) { if (dialog.open) dialog.close(); return }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [selected])

  return (
    <div className="page page--codex">
      <div className="codex-toolbar">
        <button type="button" className="codex-back" onClick={onBack}>← {backLabel}</button>
        <span className="codex-count">{TIERS.length} 位人物 · 全部收录</span>
      </div>
      <header className="codex-heading">
        <p className="codex-eyebrow">BRAIN ROT · CHARACTER ARCHIVE</p>
        <h1>脑腐人物图鉴</h1>
        <p>八种人物，八种上网状态。点开一张卡，看看它的出场方式。</p>
        <span className="codex-notice">这里是角色介绍，你的段位由答题结果决定。</span>
      </header>
      <div className="codex-grid">
        {TIERS.map((tier) => (
          <article className="codex-card" key={tier.level} style={{ '--character-color': tier.color } as CSSProperties}>
            <button type="button" className="codex-card__open" onClick={() => setSelected(tier)}
              aria-label={'查看' + tier.name + '档案'} aria-haspopup="dialog">
              <span className="codex-card__art"><Portrait tier={tier} /></span>
              <span className="codex-card__body">
                <span className="codex-card__meta">
                  <span>NO.{String(tier.level).padStart(2, '0')}</span>
                  <span>{tier.min}—{tier.max}分</span>
                </span>
                <span className="codex-card__name">{tier.name}</span>
                {lastResultLevel === tier.level && <span className="codex-card__mine">上次测得</span>}
                <span className="codex-card__tagline">{tier.tagline}</span>
                <span className="codex-card__cta">查看档案 <span aria-hidden="true">↗</span></span>
              </span>
            </button>
          </article>
        ))}
      </div>
      <section className="codex-invitation">
        <div><h2>哪一位像最近的你？</h2><p>图鉴可以先看，答案还是交给你的日常。</p></div>
        <button type="button" className="btn btn--primary" onClick={onTakeTest}>
          {hasPendingTest ? '继续我的测试' : '测测我的段位'}
        </button>
      </section>
      <p className="codex-footer">
        本测试仅供娱乐与自我观察。人物画像来源：
        <a href="https://www.testwhat.com/brainrot-types.html" target="_blank" rel="noopener noreferrer">TestWhat</a>。
      </p>
      <dialog ref={dialogRef} className="codex-dialog" aria-labelledby="codex-dialog-title"
        onCancel={(event) => { event.preventDefault(); setSelected(null) }}
        onClick={(event) => { if (event.target === dialogRef.current) setSelected(null) }}>
        {selected && <div className="codex-dialog__content" style={{ '--character-color': selected.color } as CSSProperties}>
          <button type="button" className="codex-dialog__close" aria-label="关闭人物档案" onClick={() => setSelected(null)}>×</button>
          <p className="codex-eyebrow">CHARACTER FILE · NO.{String(selected.level).padStart(2, '0')}</p>
          <div className="codex-dialog__art"><Portrait key={selected.level} tier={selected} eager /></div>
          <p className="codex-dialog__english">{selected.enName}</p>
          <h2 id="codex-dialog-title">{selected.name}</h2>
          <p className="codex-dialog__range">对应测试总分 {selected.min}—{selected.max} 分 · 第 {selected.level} / 8 档</p>
          <p className="codex-dialog__tagline">「{selected.tagline}」</p>
          <p className="codex-dialog__description">{selected.description}</p>
          <p className="codex-dialog__note">这是人物档案，不代表你已测得这个段位。</p>
          <button type="button" className="btn btn--secondary" onClick={() => setSelected(null)}>返回人物图鉴</button>
        </div>}
      </dialog>
    </div>
  )
}
