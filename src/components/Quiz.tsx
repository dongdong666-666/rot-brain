import { useCallback, useEffect, useRef, useState } from 'react'
import { DIMENSION_MAP } from '../data/dimensions'
import { QUESTION_MAP } from '../data/questions'
import { getAnsweredCount, isComplete } from '../utils/scoring'
import { type QuizSession } from '../utils/session'

interface QuizProps {
  session: QuizSession
  onSelect: (questionId: number, optionIndex: number) => void
  onNavigate: (index: number) => void
  onFinish: () => void
  onExit: () => void
  notify: (message: string, kind?: 'success' | 'error' | 'info') => void
}
type Direction = 'next' | 'prev' | 'none'
const AUTO_ADVANCE_DELAY = 420
const TRANSITION_LOCK = 200

export default function Quiz({ session, onSelect, onNavigate, onFinish, onExit, notify }: QuizProps) {
  const { questionIds, answers, optionOrders, current: index } = session
  const question = QUESTION_MAP.get(questionIds[index])!
  const total = questionIds.length
  const dimension = DIMENSION_MAP[question.dimension]
  const answeredCount = getAnsweredCount(answers, questionIds)
  const currentAnswer = answers[question.id]
  const isLast = index === total - 1
  const allAnswered = isComplete(answers, questionIds)
  const [direction, setDirection] = useState<Direction>('none')
  const [locked, setLocked] = useState(false)
  const lockRef = useRef(false)
  const lockTimer = useRef<number | null>(null)
  const autoTimer = useRef<number | null>(null)
  const currentIdRef = useRef(question.id)
  const headingRef = useRef<HTMLHeadingElement>(null)
  currentIdRef.current = question.id

  useEffect(() => () => {
    if (lockTimer.current !== null) window.clearTimeout(lockTimer.current)
    if (autoTimer.current !== null) window.clearTimeout(autoTimer.current)
  }, [])
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [question.id])

  const clearAuto = useCallback(() => {
    if (autoTimer.current !== null) window.clearTimeout(autoTimer.current)
    autoTimer.current = null
  }, [])
  const startLock = useCallback(() => {
    lockRef.current = true
    setLocked(true)
    if (lockTimer.current !== null) window.clearTimeout(lockTimer.current)
  }, [])
  const releaseAfterTransition = useCallback(() => {
    lockTimer.current = window.setTimeout(() => {
      lockRef.current = false
      setLocked(false)
      lockTimer.current = null
    }, TRANSITION_LOCK)
  }, [])
  const goTo = useCallback((nextIndex: number, dir: Direction) => {
    if (lockRef.current || nextIndex < 0 || nextIndex >= total) return
    clearAuto()
    startLock()
    setDirection(dir)
    onNavigate(nextIndex)
    releaseAfterTransition()
  }, [total, clearAuto, startLock, onNavigate, releaseAfterTransition])

  const handleSelect = (optionIndex: number) => {
    if (lockRef.current) return
    const isRevising = currentAnswer !== undefined
    onSelect(question.id, optionIndex)
    if (!isRevising && !isLast) {
      clearAuto()
      startLock()
      const origin = question.id
      autoTimer.current = window.setTimeout(() => {
        autoTimer.current = null
        if (currentIdRef.current !== origin) return
        setDirection('next')
        onNavigate(index + 1)
        releaseAfterTransition()
      }, AUTO_ADVANCE_DELAY)
    }
  }
  const handleNext = () => {
    if (currentAnswer === undefined) { notify('先选一个选项再继续吧', 'info'); return }
    goTo(index + 1, 'next')
  }
  const handleFinish = () => {
    if (lockRef.current || !allAnswered) return
    clearAuto()
    startLock()
    onFinish()
  }
  const handleExit = () => {
    clearAuto()
    if (lockTimer.current !== null) window.clearTimeout(lockTimer.current)
    onExit()
  }
  const animClass = direction === 'prev' ? 'q-slide-in-left' : 'q-slide-in-right'

  return (
    <div className="page page--quiz">
      <header className="q-header">
        <button type="button" className="q-back" onClick={handleExit} aria-label="返回首页">←</button>
        <div className="q-header__meta">
          <span className="q-header__count">第 <strong>{index + 1}</strong> / {total} 题</span>
          <span className="q-header__dim" style={{ color: dimension.color }}>{dimension.icon} {dimension.name}</span>
        </div>
      </header>
      <div className="q-progress" role="progressbar" aria-label="已作答题目"
        aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}>
        <div className="q-progress__fill" style={{ width: (answeredCount / total) * 100 + '%' }} />
      </div>
      <div className="q-dots" aria-hidden="true">
        {questionIds.map((id, i) => <span key={id}
          className={['q-dot', i === index ? 'q-dot--active' : '', answers[id] !== undefined ? 'q-dot--done' : ''].filter(Boolean).join(' ')} />)}
      </div>
      <div className={'q-card ' + animClass} key={question.id}>
        <p className="q-scene">{question.scene}</p>
        <h2 className="q-title" tabIndex={-1} ref={headingRef}>{question.title}</h2>
        <div className="q-options" role="radiogroup" aria-label={question.title}>
          {optionOrders[question.id].map((optionIndex, position) => {
            const option = question.options[optionIndex]
            const selected = currentAnswer === optionIndex
            return (
              <button key={optionIndex} type="button" role="radio" aria-checked={selected}
                disabled={locked}
                className={'q-option ' + (selected ? 'q-option--selected' : '')}
                style={{
                  // @ts-expect-error CSS 自定义属性
                  '--dim-color': dimension.color, '--dim-color2': dimension.color2,
                  animationDelay: position * 60 + 'ms',
                }}
                onClick={() => handleSelect(optionIndex)}>
                <span className="q-option__mark">{String.fromCharCode(65 + position)}</span>
                <span className="q-option__text">{option.text}</span>
                {selected && <span className="q-option__check">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="q-actions">
        <button type="button" className="btn btn--ghost" onClick={() => goTo(index - 1, 'prev')}
          disabled={index === 0 || locked}>上一题</button>
        {isLast
          ? <button type="button" className="btn btn--primary" onClick={handleFinish}
              disabled={locked || !allAnswered}>查看我的脑腐段位</button>
          : <button type="button" className="btn btn--primary" onClick={handleNext}
              disabled={locked || currentAnswer === undefined}>下一题</button>}
      </div>
      {isLast && !allAnswered && <p className="q-hint">还有 {total - answeredCount} 题没有作答，返回补完即可查看结果。</p>}
      {!isLast && currentAnswer === undefined && <p className="q-hint q-hint--soft">首次选择后自动进入下一题；返回修改时可自行点击下一题。</p>}
      <p className="q-hint q-hint--soft">已作答 {answeredCount} / {total} 题 · 本轮题目与选项顺序已固定</p>
    </div>
  )
}
