import { DIMENSIONS, DIMENSION_MAX, DIMENSION_MIN, type DimensionKey } from '../data/dimensions'
import { LEGACY_QUESTION_IDS, QUESTION_MAP } from '../data/questions'
import { TOTAL_MAX, TOTAL_MIN, getTier, type Tier } from '../data/tiers'
import {
  ADVICE,
  ADVICE_BAND_ACTION_MIN,
  ADVICE_BAND_GENTLE_MIN,
  CONSISTENCY_NOTE,
  GENERAL_CLOSING_KEEP,
  GENERAL_CLOSING_MULTI,
  GENERAL_CLOSING_SINGLE,
  type AdviceBand,
} from '../data/advice'
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
/** 维度得分对应的文案层次：4—6 维持、7—9 温和、10—12 行动。 */
export function adviceBandOf(score: number): AdviceBand {
  if (score >= ADVICE_BAND_ACTION_MIN) return 'action'
  if (score >= ADVICE_BAND_GENTLE_MIN) return 'gentle'
  return 'keep'
}

/**
 * 按「各维度实际得分」挑选建议，而不是只按排名机械取前两名。
 * - 得分进入 7 分以上的维度才给调整类建议；
 * - 全部维度都在 4—6 分时，只给肯定与维持，不凭空断言问题；
 * - 总分低但某维度偏高时，仍会给该维度的相关建议；
 * - 输出控制在 3—5 条，去重后按数量截断。
 * 分层只影响文案选择，不参与分数、进度条和段位计算。
 */
export function buildAdvice(dimensions: DimensionScore[]): string[] {
  if (dimensions.length === 0) return []
  const ranked = [...dimensions].sort((a, b) => b.score - a.score)
  const allEqual = dimensions.every((d) => d.score === dimensions[0].score)
  const actionable = ranked.filter((d) => d.score >= ADVICE_BAND_GENTLE_MIN)
  const list: string[] = []

  if (actionable.length === 0) {
    // 全部处在较低区间：只给维持与肯定
    list.push(...ADVICE[ranked[0].key].keep.slice(0, 2))
    if (ranked[1] && ranked[1].score >= ranked[0].score - 1) {
      list.push(ADVICE[ranked[1].key].keep[0])
    }
    list.push(GENERAL_CLOSING_KEEP)
  } else {
    const first = actionable[0]
    list.push(...ADVICE[first.key][adviceBandOf(first.score)].slice(0, 2))
    const second = actionable[1]
    if (second) list.push(ADVICE[second.key][adviceBandOf(second.score)][0])
    list.push(actionable.length > 1 ? GENERAL_CLOSING_MULTI : GENERAL_CLOSING_SINGLE)
  }

  if (allEqual) list.unshift(CONSISTENCY_NOTE[adviceBandOf(dimensions[0].score)])
  return Array.from(new Set(list)).slice(0, 5)
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
    advice: buildAdvice(dimensions), createdAt,
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
