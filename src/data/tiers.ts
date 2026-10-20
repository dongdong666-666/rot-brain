/**
 * 八个脑腐段位（人物）配置。
 * 总分范围 20—60，区间依次为：
 * 20—24、25—29、30—34、35—39、40—44、45—49、50—54、55—60。
 * 名称、英文名、图标、评语、介绍与画像必须保持主题一致：
 * 结果卡、人物图鉴、首页举例、分享摘要、分享图与下载文件名都只从本文件读取。
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
  /** 段位图标：画像加载失败时保留的回退。 */
  icon: string
  /** 项目 public/ 下的本地人物画像，相对于站点 base。 */
  portrait: string
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
    portrait: 'characters/pure.webp',
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
    name: '互联网观光客',
    portrait: 'characters/tourist.webp',
    enName: 'Internet Tourist',
    icon: '🧳',
    tagline: '路过看看，不打算久留',
    description:
      '你像逛景点一样路过信息流：会停下来看看热闹，也会按时离开。热门内容对你来说是橱窗，不是住处。保持这份好奇心，也记得你随时可以走出这条街。',
    color: '#34d399',
    color2: '#10b981',
  },
  {
    level: 3,
    min: 30,
    max: 34,
    name: '轻度腌制人',
    portrait: 'characters/casual.webp',
    enName: 'Lightly Pickled',
    icon: '🥒',
    tagline: '刚撒上盐，还能抢救',
    description:
      '你已经被算法撒了一层薄薄的盐：刷着刷着时间就没了，说话偶尔蹦出两句黑话。整体还很可控，只是那些「就五分钟」正在悄悄累积。',
    color: '#a3e635',
    color2: '#84cc16',
  },
  {
    level: 4,
    min: 35,
    max: 39,
    name: '中度入味体',
    portrait: 'characters/marinated.webp',
    enName: 'Half Marinated',
    icon: '🧂',
    tagline: '腌到一半，味道已经进去了',
    description:
      '调味料已经渗进去了：热门梗你会接，短视频也能刷上一阵。你开始注意到有些习惯是「被喂出来的」，还好还想得起来把手机放下。',
    color: '#fbbf24',
    color2: '#f59e0b',
  },
  {
    level: 5,
    min: 40,
    max: 44,
    name: '充分煮熟体',
    portrait: 'characters/cooked.webp',
    enName: 'Well Cooked',
    icon: '🍲',
    tagline: '火候到了，习惯也跟着定型',
    description:
      '火候到了，味道和习惯一起定了型：短视频、梗和热搜已经渗进日常缝隙，手常常比脑子快一步。如果想专注时总想切回信息流，可以试着留一小段不刷内容的空档，看看自己的感受。',
    color: '#fb923c',
    color2: '#f97316',
  },
  {
    level: 6,
    min: 45,
    max: 49,
    name: '油炸酥脆体',
    portrait: 'characters/deepfried.webp',
    enName: 'Deep Fried',
    icon: '🍗',
    tagline: '外酥里也酥，热度有点高',
    description:
      '热度有点高，外酥里也酥：注意力在高温里变得又脆又碎，长内容像被炸干了一样难以下咽。别急着否定自己，先把火关小一点，给自己留一个降温的窗口。',
    color: '#f472b6',
    color2: '#ec4899',
  },
  {
    level: 7,
    min: 50,
    max: 54,
    name: '发酵变异体',
    portrait: 'characters/fermented.webp',
    enName: 'Fermented Mutant',
    icon: '🦠',
    tagline: '在信息流里泡出了新性状',
    description:
      '在信息流里泡得够久，你已经发酵出了一些新性状：表达带梗、情绪跟着 feed 走、安静下来会发慌。这不是不可逆的变异，换个环境，菌种也会跟着变。',
    color: '#c084fc',
    color2: '#a855f7',
  },
  {
    level: 8,
    min: 55,
    max: 60,
    name: '脑腐飞升体',
    portrait: 'characters/ascended.webp',
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

/**
 * 首页举例引用的三档人物。
 * 页面文案一律从这里取名字，避免在各处硬编码出不一致的称呼。
 */
export const FEATURED_TIER_LOW = TIERS[0]
export const FEATURED_TIER_MID = TIERS[3]
export const FEATURED_TIER_HIGH = TIERS[TIERS.length - 1]

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
