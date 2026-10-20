import { useState } from 'react'
import { DIMENSIONS, QUESTIONS_PER_DIMENSION } from '../data/dimensions'
import { QUESTION_BANK_SIZE, TOTAL_QUESTIONS } from '../data/questions'
import { TIERS, TOTAL_MAX, TOTAL_MIN } from '../data/tiers'
import { DISCLAIMER_LONG } from '../data/advice'
import type { TestResult } from '../utils/scoring'

interface HomeProps {
  onStart: () => void
  onContinue: () => void
  answeredCount: number
  hasSession: boolean
  /** 上一次的测试结果，存在时展示「查看上次结果」入口 */
  lastResult: TestResult | null
  onViewLastResult: () => void
}

export default function Home({ onStart, onContinue, answeredCount, hasSession, lastResult, onViewLastResult }: HomeProps) {
  const [confirmRestart, setConfirmRestart] = useState(false)
  const hasUnfinished = hasSession && answeredCount < TOTAL_QUESTIONS
  return (
    <div className="page page--home">
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero__orb" aria-hidden="true">
          <div className="hero__ring hero__ring--1" />
          <div className="hero__ring hero__ring--2" />
          <div className="hero__ring hero__ring--3" />
          <div className="hero__core">🧠</div>
        </div>

        <p className="hero__eyebrow">Brain Rot Index</p>
        <h1 className="hero__title">
          <span className="hero__title-line">脑腐</span>
          <span className="hero__title-line hero__title-line--accent">指数测试</span>
        </h1>
        <p className="hero__desc">
          你的大脑被互联网腌入味了吗？
          <br />
          从 {QUESTION_BANK_SIZE} 道情境题中随机抽取 {TOTAL_QUESTIONS} 题，看看你是
          <strong> 数字净土人</strong>、<strong>轻度腌制体</strong>，
          还是已经<strong>脑腐飞升</strong>。
        </p>

        {lastResult && (
          <button type="button" className="last-result" onClick={onViewLastResult}>
            <span className="last-result__icon">{lastResult.tier.icon}</span>
            <span className="last-result__text">
              上次测得「{lastResult.tier.name}」 · {lastResult.total} / {TOTAL_MAX}
            </span>
            <span className="last-result__cta">查看 →</span>
          </button>
        )}

        <p className="hero__random-note">五个维度各抽 {QUESTIONS_PER_DIMENSION} 题 · 题序和选项随机排列 · 刷新续答</p>
        <button type="button" className="btn btn--primary btn--xl" onClick={hasUnfinished ? onContinue : onStart}>
          <span className="btn__emoji">🫠</span>
          {hasUnfinished ? '继续上次测试（' + answeredCount + '/' + TOTAL_QUESTIONS + '）' : lastResult ? '重新抽题再测一次' : '随机抽题，开始测试'}
        </button>
        {hasUnfinished && !confirmRestart && (
          <button type="button" className="restart-link" onClick={() => setConfirmRestart(true)}>重新抽取20题</button>
        )}
        {hasUnfinished && confirmRestart && (
          <div className="restart-confirm" role="group" aria-label="确认重新抽题">
            <p>重新抽题会替换本轮进度；上次完成的结果会保留。</p>
            <div>
              <button type="button" className="btn btn--secondary" onClick={() => { setConfirmRestart(false); onStart() }}>确认重新抽题</button>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmRestart(false)}>保留进度</button>
            </div>
          </div>
        )}

        <div className="stats">
          <div className="stat">
            <span className="stat__num">{TOTAL_QUESTIONS}</span>
            <span className="stat__label">情境题</span>
          </div>
          <div className="stat">
            <span className="stat__num">约 3</span>
            <span className="stat__label">分钟</span>
          </div>
          <div className="stat">
            <span className="stat__num">{DIMENSIONS.length}</span>
            <span className="stat__label">脑腐维度</span>
          </div>
          <div className="stat">
            <span className="stat__num">{TIERS.length}</span>
            <span className="stat__label">脑腐段位</span>
          </div>
        </div>
        <p className="stats__hint">
          维度：依赖 / 黑话 / 专注 / 茧房 / 精神　·　段位：从净土到飞升　·　总分 {TOTAL_MIN}—{TOTAL_MAX}
        </p>
      </section>

      {/* ---------- 五个维度 ---------- */}
      <section className="section">
        <h2 className="section__title">
          {DIMENSIONS.length} 个脑腐维度
        </h2>
        <p className="section__subtitle">
          不是你刷得多不多，而是互联网怎样重塑了你的注意力和情绪节奏。
        </p>
        <div className="dim-grid">
          {DIMENSIONS.map((d, i) => (
            <article
              key={d.key}
              className="dim-card"
              style={{
                // @ts-expect-error CSS 自定义属性
                '--dim-color': d.color,
                '--dim-color2': d.color2,
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div className="dim-card__icon">{d.icon}</div>
              <h3 className="dim-card__name">{d.name}</h3>
              <p className="dim-card__desc">{d.desc}</p>
              <span className="dim-card__badge">每轮 {QUESTIONS_PER_DIMENSION} 题</span>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- 关于本测试 ---------- */}
      <section className="section">
        <div className="about">
          <h2 className="section__title">关于本测试</h2>
          <p>
            「脑腐」不是医学诊断词，而是大家对高频内容刺激后状态变化的幽默称呼：
            专注变短、语言变梗、情绪更容易随内容波动。
          </p>
          <p>
            每轮从 {QUESTION_BANK_SIZE} 道题中均衡抽出 {TOTAL_QUESTIONS} 道，记录你当下的互联网摄入习惯。
            测完你会看到脑腐段位、维度分布，以及一张可执行的「脑腐处方笺」。
          </p>

          <h3 className="about__subtitle">答题贴士</h3>
          <ul className="tips">
            <li>请选你最近真实的行为，不是理想状态。</li>
            <li>按最近的真实习惯选择，结果更方便用来观察和聊天。</li>
            <li>建议顺便拉好友一起测，看看谁先飞升。</li>
          </ul>
        </div>
      </section>

      {/* ---------- 常见问题 ---------- */}
      <section className="section">
        <h2 className="section__title">常见问题</h2>
        <div className="faq">
          <details className="faq__item">
            <summary>随机抽题会不会让结果也变随机？</summary>
            <p>随机只用于选题和排列选项。每轮五个维度各四题，不重复抽题；同一道题选择同一个回答，分值始终相同。题目、选项顺序和当前位置会一起保存，刷新后继续原来的这一轮。不同轮次的分数只是娱乐参考，不是标准化测量。</p>
          </details>
          <details className="faq__item">
            <summary>脑腐指数是科学指标吗？</summary>
            <p>
              不是。本页面用娱乐化档位描述短视频、梗文化与注意力等自陈倾向，纯属段子化自测。
            </p>
          </details>
          <details className="faq__item">
            <summary>结果差代表我脑子坏了吗？</summary>
            <p>不代表。名称夸张是为了好玩，请不必对号入座到自我攻击。</p>
          </details>
          <details className="faq__item">
            <summary>想「戒脑腐」有用吗？</summary>
            <p>
              本页不提供治疗方案；可减少刺激源、增加线下活动，必要时寻求专业帮助。
            </p>
          </details>
        </div>
      </section>

      <footer className="footer">
        <p className="footer__disclaimer">{DISCLAIMER_LONG}</p>
        <p className="footer__copyright">
          脑腐指数测试 · 仅供娱乐与自我观察 · 不收集任何个人信息
        </p>
      </footer>
    </div>
  )
}
