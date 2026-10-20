/**
 * 八个脑腐段位配置。
 * 总分范围 20—60，区间依次为：
 * 20—24、25—29、30—34、35—39、40—44、45—49、50—54、55—60。
 * 修改名称、评语、描述或图形，只需改动本文件。
 */

export interface Tier {
  /** 段位序号，从 1 开始 */
  level: number
  /** 分数下限（含） */
  min: number
  /** 分数上限（含） */
  max: number
  /** 段位名称 */
  name: string
  /** 英文副标题 */
  enName: string
  /** 段位图形（emoji，无外部图片依赖） */
  icon: string
  /** 简短评语 */
  tagline: string
  /** 详细描述 */
  description: string
  /** 段位主色，用于渐变与卡片描边 */
  color: string
  color2: string
}

export const TIERS: Tier[] = [
  {
    level: 1,
    min: 20,
    max: 24,
    name: '数字净土人',
    enName: 'Digital Pure Land',
    icon: '🧊',
    tagline: '你的大脑还带着清晨的露水',
    description:
      '你依然守得住一整块不被切割的时间，也守得住自己的表达方式。互联网对你来说更像工具，而不是空气。这份清醒很珍贵，记得偶尔回头拉朋友一把。',
    color: '#38bdf8',
    color2: '#22d3ee',
  },
  {
    level: 2,
    min: 25,
    max: 29,
    name: '浅尝辄止体',
    enName: 'Light Dipper',
    icon: '🌱',
    tagline: '偶尔刷刷，随时能放下',
    description:
      '你会刷，也会笑，但手机还没能替你做决定。你的信息食谱还算均衡，偶尔的走神更像是休息，而不是失控。保持住这个节奏就好。',
    color: '#34d399',
    color2: '#10b981',
  },
  {
    level: 3,
    min: 30,
    max: 34,
    name: '轻度腌制体',
    enName: 'Lightly Pickled',
    icon: '🥒',
    tagline: '有点入味，还能抢救',
    description:
      '你已经被算法腌上了一层薄薄的底味：刷着刷着时间就没了，说话偶尔蹦出两句黑话。整体还算可控，只是那些「就五分钟」正在悄悄累积。',
    color: '#a3e635',
    color2: '#84cc16',
  },
  {
    level: 4,
    min: 35,
    max: 39,
    name: '半熟冲浪手',
    enName: 'Half-Baked Surfer',
    icon: '🍳',
    tagline: '刷功熟练，专注力时好时坏',
    description:
      '你已经很熟悉互联网的节奏，甚至能在信息流里如鱼得水。但注意力开始有了明显的波动：有些日子能沉下去，有些日子一整天都浮在表面。',
    color: '#fbbf24',
    color2: '#f59e0b',
  },
  {
    level: 5,
    min: 40,
    max: 44,
    name: '深度入味体',
    enName: 'Deeply Marinated',
    icon: '🍜',
    tagline: '味道进去了，习惯也进去了',
    description:
      '短视频、梗和热搜已经渗透进你的日常缝隙。你不是不知道自己在刷，只是手比脑子快。如果想专注时总想切回信息流，可以试着留一小段不刷内容的空档，看看自己的感受。',
    color: '#fb923c',
    color2: '#f97316',
  },
  {
    level: 6,
    min: 45,
    max: 49,
    name: '重度发酵体',
    enName: 'Fully Fermented',
    icon: '🫧',
    tagline: '情绪跟着 feed 上下浮动',
    description:
      '你的情绪节奏已经和信息流高度同步：刷到什么，今天就有点像什么。安静下来会不自在，长内容变得难以下咽。别急着否定自己，先从一个小缝隙开始透透气。',
    color: '#f472b6',
    color2: '#ec4899',
  },
  {
    level: 7,
    min: 50,
    max: 54,
    name: '算法共生体',
    enName: 'Algorithm Symbiote',
    icon: '🛸',
    tagline: '你和推荐系统已经互相驯化',
    description:
      '你的品味、表达和情绪，都和推荐系统长在了一起。你刷到的东西越来越像你，你也越来越像你刷到的东西。这是一段共生关系，随时可以重新谈判。',
    color: '#c084fc',
    color2: '#a855f7',
  },
  {
    level: 8,
    min: 55,
    max: 60,
    name: '脑腐飞升体',
    enName: 'Ascended Brain Rot',
    icon: '👽',
    tagline: '大脑已被互联网腌至入魂',
    description:
      '你几乎全天候泡在高频刺激里，安静是一种需要重新学习的技能。好消息是：能清楚看到这一点的你，恰恰还有完整的自我觉察。从今天的一个小动作开始，一点点把节奏拿回来。',
    color: '#f87171',
    color2: '#ef4444',
  },
]

/** 总分下限 / 上限（20 道题，每题 1—3 分） */
export const TOTAL_MIN = 20
export const TOTAL_MAX = 60

/** 兜底段位：分数异常时返回最低段位 */
const FALLBACK_TIER = TIERS[0]

/**
 * 根据总分返回对应段位。
 * 边界判断采用「闭区间」：min <= score <= max。
 */
export function getTier(score: number): Tier {
  for (const tier of TIERS) {
    if (score >= tier.min && score <= tier.max) return tier
  }
  return score < TIERS[0].min ? TIERS[0] : FALLBACK_TIER
}
