import { migrateLegacyAnswers, parseSession, type QuizSession } from './session'
import { restoreResult, type TestResult } from './scoring'

const SESSION_KEY = 'brainrot.session.v2'
const ANSWERS_KEY = 'brainrot.answers.v1'
const RESULT_KEY = 'brainrot.result.v1'
const STAGE_KEY = 'brainrot.stage.v1'
const CODEX_RETURN_KEY = 'brainrot.codex-return.v1'
export type MainStage = 'home' | 'quiz' | 'result'
export type Stage = MainStage | 'codex'

function safeGet(key: string): string | null {
  try { return window.localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, value: string): boolean {
  try { window.localStorage.setItem(key, value); return true } catch { return false }
}
function parseJson(raw: string | null): unknown {
  if (!raw) return null
  try { return JSON.parse(raw) as unknown } catch { return null }
}
export function loadStage(): Stage {
  const raw = safeGet(STAGE_KEY)
  return raw === 'quiz' || raw === 'result' || raw === 'codex' ? raw : 'home'
}
export function saveStage(stage: Stage): boolean {
  return safeSet(STAGE_KEY, stage)
}
export function loadCodexReturn(): MainStage {
  const raw = safeGet(CODEX_RETURN_KEY)
  return raw === 'quiz' || raw === 'result' ? raw : 'home'
}
export function saveCodexReturn(stage: MainStage): boolean {
  return safeSet(CODEX_RETURN_KEY, stage)
}
export function loadSession(): QuizSession | null {
  const raw = safeGet(SESSION_KEY)
  if (raw !== null) return parseSession(parseJson(raw))
  return migrateLegacyAnswers(parseJson(safeGet(ANSWERS_KEY)))
}
export function saveSession(session: QuizSession): boolean {
  return safeSet(SESSION_KEY, JSON.stringify(session))
}
export function loadResult(): TestResult | null {
  return restoreResult(parseJson(safeGet(RESULT_KEY)))
}
export function saveResult(result: TestResult): boolean {
  return safeSet(RESULT_KEY, JSON.stringify(result))
}
