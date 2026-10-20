import { useCallback, useEffect, useState } from 'react'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Result from './components/Result'
import { ToastHost, useToast } from './components/Toast'
import { calculateResult, getAnsweredCount, type TestResult } from './utils/scoring'
import { createSession, isValidAnswer, type QuizSession } from './utils/session'
import { loadResult, loadSession, loadStage, saveResult, saveSession, saveStage, type Stage } from './utils/storage'

function loadInitialState() {
  const session = loadSession()
  const result = loadResult()
  const storedStage = loadStage()
  let stage: Stage = 'home'
  if (storedStage === 'quiz' && session) stage = 'quiz'
  else if (storedStage === 'result' && result) stage = 'result'
  return { session, result, stage }
}
export default function App() {
  const { toasts, notify } = useToast()
  const [initial] = useState(loadInitialState)
  const [stage, setStage] = useState<Stage>(initial.stage)
  const [session, setSession] = useState<QuizSession | null>(initial.session)
  const [result, setResult] = useState<TestResult | null>(initial.result)
  const [storageIssue, setStorageIssue] = useState(false)

  useEffect(() => { if (!saveStage(stage)) setStorageIssue(true) }, [stage])
  useEffect(() => { if (session && !saveSession(session)) setStorageIssue(true) }, [session])
  useEffect(() => { if (result && !saveResult(result)) setStorageIssue(true) }, [result])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [stage])

  const handleStart = useCallback(() => {
    const fresh = createSession(Math.random, session?.questionIds)
    setSession(fresh)
    setStage('quiz')
  }, [session?.questionIds])
  const handleSelect = useCallback((questionId: number, optionIndex: number) => {
    if (!isValidAnswer(questionId, optionIndex)) return
    setSession((previous) => previous && previous.questionIds.includes(questionId)
      ? { ...previous, answers: { ...previous.answers, [questionId]: optionIndex } } : previous)
  }, [])
  const handleNavigate = useCallback((current: number) => {
    setSession((previous) => previous && Number.isInteger(current) && current >= 0 && current < previous.questionIds.length
      ? { ...previous, current } : previous)
  }, [])
  const handleFinish = useCallback(() => {
    if (!session) return
    const nextResult = calculateResult(session.answers, session.questionIds)
    if (!nextResult) { notify('还有题目没答完，无法生成结果', 'info'); return }
    setResult(nextResult)
    setStage('result')
  }, [session, notify])
  const handleHome = useCallback(() => setStage('home'), [])
  const handleContinue = useCallback(() => { if (session) setStage('quiz') }, [session])
  const handleViewLastResult = useCallback(() => { if (result) setStage('result') }, [result])
  const answeredCount = session ? getAnsweredCount(session.answers, session.questionIds) : 0

  return (
    <div className="app">
      <div className="bg-decor" aria-hidden="true">
        <span className="bg-blob bg-blob--1" /><span className="bg-blob bg-blob--2" />
        <span className="bg-blob bg-blob--3" /><span className="bg-grid" />
      </div>
      <header className="topbar">
        <button type="button" className="topbar__brand" onClick={handleHome}>
          <span className="topbar__logo">🧠</span><span className="topbar__name">脑腐指数测试</span>
        </button>
        <span className="topbar__tag">仅供娱乐</span>
      </header>
      <main className="main">
        {storageIssue && <p className="storage-warning" role="status">当前浏览器无法保存进度，本轮仍可完成；刷新或关闭页面后可能丢失。</p>}
        {stage === 'home' && <Home onStart={handleStart} onContinue={handleContinue}
          answeredCount={answeredCount} hasSession={session !== null}
          lastResult={result} onViewLastResult={handleViewLastResult} />}
        {stage === 'quiz' && session && <Quiz session={session} onSelect={handleSelect}
          onNavigate={handleNavigate} onFinish={handleFinish} onExit={handleHome} notify={notify} />}
        {stage === 'result' && result && <Result result={result} onRetest={handleStart} onHome={handleHome} notify={notify} />}
      </main>
      <ToastHost toasts={toasts} />
    </div>
  )
}
