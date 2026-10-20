/**
 * 五个测试维度的配置。
 * 想增删维度时，同步修改 questions.ts 的 dimension 字段与 advice.ts 的建议库。
 */
export type DimensionKey = 'shortvideo' | 'slang' | 'attention' | 'cocoon' | 'cyber'

export interface Dimension {
  key: DimensionKey
  /** 维度名称 */
  name: string
  /** 卡片图标（emoji，无外部图片依赖） */
  icon: string
  /** 卡片上的一句话说明 */
  desc: string
  /** 结果页维度的补充说明 */
  detail: string
  /** 主题色，用于结果页进度条与标签 */
  color: string
  /** 结果页进度条的渐变终点色 */
  color2: string
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'shortvideo',
    name: '短视频依赖',
    icon: '🫠',
    desc: '「再看一条」是否成为你的时间黑洞。',
    detail: '你被自动播放和无限下拉牵着走的程度。',
    color: '#ff6b9d',
    color2: '#ff9a6b',
  },
  {
    key: 'slang',
    name: '黑话浓度',
    icon: '🗑️',
    desc: '你的日常表达是否已被梗词占领。',
    detail: '你的语言库里，梗与热词的占比。',
    color: '#f7c948',
    color2: '#ff8c42',
  },
  {
    key: 'attention',
    name: '注意力碎片化',
    icon: '🧩',
    desc: '你能否稳定专注，还是总在多任务乱跳。',
    detail: '你把一段完整时间守住的难度。',
    color: '#5ac8fa',
    color2: '#3d7dff',
  },
  {
    key: 'cocoon',
    name: '信息茧房',
    icon: '🌀',
    desc: '你是否长期待在同温层观点里。',
    detail: '你接触到的观点有多像回音。',
    color: '#a78bfa',
    color2: '#7c3aed',
  },
  {
    key: 'cyber',
    name: '赛博精神状态',
    icon: '💀',
    desc: '你的情绪是否被 feed 强烈牵引。',
    detail: '信息流对你情绪的拉扯强度。',
    color: '#4ade80',
    color2: '#14b8a6',
  },
]

export const DIMENSION_MAP: Record<DimensionKey, Dimension> = DIMENSIONS.reduce(
  (acc, d) => {
    acc[d.key] = d
    return acc
  },
  {} as Record<DimensionKey, Dimension>,
)

/** 每个维度的题目数量 */
export const QUESTIONS_PER_DIMENSION = 4
/** 每题最低分 / 最高分 */
export const MIN_OPTION_SCORE = 1
export const MAX_OPTION_SCORE = 3
/** 每个维度的分数区间 */
export const DIMENSION_MIN = QUESTIONS_PER_DIMENSION * MIN_OPTION_SCORE // 4
export const DIMENSION_MAX = QUESTIONS_PER_DIMENSION * MAX_OPTION_SCORE // 12
