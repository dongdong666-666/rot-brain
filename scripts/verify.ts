/* eslint-disable no-console */
/**
 * 计分逻辑自检脚本（仅在开发时使用，不参与页面打包）。
 * 运行：npm run verify
 */
import { QUESTIONS as QUESTION_BANK, LEGACY_QUESTION_IDS, TOTAL_QUESTIONS } from '../src/data/questions'
import { DIMENSIONS } from '../src/data/dimensions'
import { TIERS, TOTAL_MAX, TOTAL_MIN, getTier } from '../src/data/tiers'
import {
  adviceBandOf,
  buildAdvice,
  calculateResult,
  getAnsweredCount,
  isComplete,
  restoreResult,
  type AnswerMap,
  type DimensionScore,
  type TestResult,
} from '../src/utils/scoring'
import { createSession, isValidQuestionSet, migrateLegacyAnswers, parseSession } from '../src/utils/session'
import { loadCodexReturn, loadSession, loadStage, saveCodexReturn, saveSession, saveStage } from '../src/utils/storage'
import {
  ADVICE,
  ADVICE_BAND_ACTION_MIN,
  ADVICE_BAND_GENTLE_MIN,
  CONSISTENCY_NOTE,
  GENERAL_CLOSING_KEEP,
} from '../src/data/advice'
import {
  FEATURED_TIER_HIGH,
  FEATURED_TIER_LOW,
  FEATURED_TIER_MID,
  type Tier,
} from '../src/data/tiers'
import { existsSync, readFileSync } from 'node:fs'

const QUESTIONS = LEGACY_QUESTION_IDS.map(id => QUESTION_BANK.find(q => q.id === id)!)

let pass = 0
let fail = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    pass++
    console.log(`  ✅ ${name}`)
  } else {
    fail++
    console.log(`  ❌ ${name}\n     期望: ${JSON.stringify(expected)}\n     实际: ${JSON.stringify(actual)}`)
  }
}

function section(title: string) {
  console.log(`\n${title}`)
}

/** 用统一的选项下标构造一份完整答案 */
function makeAnswers(optionIndex: 0 | 1 | 2): AnswerMap {
  const answers: AnswerMap = {}
  QUESTIONS.forEach((q) => {
    answers[q.id] = optionIndex
  })
  return answers
}

// ---------------------------------------------------------------- 基础结构
section('【1】题目与配置结构')
check('题目总数为 20', TOTAL_QUESTIONS, 20)
check(
  '五个维度各 4 题',
  DIMENSIONS.map((d) => QUESTIONS.filter((q) => q.dimension === d.key).length),
  [4, 4, 4, 4, 4],
)
check(
  '每题 3 个选项且分值为 1/2/3',
  QUESTIONS.every((q) => q.options.length === 3 && q.options.every((o, i) => o.score === i + 1)),
  true,
)
check(
  '题目 id 唯一且连续',
  QUESTIONS.map((q) => q.id),
  Array.from({ length: 20 }, (_, i) => i + 1),
)
check(
  '段位区间连续覆盖 20—60',
  TIERS.map((t) => [t.min, t.max]),
  [
    [20, 24],
    [25, 29],
    [30, 34],
    [35, 39],
    [40, 44],
    [45, 49],
    [50, 54],
    [55, 60],
  ],
)

// ---------------------------------------------------------------- 极值
section('【2】全选最低 / 全选最高')
const minResult = calculateResult(makeAnswers(0))!
check('全选最低分总分为 20', minResult.total, 20)
check('全选最低分进度为 0%', minResult.progress, 0)
check('全选最低分段位为第 1 档', minResult.tier.level, 1)
check('全选最低分各维度为 4 分', minResult.dimensions.map((d) => d.score), [4, 4, 4, 4, 4])
check('全选最低分各维度进度为 0%', minResult.dimensions.map((d) => d.percent), [0, 0, 0, 0, 0])

const maxResult = calculateResult(makeAnswers(2))!
check('全选最高分总分为 60', maxResult.total, 60)
check('全选最高分进度为 100%', maxResult.progress, 100)
check('全选最高分段位为第 8 档', maxResult.tier.level, 8)
check('全选最高分各维度为 12 分', maxResult.dimensions.map((d) => d.score), [12, 12, 12, 12, 12])
check('全选最高分各维度进度为 100%', maxResult.dimensions.map((d) => d.percent), [100, 100, 100, 100, 100])

// ---------------------------------------------------------------- 段位边界
section('【3】八个段位的边界判断')
const boundaryExpect: Array<[number, number]> = [
  [20, 1], [21, 1], [24, 1],
  [25, 2], [29, 2],
  [30, 3], [34, 3],
  [35, 4], [39, 4],
  [40, 5], [44, 5],
  [45, 6], [49, 6],
  [50, 7], [54, 7],
  [55, 8], [60, 8],
]
boundaryExpect.forEach(([score, level]) => {
  const r = calculateResult(buildAnswersForTotal(score))
  check(`总分 ${score} → 第 ${level} 档`, r?.tier.level, level)
})

/** 构造一份总分恰好为 target 的完整答案（20 题，每题 1—3 分） */
function buildAnswersForTotal(target: number): AnswerMap {
  const clamped = Math.min(TOTAL_MAX, Math.max(TOTAL_MIN, target))
  // 先全部给 1 分（共 20 分），再把差值逐题加到 3 分为止
  let remain = clamped - TOTAL_MIN
  const answers: AnswerMap = {}
  QUESTIONS.forEach((q) => {
    const add = Math.min(2, remain)
    answers[q.id] = add
    remain -= add
  })
  return answers
}

// 校验构造出来的答案确实等于目标分
section('【4】构造答案的总分校验')
boundaryExpect.forEach(([score]) => {
  const answers = buildAnswersForTotal(score)
  const sum = QUESTIONS.reduce((s, q) => s + q.options[answers[q.id]].score, 0)
  check(`构造答案实际总分为 ${score}`, sum, score)
})

// ---------------------------------------------------------------- 未完成
section('【5】未完成全部题目时不生成结果')
const partial = makeAnswers(1)
delete partial[20]
check('少答 1 题时返回 null', calculateResult(partial), null)
check('isComplete 判定为 false', isComplete(partial), false)
check('已答题数为 19', getAnsweredCount(partial), 19)
const empty: AnswerMap = {}
check('全部未答时返回 null', calculateResult(empty), null)
check('全部未答时已答题数为 0', getAnsweredCount(empty), 0)

// ---------------------------------------------------------------- 修改答案
section('【6】返回修改答案后计分正确')
const revised = makeAnswers(2) // 60 分
revised[1] = 0 // 第 1 题从 3 分改为 1 分
revised[7] = 1 // 第 7 题从 3 分改为 2 分
const revisedResult = calculateResult(revised)!
check('改 2 题后总分为 57', revisedResult.total, 57)
check('第 1 题所属维度为 10 分', revisedResult.dimensions[0].score, 10)
check('第 7 题所属维度为 11 分', revisedResult.dimensions[1].score, 11)
check('未修改维度仍为 12 分', revisedResult.dimensions.slice(2).map((d) => d.score), [12, 12, 12])
check('改后段位仍为第 8 档', revisedResult.tier.level, 8)

// 反复来回修改
const flip = makeAnswers(1)
flip[3] = 2
flip[3] = 0
flip[3] = 1
check('同一题反复修改后取最后一次', calculateResult(flip)!.total, 40)

// ---------------------------------------------------------------- 突出维度
section('【7】突出维度与并列判定')
const tieAll = calculateResult(makeAnswers(2))!
check('全 12 分时五个维度并列', tieAll.topDimensions.length, 5)
check('全 12 分时标记为并列', tieAll.hasTie, true)

const tieLow = calculateResult(makeAnswers(0))!
check('全 4 分时五个维度并列', tieLow.topDimensions.length, 5)
check('全 4 分时标记为并列', tieLow.hasTie, true)

// 名次无并列：12 / 11 / 8 / 8 / 8
const noTie = makeAnswers(1) // 全部 2 分 → 各维度 8 分
QUESTIONS.filter((q) => q.dimension === 'shortvideo').forEach((q) => {
  noTie[q.id] = 2 // 3 分 → 12
})
const slangQs = QUESTIONS.filter((q) => q.dimension === 'slang')
slangQs.forEach((q, i) => {
  noTie[q.id] = i < 3 ? 2 : 1 // 3+3+3+2 = 11
})
const noTieResult = calculateResult(noTie)!
check('名次无并列时取 2 个', noTieResult.topDimensions.length, 2)
check('第 1 名为短视频依赖', noTieResult.topDimensions[0].key, 'shortvideo')
check('第 2 名为黑话浓度', noTieResult.topDimensions[1].key, 'slang')
check('名次无并列时不标记并列', noTieResult.hasTie, false)
check(
  '维度分数为 12 / 11 / 8 / 8 / 8',
  noTieResult.dimensions.map((d) => d.score),
  [12, 11, 8, 8, 8],
)

// 第 1 名唯一、第 2 名四路并列：12 / 8 / 8 / 8 / 8
const rank2Tie = makeAnswers(1) // 各维度 8 分
QUESTIONS.filter((q) => q.dimension === 'shortvideo').forEach((q) => {
  rank2Tie[q.id] = 2 // 12
})
const rank2Result = calculateResult(rank2Tie)!
check('第 2 名并列时包含全部同分维度', rank2Result.topDimensions.length, 5)
check('第 2 名并列时标记并列', rank2Result.hasTie, true)
check('第 1 名仍排在首位', rank2Result.topDimensions[0].key, 'shortvideo')

// 两个维度同为最高
const twoTop = makeAnswers(0)
QUESTIONS.filter((q) => q.dimension === 'shortvideo' || q.dimension === 'cyber').forEach((q) => {
  twoTop[q.id] = 2
})
const twoResult = calculateResult(twoTop)!
check('两个维度同为最高时取 2 个', twoResult.topDimensions.length, 2)
check('两个维度同为最高时标记并列', twoResult.hasTie, true)

// ---------------------------------------------------------------- 建议与免责
section('【8】建议与文案')
check('结果建议不少于 3 条', tieAll.advice.length >= 3, true)
check('结果包含时间戳', typeof tieAll.createdAt === 'number' && tieAll.createdAt > 0, true)
check(
  '每个段位都有名称/评语/描述/图标',
  TIERS.every((t) => t.name && t.tagline && t.description && t.icon && t.enName),
  true,
)

// ---------------------------------------------------------------- 随机题库
section('【9】60题库与均衡随机抽取')
check('题库总量为60题', QUESTION_BANK.length, 60)
check('题库每维度12题', DIMENSIONS.map(d => QUESTION_BANK.filter(q => q.dimension === d.key).length), [12,12,12,12,12])
check('题库ID唯一', new Set(QUESTION_BANK.map(q => q.id)).size, 60)
check('题干没有重复', new Set(QUESTION_BANK.map(q => q.title)).size, 60)
check('题库每题3个有效分值', QUESTION_BANK.every(q => q.options.length === 3 && q.options.every((o,i) => o.score === i + 1)), true)
function seeded(seed: number) {
  let state = seed >>> 0
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
}
const rounds = Array.from({length:200}, (_, i) => createSession(seeded(i + 1)))
check('200轮均为20题且每维度4题', rounds.every(s => isValidQuestionSet(s.questionIds)), true)
check('200轮覆盖全部60道题', new Set(rounds.flatMap(s => s.questionIds)).size, 60)
check('每轮选项顺序都是完整排列', rounds.every(s => s.questionIds.every(id => [...s.optionOrders[id]].sort().join('') === '012')), true)
check('题序不是固定一套', new Set(rounds.map(s => s.questionIds.join(','))).size, 200)
check('选项不是全部固定为低中高', rounds.some(s => s.questionIds.some(id => s.optionOrders[id].join('') !== '012')), true)
check('200轮最低分均为20', rounds.every(s => calculateResult(Object.fromEntries(s.questionIds.map(id => [id,0])),s.questionIds)?.total === 20), true)
check('200轮最高分均为60', rounds.every(s => calculateResult(Object.fromEntries(s.questionIds.map(id => [id,2])),s.questionIds)?.total === 60), true)
check('连续重抽不重复上一轮题目', rounds.every((s,i) => createSession(seeded(i + 1000),s.questionIds).questionIds.every(id => !s.questionIds.includes(id))), true)
const randomRound = rounds[0]
const randomAnswers: AnswerMap = Object.fromEntries(randomRound.questionIds.map((id,i) => [id,i % 3]))
const randomResult = calculateResult(randomAnswers, randomRound.questionIds, 1000)!
check('相同题组答案重复计分一致', calculateResult(randomAnswers,randomRound.questionIds,1000), randomResult)
check('题序反转不改变计分', calculateResult(randomAnswers,[...randomRound.questionIds].reverse(),1000), randomResult)
const outsider = QUESTION_BANK.find(q => !randomRound.questionIds.includes(q.id))!.id
check('本轮以外的答案不影响得分', calculateResult({...randomAnswers,[outsider]:2},randomRound.questionIds,1000), randomResult)
check('重复题组不允许生成结果', calculateResult(randomAnswers,Array(20).fill(randomRound.questionIds[0])), null)
check('不完整题组不允许生成结果', calculateResult(randomAnswers,randomRound.questionIds.slice(1)), null)
const invalidValues: unknown[] = [-1,3,1.5,NaN,null,'1',true,undefined]
check('非法答案不能计为已答完', invalidValues.every(value => {
  const bad = {...randomAnswers,[randomRound.questionIds[0]]:value} as AnswerMap
  return !isComplete(bad,randomRound.questionIds) && calculateResult(bad,randomRound.questionIds) === null
}), true)

// ---------------------------------------------------------------- 恢复与兼容
section('【10】题组、选项与当前位置恢复')
const progress = {...randomRound,answers:randomAnswers,current:7}
check('JSON往返保留整轮题目、选项、答案和位置', parseSession(JSON.parse(JSON.stringify(progress))), progress)
check('正式提交时间可以持久恢复',parseSession({...progress,completedAt:2000})?.completedAt,2000)
check('非法提交时间不复用',parseSession({...progress,completedAt:'wrong'}),null)
check('题库版本错误不复用', parseSession({...progress,bankVersion:'unknown'}), null)
check('越界位置拒绝恢复', parseSession({...progress,current:20}), null)
check('重复选项排列拒绝恢复', parseSession({...progress,optionOrders:{...progress.optionOrders,[progress.questionIds[0]]:[0,0,2]}}), null)
const sanitized = parseSession({...progress,answers:{...randomAnswers,[progress.questionIds[0]]:'1',[outsider]:2}})!
check('损坏答案被过滤，其他答案继续保留', Object.keys(sanitized.answers).length,19)
const legacy = migrateLegacyAnswers({1:2,5:1,21:2})!
check('旧进度保持原20题', legacy.questionIds,LEGACY_QUESTION_IDS)
check('旧进度保留有效答案', legacy.answers,{1:2,5:1})
check('旧进度保持原选项顺序',legacy.optionOrders[1],[0,1,2])
check('旧进度跳到首个未答题',legacy.current,1)
check('旧结果按真实分数安全恢复',restoreResult(randomResult),randomResult)
check('伪造总分不能恢复',restoreResult({...randomResult,total:99}),null)
check('损坏的维度不能恢复',restoreResult({...randomResult,dimensions:[null]}),null)
check('段位配置损坏时从真实分数重建',restoreResult({...randomResult,tier:{name:'错误的段位'}})?.tier,randomResult.tier)
check('全12分结果给出建议', tieAll.advice.length >= 3, true)

// ---------------------------------------------------------------- 存储异常
section('【11】存储禁用与损坏')
let mockData: Record<string,string> = {}
let blocked = false
Object.defineProperty(globalThis,'window',{configurable:true,value:{
  localStorage:{
    getItem(key: string){ if(blocked) throw new Error('disabled'); return mockData[key] ?? null },
    setItem(key: string,value: string){ if(blocked) throw new Error('disabled'); mockData[key]=value },
  },
}})
check('正常保存轮次成功',saveSession(progress),true)
check('正常恢复当前位置与题序',loadSession(),progress)
saveStage('codex')
saveCodexReturn('quiz')
check('刷新后可恢复人物图鉴',loadStage(),'codex')
check('图鉴记住来自答题页',loadCodexReturn(),'quiz')
check('打开图鉴不会改写答题进度',loadSession(),progress)
mockData['brainrot.codex-return.v1']='invalid'
check('损坏的图鉴返回位置安全回首页',loadCodexReturn(),'home')
mockData['brainrot.session.v2']='{'
check('损坏JSON安全回到入口',loadSession(),null)
delete mockData['brainrot.session.v2']
mockData['brainrot.answers.v1']=JSON.stringify({1:1})
check('旧存储记录可迁移',loadSession()?.answers,{1:1})
blocked=true
check('存储不可用返回失败而非假成功',saveSession(progress),false)
check('存储不可用读取不崩溃',loadSession(),null)
check('内存答案仍可生成正式结果',calculateResult(randomAnswers,randomRound.questionIds,1000)?.total,randomResult.total)

section('【12】结果人物画像')
check('八个段位均配置本地画像',TIERS.every(t => /^characters\/[a-z]+[.]webp$/.test(t.portrait)),true)
check('八个段位画像互不重复',new Set(TIERS.map(t => t.portrait)).size,8)
check('八张画像文件存在',TIERS.every(t => existsSync('public/' + t.portrait)),true)
check('八张画像均为有效WebP容器',TIERS.every(t => {
  const bytes=readFileSync('public/' + t.portrait)
  return bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP'
}),true)
check('20分到60分的八档画像按顺序匹配',TIERS.map(t => t.portrait),[
  'characters/pure.webp','characters/tourist.webp','characters/casual.webp','characters/marinated.webp',
  'characters/cooked.webp','characters/deepfried.webp','characters/fermented.webp','characters/ascended.webp',
])

// ---------------------------------------------------------------- 建议分层
section('【13】建议按维度实际得分分层')

/** 直接按五维得分构造结果：走与旧结果恢复相同的重建入口 */
function resultFromScores(scores: number[], createdAt = 1000): TestResult {
  const dimensions: DimensionScore[] = DIMENSIONS.map((d, i) => ({
    key: d.key, name: d.name, icon: d.icon, detail: d.detail,
    color: d.color, color2: d.color2, score: scores[i],
    percent: Math.round(((scores[i] - 4) / 8) * 100),
  }))
  const total = scores.reduce((a, b) => a + b, 0)
  return restoreResult({ total, dimensions, createdAt })!
}

const keepPool = DIMENSIONS.flatMap(d => ADVICE[d.key].keep)
const gentlePool = DIMENSIONS.flatMap(d => ADVICE[d.key].gentle)
const actionPool = DIMENSIONS.flatMap(d => ADVICE[d.key].action)
const closings = [GENERAL_CLOSING_KEEP]
const notes = Object.values(CONSISTENCY_NOTE)

check('分层边界：6分为维持层', adviceBandOf(6), 'keep')
check('分层边界：7分为温和层', adviceBandOf(7), 'gentle')
check('分层边界：9分为温和层', adviceBandOf(9), 'gentle')
check('分层边界：10分为行动层', adviceBandOf(10), 'action')
check('分层常量与文案一致', [ADVICE_BAND_GENTLE_MIN, ADVICE_BAND_ACTION_MIN], [7, 10])

// 场景一：五维均为 4 分
const all4 = resultFromScores([4, 4, 4, 4, 4])
check('五维[4,4,4,4,4]总分为20', all4.total, 20)
check('五维[4,4,4,4,4]段位为第1档', all4.tier.level, 1)
check('五维[4,4,4,4,4]建议条数在3—5条', all4.advice.length >= 3 && all4.advice.length <= 5, true)
check('五维[4,4,4,4,4]说明得分一致且没有突出方向', all4.advice[0], CONSISTENCY_NOTE.keep)
check('五维[4,4,4,4,4]只给维持层文案', all4.advice.slice(1).every(t => keepPool.includes(t) || closings.includes(t)), true)
check('五维[4,4,4,4,4]不出现温和层文案', all4.advice.some(t => gentlePool.includes(t)), false)
check('五维[4,4,4,4,4]不出现行动层文案', all4.advice.some(t => actionPool.includes(t)), false)
check(
  '五维[4,4,4,4,4]不出现未被答案支持的断言',
  all4.advice.some(t => /空虚|停不下来|上瘾|成瘾|失控|脑子坏/.test(t)),
  false,
)

// 场景二：总分低但单个维度高
const lowWithHigh = resultFromScores([4, 4, 4, 4, 12])
check('五维[4,4,4,4,12]总分为28', lowWithHigh.total, 28)
check('五维[4,4,4,4,12]建议条数在3—5条', lowWithHigh.advice.length >= 3 && lowWithHigh.advice.length <= 5, true)
check(
  '五维[4,4,4,4,12]给高分维度（赛博精神状态）的行动层建议',
  lowWithHigh.advice.filter(t => ADVICE.cyber.action.includes(t)).length >= 2,
  true,
)
check('五维[4,4,4,4,12]不给低分维度的行动层建议',
  lowWithHigh.advice.some(t => ADVICE.shortvideo.action.includes(t) || ADVICE.slang.action.includes(t)), false)
const lowWithMild = resultFromScores([4, 4, 4, 4, 7])
check('总分23但单维度7分时仍给该维度建议',
  lowWithMild.advice.some(t => ADVICE.cyber.gentle.includes(t)), true)

// 场景三：中等得分
const midScores = resultFromScores([7, 8, 9, 8, 8])
check('五维[7,8,9,8,8]总分为40', midScores.total, 40)
check('五维[7,8,9,8,8]建议条数在3—5条', midScores.advice.length >= 3 && midScores.advice.length <= 5, true)
check('五维[7,8,9,8,8]使用温和层文案', midScores.advice.filter(t => gentlePool.includes(t)).length >= 2, true)
check('五维[7,8,9,8,8]不使用行动层文案', midScores.advice.some(t => actionPool.includes(t)), false)

// 场景四：全部满分
const all12 = resultFromScores([12, 12, 12, 12, 12])
check('五维全12总分为60', all12.total, 60)
check('五维全12段位为第8档', all12.tier.level, 8)
check('五维全12建议条数在3—5条', all12.advice.length >= 3 && all12.advice.length <= 5, true)
check('五维全12说明得分一致', all12.advice[0], CONSISTENCY_NOTE.action)
check('五维全12使用行动层文案', all12.advice.filter(t => actionPool.includes(t)).length >= 2, true)
check('五维全12不出现维持层文案', all12.advice.some(t => keepPool.includes(t)), false)

// 穷举所有五维得分组合，确认条数、去重与分层都成立
let comboCount = 0
let comboBad = 0
let comboDup = 0
for (let a = 4; a <= 12; a += 1) {
  for (let b = 4; b <= 12; b += 1) {
    for (let c = 4; c <= 12; c += 1) {
      for (let d = 4; d <= 12; d += 1) {
        for (let e = 4; e <= 12; e += 1) {
          const dims: DimensionScore[] = DIMENSIONS.map((dim, i) => ({
            key: dim.key, name: dim.name, icon: dim.icon, detail: dim.detail,
            color: dim.color, color2: dim.color2, score: [a, b, c, d, e][i],
            percent: Math.round((([a, b, c, d, e][i] - 4) / 8) * 100),
          }))
          const advice = buildAdvice(dims)
          comboCount += 1
          if (advice.length < 3 || advice.length > 5) comboBad += 1
          if (new Set(advice).size !== advice.length) comboDup += 1
        }
      }
    }
  }
}
check(`穷举${comboCount}种五维组合的建议条数均在3—5条`, comboBad, 0)
check('所有组合的建议均无重复', comboDup, 0)

// 结果页、旧结果恢复、分享图共用同一套建议生成逻辑
const restoredAdvice = restoreResult({
  total: 40, createdAt: 1700000000000,
  dimensions: midScores.dimensions,
})!.advice
check('恢复的旧结果使用同一套建议逻辑', restoredAdvice, midScores.advice)
check('分层只影响文案，不改变总分', midScores.total, 40)
check('分层只影响文案，不改变段位', midScores.tier, getTier(40))
check('分层只影响文案，不改变维度得分', midScores.dimensions.map(d => d.score), [7, 8, 9, 8, 8])

// ---------------------------------------------------------------- 名称与画像一致性
section('【14】人物名称 / 画像 / 文案一致性')
const EXPECTED_TIERS: Array<{ name: string; portrait: string; min: number; max: number }> = [
  { name: '数字净土人', portrait: 'characters/pure.webp', min: 20, max: 24 },
  { name: '互联网观光客', portrait: 'characters/tourist.webp', min: 25, max: 29 },
  { name: '轻度腌制人', portrait: 'characters/casual.webp', min: 30, max: 34 },
  { name: '中度入味体', portrait: 'characters/marinated.webp', min: 35, max: 39 },
  { name: '充分煮熟体', portrait: 'characters/cooked.webp', min: 40, max: 44 },
  { name: '油炸酥脆体', portrait: 'characters/deepfried.webp', min: 45, max: 49 },
  { name: '发酵变异体', portrait: 'characters/fermented.webp', min: 50, max: 54 },
  { name: '脑腐飞升体', portrait: 'characters/ascended.webp', min: 55, max: 60 },
]
check('八档名称与分数区间符合当前配置', TIERS.map(t => [t.min, t.max, t.name]),
  EXPECTED_TIERS.map(t => [t.min, t.max, t.name]))
check('八档名称与画像文件一一对应', TIERS.map(t => [t.name, t.portrait]),
  EXPECTED_TIERS.map(t => [t.name, t.portrait]))
check('每个段位的英文名非空且互不相同', new Set(TIERS.map(t => t.enName)).size, 8)
check('每个段位的图标非空', TIERS.every(t => t.icon.length > 0), true)
check('每个段位的评语非空', TIERS.every(t => t.tagline.length > 0), true)
check('每个段位的介绍非空', TIERS.every(t => t.description.length > 0), true)
check('每个段位的图标互不相同', new Set(TIERS.map(t => t.icon)).size, 8)

// 旧名称不应再散落在源码、页面或文档里
const LEGACY_NAMES = ['浅尝辄止体', '半熟冲浪手', '深度入味体', '重度发酵体', '算法共生体', '轻度腌制体']
const SCANNED_FILES = [
  'src/data/tiers.ts', 'src/data/advice.ts', 'src/data/dimensions.ts',
  'src/components/Home.tsx', 'src/components/Result.tsx', 'src/components/CharacterCodex.tsx',
  'src/components/Quiz.tsx', 'src/utils/share.ts', 'src/utils/scoring.ts', 'README.md',
]
const leftovers: string[] = []
for (const file of SCANNED_FILES) {
  if (!existsSync(file)) { leftovers.push(`${file}（文件不存在）`); continue }
  const text = readFileSync(file, 'utf8')
  for (const name of LEGACY_NAMES) {
    if (text.includes(name)) leftovers.push(`${file}: ${name}`)
  }
}
check('源码与文档中不再出现旧人物名称', leftovers, [])

check('首页举例的低档人物取自配置', FEATURED_TIER_LOW, TIERS[0])
check('首页举例的中档人物取自配置', FEATURED_TIER_MID, TIERS[3])
check('首页举例的高档人物取自配置', FEATURED_TIER_HIGH, TIERS[7])

// 旧结果保留真实分数与日期，只按当前配置换名称（32分落在第3档）
const legacyDimensions: DimensionScore[] = DIMENSIONS.map((dim, i) => ({
  key: dim.key, name: dim.name, icon: dim.icon, detail: dim.detail,
  color: dim.color, color2: dim.color2, score: [4, 4, 4, 8, 12][i],
  percent: Math.round((([4, 4, 4, 8, 12][i] - 4) / 8) * 100),
}))
const legacyNamed = restoreResult({
  total: 32, createdAt: 1700000000000,
  tier: { level: 3, min: 30, max: 34, name: '轻度腌制体', enName: '旧名字' } as Tier,
  dimensions: legacyDimensions,
})!
check('旧结果保留原总分', legacyNamed.total, 32)
check('旧结果保留原完成时间', legacyNamed.createdAt, 1700000000000)
check('旧结果保留原维度分数', legacyNamed.dimensions.map(d => d.score), [4, 4, 4, 8, 12])
check('旧结果按当前配置显示统一名称', legacyNamed.tier.name, '轻度腌制人')
check('旧结果按当前配置显示当前图标', legacyNamed.tier.icon, TIERS[2].icon)

// ---------------------------------------------------------------- 汇总
console.log(`\n${'='.repeat(46)}`)
console.log(`  通过 ${pass} 项，失败 ${fail} 项`)
console.log('='.repeat(46))
if (fail > 0) process.exit(1)
