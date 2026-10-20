import { DIMENSIONS, DIMENSION_MAX, DIMENSION_MIN, type DimensionKey } from '../data/dimensions'
import { LEGACY_QUESTION_IDS, QUESTION_MAP } from '../data/questions'
import { TOTAL_MAX, TOTAL_MIN, getTier, type Tier } from '../data/tiers'
import { ADVICE, GENERAL_ADVICE_HIGH, GENERAL_ADVICE_LOW, GENERAL_ADVICE_MID } from '../data/advice'
import { isValidAnswer, isValidQuestionSet } from './session'

/** 题目 ID -> 原始选项下标；展示顺序变化不影响计分。 */
export type AnswerMap = Record<number, number>
export interface DimensionScore {
  key: DimensionKey
  name: string
  icon: string
  detail: string
  color: string
  color2: string
  score: number
  percent: number
}
export interface TestResult {
  total: number
  progress: number
  tier: Tier
  dimensions: DimensionScore[]
  topDimensions: DimensionScore[]
  hasTie: boolean
  advice: string[]
  createdAt: number
}
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
function pickTopTwo(dimensions: DimensionScore[]) {
  const sorted = [...dimensions].sort((a, b) => b.score - a.score)
  const secondScore = sorted[1]?.score ?? sorted[0].score
  const top = sorted.filter((dim) => dim.score >= secondScore)
  return { top, hasTie: sorted[0].score === secondScore || top.length > 2 }
}
function buildAdvice(top: DimensionScore[], total: number): string[] {
  const perDimension = top.length > 2 ? 1 : 2
  const list = top.flatMap((dim) => ADVICE[dim.key].slice(0, perDimension))
  const general = total <= 29 ? GENERAL_ADVICE_LOW : total <= 44 ? GENERAL_ADVICE_MID : GENERAL_ADVICE_HIGH
  return Array.from(new Set([...list, ...general]))
}
function buildResult(scores: Record<DimensionKey, number>, createdAt: number): TestResult {
  const dimensions = DIMENSIONS.map((dim) => ({
    ...dim, score: scores[dim.key],
    percent: Math.round(((scores[dim.key] - DIMENSION_MIN) / (DIMENSION_MAX - DIMENSION_MIN)) * 100),
  }))
  const total = dimensions.reduce((sum, dim) => sum + dim.score, 0)
  const { top, hasTie } = pickTopTwo(dimensions)
  return {
    total, progress: Math.round(((total - TOTAL_MIN) / (TOTAL_MAX - TOTAL_MIN)) * 1000) / 10,
    tier: getTier(total), dimensions, topDimensions: top, hasTie,
    advice: buildAdvice(top, total), createdAt,
  }
}
/** 只计算本轮抽中的 20 题；非法题组、漏答、非法选项均不生成结果。 */
export function calculateResult(
  answers: AnswerMap,
  questionIds: readonly number[] = LEGACY_QUESTION_IDS,
  createdAt = Date.now(),
): TestResult | null {
  if (!isValidQuestionSet(questionIds) || !isComplete(answers, questionIds)) return null
  if (!Number.isFinite(createdAt) || createdAt <= 0) return null
  const scores = Object.fromEntries(DIMENSIONS.map((dim) => [dim.key, 0])) as Record<DimensionKey, number>
  for (const id of questionIds) {
    const question = QUESTION_MAP.get(id)!
    scores[question.dimension] += question.options[answers[id]].score
  }
  return buildResult(scores, createdAt)
}
export function getAnsweredCount(answers: AnswerMap, questionIds: readonly number[] = LEGACY_QUESTION_IDS): number {
  return questionIds.reduce((n, id) => n + (isValidAnswer(id, answers[id]) ? 1 : 0), 0)
}
export function isComplete(answers: AnswerMap, questionIds: readonly number[] = LEGACY_QUESTION_IDS): boolean {
  return isValidQuestionSet(questionIds) && questionIds.every((id) => isValidAnswer(id, answers[id]))
}
/** 老结果保留真实得分与日期；名称、段位、建议按当前配置重建。 */
export function restoreResult(input: unknown): TestResult | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Partial<TestResult>
  if (!Array.isArray(raw.dimensions) || raw.dimensions.length !== DIMENSIONS.length) return null
  if (typeof raw.createdAt !== 'number' || !Number.isFinite(raw.createdAt) || raw.createdAt <= 0) return null
  const scores = {} as Record<DimensionKey, number>
  for (const dim of DIMENSIONS) {
    const matches = raw.dimensions.filter((item) => item && item.key === dim.key)
    if (matches.length !== 1) return null
    const score = matches[0].score
    if (!Number.isInteger(score) || score < DIMENSION_MIN || score > DIMENSION_MAX) return null
    scores[dim.key] = score
  }
  const result = buildResult(scores, raw.createdAt)
  return raw.total === result.total ? result : null
}
