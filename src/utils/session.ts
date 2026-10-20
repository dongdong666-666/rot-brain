import { DIMENSIONS, QUESTIONS_PER_DIMENSION } from '../data/dimensions'
import { LEGACY_QUESTION_IDS, QUESTION_BANK_VERSION, QUESTION_MAP, QUESTIONS, TOTAL_QUESTIONS } from '../data/questions'
import type { AnswerMap } from './scoring'

export interface QuizSession {
  version: 2
  bankVersion: string
  questionIds: number[]
  /** 展示位置 -> 原选项下标；答案始终存原下标，洗牌不改变分值。 */
  optionOrders: Record<number, number[]>
  answers: AnswerMap
  current: number
  startedAt: number
}

/** Fisher–Yates；只用于抽题与顺序，绝不参与计分。 */
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const value = random()
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('无效的随机源')
    const j = Math.floor(value * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function isValidQuestionSet(input: unknown): input is number[] {
  if (!Array.isArray(input) || input.length !== TOTAL_QUESTIONS) return false
  if (new Set(input).size !== TOTAL_QUESTIONS) return false
  if (!input.every((id) => typeof id === 'number' && QUESTION_MAP.has(id))) return false
  return DIMENSIONS.every((dim) =>
    input.filter((id) => QUESTION_MAP.get(id)?.dimension === dim.key).length === QUESTIONS_PER_DIMENSION,
  )
}

export function isValidAnswer(questionId: number, picked: unknown): picked is number {
  return typeof picked === 'number' && Number.isInteger(picked) &&
    picked >= 0 && picked < (QUESTION_MAP.get(questionId)?.options.length ?? 0)
}

export function sanitizeAnswers(input: unknown, ids: readonly number[]): AnswerMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const raw = input as Record<string, unknown>
  const answers: AnswerMap = {}
  for (const id of ids) {
    if (isValidAnswer(id, raw[id])) answers[id] = raw[id]
  }
  return answers
}

export function createSession(random = Math.random, previousIds: readonly number[] = []): QuizSession {
  const selected = DIMENSIONS.flatMap((dim) => {
    const pool = QUESTIONS.filter((q) => q.dimension === dim.key)
    if (pool.length < QUESTIONS_PER_DIMENSION) throw new Error('题库中有维度的题量不足')
    // 上一轮未出现的题优先：连续两轮不重复，所有候选仍在各自分组内随机抽取。
    const fresh = shuffle(pool.filter((q) => !previousIds.includes(q.id)), random)
    const used = shuffle(pool.filter((q) => previousIds.includes(q.id)), random)
    return [...fresh, ...used].slice(0, QUESTIONS_PER_DIMENSION).map((q) => q.id)
  })
  const questionIds = shuffle(selected, random)
  return {
    version: 2, bankVersion: QUESTION_BANK_VERSION, questionIds,
    optionOrders: Object.fromEntries(questionIds.map((id) => [id, shuffle([0, 1, 2], random)])),
    answers: {}, current: 0, startedAt: Date.now(),
  }
}

export function parseSession(input: unknown): QuizSession | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Partial<QuizSession>
  if (raw.version !== 2 || raw.bankVersion !== QUESTION_BANK_VERSION || !isValidQuestionSet(raw.questionIds)) return null
  if (!Number.isInteger(raw.current) || raw.current! < 0 || raw.current! >= TOTAL_QUESTIONS) return null
  if (typeof raw.startedAt !== 'number' || !Number.isFinite(raw.startedAt) || raw.startedAt <= 0) return null
  if (!raw.optionOrders || typeof raw.optionOrders !== 'object' || Array.isArray(raw.optionOrders)) return null
  const optionOrders: Record<number, number[]> = {}
  for (const id of raw.questionIds) {
    const order = raw.optionOrders[id]
    if (!Array.isArray(order) || order.length !== 3 || new Set(order).size !== 3 ||
        !order.every((i) => Number.isInteger(i) && i >= 0 && i <= 2)) return null
    optionOrders[id] = [...order]
  }
  return {
    version: 2, bankVersion: QUESTION_BANK_VERSION, questionIds: [...raw.questionIds],
    optionOrders, answers: sanitizeAnswers(raw.answers, raw.questionIds),
    current: raw.current!, startedAt: raw.startedAt,
  }
}

export function migrateLegacyAnswers(input: unknown): QuizSession | null {
  const answers = sanitizeAnswers(input, LEGACY_QUESTION_IDS)
  if (Object.keys(answers).length === 0) return null
  const firstUnanswered = LEGACY_QUESTION_IDS.findIndex((id) => answers[id] === undefined)
  return {
    version: 2, bankVersion: QUESTION_BANK_VERSION, questionIds: [...LEGACY_QUESTION_IDS],
    optionOrders: Object.fromEntries(LEGACY_QUESTION_IDS.map((id) => [id, [0, 1, 2]])),
    answers, current: firstUnanswered < 0 ? TOTAL_QUESTIONS - 1 : firstUnanswered,
    startedAt: Date.now(),
  }
}
