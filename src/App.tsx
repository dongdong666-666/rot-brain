import { useCallback, useEffect, useState } from 'react'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Result from './components/Result'
import CharacterCodex from './components/CharacterCodex'
import { ToastHost, useToast } from './components/Toast'
import { calculateResult, getAnsweredCount, isComplete, type TestResult } from './utils/scoring'
import { createSession, isValidAnswer, type QuizSession } from './utils/session'
import { loadCodexReturn, loadResult, loadSession, loadStage, saveCodexReturn, saveResult, saveSession, saveStage, type MainStage, type Stage } from './utils/storage'

function loadInitialState() {
  let session = loadSession()
  const result = loadResult()
  const storedStage = loadStage()
  if (session && result && storedStage === 'result' && !session.completedAt &&
      calculateResult(session.answers, session.questionIds)?.total === result.total) {
    session = { ...session, completedAt: result.createdAt }
  }
  let stage: Stage = 'home'
  if (storedStage === 'quiz' && session) stage = 'quiz'
  else if (storedStage === 'result' && result) stage = 'result'
  else if (storedStage === 'result' && session) stage = 'quiz'
  else if (storedStage === 'codex') stage = 'codex'
  return { session, result, stage, codexReturn: loadCodexReturn() }
}
export default function App() {
  const { toasts, notify } = useToast()
  const [initial] = useState(loadInitialState)
  const [stage, setStage] = useState<Stage>(initial.stage)
  const [session, setSession] = useState<QuizSession | null>(initial.session)
  const [result, setResult] = useState<TestResult | null>(initial.result)
  const [storageIssue, setStorageIssue] = useState(false)
  const [codexReturn, setCodexReturn] = useState<MainStage>(initial.codexReturn)

  useEffect(() => { if (!saveStage(stage)) setStorageIssue(true) }, [stage])
  useEffect(() => { if (session && !saveSession(session)) setStorageIssue(true) }, [session])
  useEffect(() => { if (result && !saveResult(result)) setStorageIssue(true) }, [result])
  useEffect(() => { if (!saveCodexReturn(codexReturn)) setStorageIssue(true) }, [codexReturn])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }) }, [stage])

  const handleStart = useCallback(() => {
    const fresh = createSession(Math.random, session?.questionIds)
    setSession(fresh)
    setStage('quiz')
  }, [session?.questionIds])
  const handleSelect = useCallback((questionId: number, optionIndex: number) => {
    if (!isValidAnswer(questionId, optionIndex)) return
    setSession((previous) => previous && previous.questionIds.includes(questionId)
      ? { ...previous, completedAt: undefined, answers: { ...previous.answers, [questionId]: optionIndex } } : previous)
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
    setSession({ ...session, completedAt: nextResult.createdAt })
    setStage('result')
  }, [session, notify])
  const handleHome = useCallback(() => setStage('home'), [])
  const handleContinue = useCallback(() => { if (session) setStage('quiz') }, [session])
  const handleViewLastResult = useCallback(() => { if (result) setStage('result') }, [result])
  const handleOpenCodex = useCallback(() => {
    if (stage !== 'codex') { setCodexReturn(stage); setStage('codex') }
  }, [stage])
  const returnStage: MainStage = codexReturn === 'quiz' && session ? 'quiz'
    : codexReturn === 'result' && result ? 'result' : 'home'
  const hasPendingTest = session !== null && (!session.completedAt || !isComplete(session.answers, session.questionIds))
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
        <nav className="topbar__actions" aria-label="网站导航">
          <button type="button" className="topbar__codex" onClick={handleOpenCodex}
            aria-label="打开人物图鉴" aria-current={stage === 'codex' ? 'page' : undefined}>人物图鉴</button>
          <span className="topbar__tag">仅供娱乐</span>
        </nav>
      </header>
      <main className="main">
        {storageIssue && <p className="storage-warning" role="status">当前浏览器无法保存进度，本轮仍可完成；刷新或关闭页面后可能丢失。</p>}
        {stage === 'home' && <Home onStart={handleStart} onContinue={handleContinue}
          answeredCount={answeredCount} hasPendingSession={hasPendingTest}
          lastResult={result} onViewLastResult={handleViewLastResult} onOpenCodex={handleOpenCodex} />}
        {stage === 'quiz' && session && <Quiz session={session} onSelect={handleSelect}
          onNavigate={handleNavigate} onFinish={handleFinish} onExit={handleHome} notify={notify} />}
        {stage === 'result' && result && <Result result={result} onRetest={handleStart} onHome={handleHome} onOpenCodex={handleOpenCodex} notify={notify} />}
        {stage === 'codex' && <CharacterCodex onBack={() => setStage(returnStage)}
          backLabel={returnStage === 'quiz' ? '返回继续答题' : returnStage === 'result' ? '返回我的结果' : '返回首页'}
          onTakeTest={hasPendingTest ? handleContinue : handleStart}
          hasPendingTest={hasPendingTest} lastResultLevel={result?.tier.level} />}
      </main>
      <ToastHost toasts={toasts} />
    </div>
  )
}
