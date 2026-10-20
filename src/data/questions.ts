import type { DimensionKey } from './dimensions'

export interface QuestionOption {
  /** 选项文案 */
  text: string
  /** 分值：1 = 程度较低，2 = 中等，3 = 程度较高 */
  score: 1 | 2 | 3
}

export interface Question {
  id: number
  /** 所属维度 */
  dimension: DimensionKey
  /** 情境描述（题目前的小字背景） */
  scene: string
  /** 题干 */
  title: string
  options: QuestionOption[]
}

/**
 * 题库共 60 道情境题，每个维度 12 题；每轮均衡抽取 20 题。
 * 每题三个选项，分值必须从低到高排列（1 / 2 / 3）。
 * 原始题目保留 ID 与分值，旧轮次可以继续作答。
 */
const BASE_QUESTIONS: Question[] = [
  // ---------------- 短视频依赖 ----------------
  {
    id: 1,
    dimension: 'shortvideo',
    scene: '晚上十一点，你躺在床上刷手机。',
    title: '你对自己说「再看一条就睡」，结果通常是？',
    options: [
      { text: '真的只看一条，然后心满意足地放下手机', score: 1 },
      { text: '多刷了十几分钟，有点心虚但还是睡了', score: 2 },
      { text: '一抬头天快亮了，手机砸脸上才清醒过来', score: 3 },
    ],
  },
  {
    id: 2,
    dimension: 'shortvideo',
    scene: '等电梯、排队结账，只有三十秒空隙。',
    title: '这三十秒你会？',
    options: [
      { text: '站着发呆，或者看看周围的人和事', score: 1 },
      { text: '掏出手机随便划两下', score: 2 },
      { text: '条件反射点开短视频，且必须刷完一条才走得动', score: 3 },
    ],
  },
  {
    id: 3,
    dimension: 'shortvideo',
    scene: '朋友问你最近看了什么好电影。',
    title: '你上一次不加速、不切后台地看完一部电影是什么时候？',
    options: [
      { text: '就在这周，安安静静沉浸式看完了', score: 1 },
      { text: '好像是一两个月以前的事了', score: 2 },
      { text: '想不起来了，超过二十分钟的内容我都开两倍速', score: 3 },
    ],
  },
  {
    id: 4,
    dimension: 'shortvideo',
    scene: '有人给你转来一段八分钟的深度访谈。',
    title: '你的第一反应是？',
    options: [
      { text: '先收藏起来，找个整块时间认真看', score: 1 },
      { text: '拖一下进度条，看看有没有重点', score: 2 },
      { text: '「这个有没有人剪个三十秒的省流版？」', score: 3 },
    ],
  },

  // ---------------- 黑话浓度 ----------------
  {
    id: 5,
    dimension: 'slang',
    scene: '朋友跟你讲了一件特别离谱的事。',
    title: '你脱口而出的是？',
    options: [
      { text: '「真的吗？然后呢？说来听听」', score: 1 },
      { text: '「这也太离谱了吧」', score: 2 },
      { text: '「啊？我直接一整个大脑宕机，太刑了」', score: 3 },
    ],
  },
  {
    id: 6,
    dimension: 'slang',
    scene: '同事在工作群里 @ 你催方案进度。',
    title: '你最可能回复的是？',
    options: [
      { text: '「还在做，下午三点给你」', score: 1 },
      { text: '「收到，正在赶了」', score: 2 },
      { text: '「收到收到，正在破防中，马上端上来」', score: 3 },
    ],
  },
  {
    id: 7,
    dimension: 'slang',
    scene: '你想夸一个人特别厉害。',
    title: '最自然的说法是？',
    options: [
      { text: '「他确实很专业，做事很稳」', score: 1 },
      { text: '「太强了」', score: 2 },
      { text: '「yyds，这人太顶了，简直是个神」', score: 3 },
    ],
  },
  {
    id: 8,
    dimension: 'slang',
    scene: '你和长辈、或者刚认识的人聊天。',
    title: '你的网络用语使用情况是？',
    options: [
      { text: '基本不用，正常交流就好', score: 1 },
      { text: '偶尔冒出一句，对方会愣一下', score: 2 },
      { text: '满嘴都是梗，说完还得帮忙「翻译」成普通话', score: 3 },
    ],
  },

  // ---------------- 注意力碎片化 ----------------
  {
    id: 9,
    dimension: 'attention',
    scene: '你点开了一篇挺长的深度文章。',
    title: '你的阅读状态是？',
    options: [
      { text: '能一口气读完，还会顺手记两句', score: 1 },
      { text: '读两段就想看看有没有新消息', score: 2 },
      { text: '读三行就开始找「太长不看」的总结', score: 3 },
    ],
  },
  {
    id: 10,
    dimension: 'attention',
    scene: '你正坐在电脑前干活。',
    title: '此刻你的屏幕上大概开着多少窗口或标签页？',
    options: [
      { text: '一般只留当前要用的那几个', score: 1 },
      { text: '三五个，来回切换着看', score: 2 },
      { text: '几十个标签页堆着，我也不知道哪个是哪个', score: 3 },
    ],
  },
  {
    id: 11,
    dimension: 'attention',
    scene: '你下定决心要专心做一件事。',
    title: '大概多久会摸一次手机？',
    options: [
      { text: '能撑一个小时以上', score: 1 },
      { text: '二三十分钟就想看一眼', score: 2 },
      { text: '五分钟，甚至解锁后忘了自己要干嘛', score: 3 },
    ],
  },
  {
    id: 12,
    dimension: 'attention',
    scene: '你坐下来准备看书或者写点东西。',
    title: '最常冒出来的念头是？',
    options: [
      { text: '比较能进入状态，常常忘了时间', score: 1 },
      { text: '时不时要瞄一眼手机通知', score: 2 },
      { text: '「要不要先刷会儿手机找找感觉」，然后一小时没了', score: 3 },
    ],
  },

  // ---------------- 信息茧房 ----------------
  {
    id: 13,
    dimension: 'cocoon',
    scene: '你刷到一条和你观点完全相反的内容。',
    title: '你的做法是？',
    options: [
      { text: '点进去看看对方的理由是什么', score: 1 },
      { text: '大概扫一眼，心里不太认同', score: 2 },
      { text: '直接划走，顺手再点个「不感兴趣」', score: 3 },
    ],
  },
  {
    id: 14,
    dimension: 'cocoon',
    scene: '你打开自己的关注列表。',
    title: '里面观点和你明显不一致的账号有？',
    options: [
      { text: '有几个，专门留着看不同视角', score: 1 },
      { text: '说不清，好像没有', score: 2 },
      { text: '一个都没有，看不顺眼的早拉黑了', score: 3 },
    ],
  },
  {
    id: 15,
    dimension: 'cocoon',
    scene: '一条「震惊体」热搜弹了出来。',
    title: '你的处理方式是？',
    options: [
      { text: '先去找找原始信源再判断', score: 1 },
      { text: '看看评论区大家怎么说', score: 2 },
      { text: '直接转发，情绪先走一步', score: 3 },
    ],
  },
  {
    id: 16,
    dimension: 'cocoon',
    scene: '回想一下算法最近推荐给你的内容。',
    title: '给你的感觉是？',
    options: [
      { text: '挺杂的，什么类型的都能刷到', score: 1 },
      { text: '基本都是我感兴趣的话题', score: 2 },
      { text: '越来越像在照镜子，全是我爱听的', score: 3 },
    ],
  },

  // ---------------- 赛博精神状态 ----------------
  {
    id: 17,
    dimension: 'cyber',
    scene: '你刷完了一小时短视频，放下手机。',
    title: '此刻你通常的感觉是？',
    options: [
      { text: '还好，没什么特别的变化', score: 1 },
      { text: '有点累，眼睛不太舒服', score: 2 },
      { text: '空虚又烦躁，明明什么都没干却更累了', score: 3 },
    ],
  },
  {
    id: 18,
    dimension: 'cyber',
    scene: '早上刷到一条让人很不舒服的负面热搜。',
    title: '它能在多大程度上影响你这一天的状态？',
    options: [
      { text: '基本不影响，看完就过去了', score: 1 },
      { text: '会有点闷，缓一会儿就好了', score: 2 },
      { text: '会一直刷相关帖子，越刷越上头', score: 3 },
    ],
  },
  {
    id: 19,
    dimension: 'cyber',
    scene: '手机不在身边，已经超过半小时了。',
    title: '你的状态是？',
    options: [
      { text: '无所谓，正好清静一下', score: 1 },
      { text: '有点不习惯，偶尔摸一下口袋', score: 2 },
      { text: '有点焦虑，担心错过消息，回去第一时间狂刷', score: 3 },
    ],
  },
  {
    id: 20,
    dimension: 'cyber',
    scene: '想想你的日常生活。',
    title: '你有多久没有过「什么都不刷、什么都不想」的时刻了？',
    options: [
      { text: '经常有，我挺享受发呆的', score: 1 },
      { text: '偶尔有，睡前会放空一下', score: 2 },
      { text: '几乎没有，一安静下来就慌，必须有点声音', score: 3 },
    ],
  },
]

/** 额外题库：五个维度各新增八题，参与均衡随机抽题。 */
const ADDITIONAL_QUESTIONS: Question[] = [
  {
    id: 21, dimension: "shortvideo",
    scene: "早八出门前，还剩十分钟。",
    title: "这十分钟你通常怎么用？",
    options: [
      { text: "收拾书包、吃两口早餐，手机先放一边", score: 1 },
      { text: "看一两条消息或视频，留意出门时间", score: 2 },
      { text: "本想看一条，常常刷到最后一刻才冲出门", score: 3 },
    ],
  },
  {
    id: 22, dimension: "shortvideo",
    scene: "你已经看完了原本想找的那条教程。",
    title: "接下来通常会发生什么？",
    options: [
      { text: "退出页面，去试试教程里的方法", score: 1 },
      { text: "再看一两个相关推荐，然后退出", score: 2 },
      { text: "沿着推荐接力看下去，忘了刚才要做什么", score: 3 },
    ],
  },
  {
    id: 23, dimension: "shortvideo",
    scene: "食堂取餐后，你准备坐下吃饭。",
    title: "短视频在这顿饭里通常扮演什么角色？",
    options: [
      { text: "没有它也很自在，专心吃饭或和朋友聊聊", score: 1 },
      { text: "偶尔看几条，吃完就收起来", score: 2 },
      { text: "习惯让它全程陪饭，饭吃完了还会再刷一阵", score: 3 },
    ],
  },
  {
    id: 24, dimension: "shortvideo",
    scene: "坐地铁时，你点开了短视频。",
    title: "听到自己的站名时，你更接近哪种情况？",
    options: [
      { text: "提前收起手机，等着下车", score: 1 },
      { text: "看到一半会暂停，先下车再说", score: 2 },
      { text: "常想等这一条结束，偶尔因此错过车站或出口", score: 3 },
    ],
  },
  {
    id: 25, dimension: "shortvideo",
    scene: "两节课之间有十分钟休息。",
    title: "你和信息流的约会通常持续多久？",
    options: [
      { text: "不一定打开，伸展一下或看看窗外", score: 1 },
      { text: "休息时看看，上课铃响就停", score: 2 },
      { text: "上课铃像背景音，还想偷偷刷完接下来的推荐", score: 3 },
    ],
  },
  {
    id: 26, dimension: "shortvideo",
    scene: "晚上安排好了一段学习时间。",
    title: "短视频最可能在什么时候出现？",
    options: [
      { text: "完成一段任务后，按计划看一会儿", score: 1 },
      { text: "卡住时看几条，之后能回到任务", score: 2 },
      { text: "先刷一会儿找状态，常把学习时间整个借走", score: 3 },
    ],
  },
  {
    id: 27, dimension: "shortvideo",
    scene: "正在刷的内容突然有些重复。",
    title: "你会怎么处理？",
    options: [
      { text: "既然没什么想看的，就退出", score: 1 },
      { text: "换一个话题，再看一小会儿", score: 2 },
      { text: "仍然不断下滑，总觉得下一条会更有意思", score: 3 },
    ],
  },
  {
    id: 28, dimension: "shortvideo",
    scene: "你给自己设置了短视频使用提醒。",
    title: "提醒弹出时，你通常会？",
    options: [
      { text: "按提醒退出，去做下一件事", score: 1 },
      { text: "偶尔延长一次，但会给自己留个结束点", score: 2 },
      { text: "熟练地点击继续使用，提醒已经像装饰品", score: 3 },
    ],
  },
  {
    id: 29, dimension: "slang",
    scene: "小组群里需要确认一次集合安排。",
    title: "你最自然的回复风格是？",
    options: [
      { text: "把时间、地点和是否到场说清楚", score: 1 },
      { text: "说明安排，再搭一句熟悉的网络口头禅", score: 2 },
      { text: "连确认集合都像在发梗图弹幕，还得补一遍正经版本", score: 3 },
    ],
  },
  {
    id: 30, dimension: "slang",
    scene: "准备给一次普通的校园散步发动态。",
    title: "你的配文通常更像哪种？",
    options: [
      { text: "写看到的风景或当时的心情", score: 1 },
      { text: "真实描述里夹一句玩笑或热词", score: 2 },
      { text: "先想今天能套哪个梗，原来的心情反而成了配角", score: 3 },
    ],
  },
  {
    id: 31, dimension: "slang",
    scene: "你正在写一段课程展示的讲稿。",
    title: "写到兴奋的地方，你脑海里的措辞是？",
    options: [
      { text: "先想到完整的说明和具体例子", score: 1 },
      { text: "偶尔冒出梗词，修改时换回自己的话", score: 2 },
      { text: "第一版总像评论区，要花不少时间翻译成正式表达", score: 3 },
    ],
  },
  {
    id: 32, dimension: "slang",
    scene: "朋友问你新尝试的一家店怎么样。",
    title: "你的第一轮介绍更接近？",
    options: [
      { text: "具体说味道、分量和自己的感受", score: 1 },
      { text: "具体评价外加一句夸张的网络表达", score: 2 },
      { text: "一串梗词先上桌，对方追问后才想起说具体体验", score: 3 },
    ],
  },
  {
    id: 33, dimension: "slang",
    scene: "聊天记录里有一段你最近的日常发言。",
    title: "如果把所有梗词删掉，剩下的内容会怎样？",
    options: [
      { text: "大意基本完整，表达还是我的日常语言", score: 1 },
      { text: "少了些语气，但别人仍然看得懂", score: 2 },
      { text: "像拿掉了句子的骨架，需要重新组织才能说明白", score: 3 },
    ],
  },
  {
    id: 34, dimension: "slang",
    scene: "评论区里突然出现了几句密集的网络用语。",
    title: "你通常能接住多少？",
    options: [
      { text: "需要看上下文或查一下意思", score: 1 },
      { text: "大部分能懂，个别词需要想一想", score: 2 },
      { text: "几乎不用翻译，还能顺手接出下一句", score: 3 },
    ],
  },
  {
    id: 35, dimension: "slang",
    scene: "游戏结束后，队友问你这一局的感受。",
    title: "你最容易脱口而出的是？",
    options: [
      { text: "讲讲哪一步配合得好、哪一步比较遗憾", score: 1 },
      { text: "先说开心或可惜，再补一句常见梗", score: 2 },
      { text: "先来一整套梗式播报，感觉自己自带弹幕音轨", score: 3 },
    ],
  },
  {
    id: 36, dimension: "slang",
    scene: "你给手机相册里的旅行照片起个名字。",
    title: "你的命名习惯更接近？",
    options: [
      { text: "地点加日期，或者一句自己的描述", score: 1 },
      { text: "地点或心情旁边配一句网络玩笑", score: 2 },
      { text: "每个相册都像热梗合集，不熟悉梗的人很难猜到拍了什么", score: 3 },
    ],
  },
  {
    id: 37, dimension: "attention",
    scene: "准备完成一轮二十五分钟的单项任务。",
    title: "这段时间里，你最常做的是？",
    options: [
      { text: "围绕这一件事推进，其他内容等结束再看", score: 1 },
      { text: "偶尔切出去看一眼，但能较快回到任务", score: 2 },
      { text: "频繁在消息、网页和任务间跳转，最后忘了刚才做到哪一步", score: 3 },
    ],
  },
  {
    id: 38, dimension: "attention",
    scene: "一段课程讲解正在进行，还剩十五分钟。",
    title: "你的注意力通常在哪里？",
    options: [
      { text: "大体跟着讲解，遇到重点会记下来", score: 1 },
      { text: "偶尔走神，发现后能接回当前内容", score: 2 },
      { text: "同时看很多无关内容，回神时已不知道讲到哪里", score: 3 },
    ],
  },
  {
    id: 39, dimension: "attention",
    scene: "你想读完三页感兴趣的资料。",
    title: "读到一半，你更可能？",
    options: [
      { text: "顺着读完，再统一查不懂的地方", score: 1 },
      { text: "中途查一次消息或词语，然后回来", score: 2 },
      { text: "不断跳到别的页面，三页资料很久都没有读完", score: 3 },
    ],
  },
  {
    id: 40, dimension: "attention",
    scene: "朋友正在当面分享一件小事，手机屏幕亮了。",
    title: "你通常会怎么做？",
    options: [
      { text: "先听完这段话，之后再看手机", score: 1 },
      { text: "瞄一眼是否紧急，不急就继续听", score: 2 },
      { text: "会点进消息继续看，之后需要朋友重复刚才那段", score: 3 },
    ],
  },
  {
    id: 41, dimension: "attention",
    scene: "写作业时，你突然想到一个无关的小问题。",
    title: "接下来最像你的情况是？",
    options: [
      { text: "简单记下，等当前任务结束再查", score: 1 },
      { text: "顺手查一下，基本能按时回来", score: 2 },
      { text: "查一个问题带出好多新页面，原作业被晾在一旁", score: 3 },
    ],
  },
  {
    id: 42, dimension: "attention",
    scene: "你正在按步骤做一件日常小事。",
    title: "信息提示响起后，你的节奏通常会？",
    options: [
      { text: "先完成手上的一步，再决定是否查看", score: 1 },
      { text: "暂停看一下，回来还能接着做", score: 2 },
      { text: "频繁中断，常要重新回想下一步是什么", score: 3 },
    ],
  },
  {
    id: 43, dimension: "attention",
    scene: "一段长一点的视频正好讲到你想了解的内容。",
    title: "你的观看方式更接近？",
    options: [
      { text: "围绕内容看下去，需要时暂停做记录", score: 1 },
      { text: "偶尔切走看消息，再回来继续", score: 2 },
      { text: "视频开着却在刷别的内容，结束后不太记得讲了什么", score: 3 },
    ],
  },
  {
    id: 44, dimension: "attention",
    scene: "终于空出一小时做自己的事。",
    title: "结束后回想，这一小时通常是？",
    options: [
      { text: "有一段比较完整的专注时间", score: 1 },
      { text: "被几次小打断分开，但仍完成了一些事", score: 2 },
      { text: "像被切成了很多小碎片，忙了一圈却很难说做了什么", score: 3 },
    ],
  },
  {
    id: 45, dimension: "cocoon",
    scene: "一个你不熟悉的话题突然很热门。",
    title: "你会怎样建立第一印象？",
    options: [
      { text: "先看看原始信息，再对照不同解释", score: 1 },
      { text: "主要看一两个熟悉账号的整理", score: 2 },
      { text: "只看同一类立场的短评，很快就觉得事情已经很清楚", score: 3 },
    ],
  },
  {
    id: 46, dimension: "cocoon",
    scene: "首页连续推来十几条很相似的内容。",
    title: "你通常会？",
    options: [
      { text: "主动换个话题，看看推荐之外还有什么", score: 1 },
      { text: "顺着看一些，偶尔去搜索别的内容", score: 2 },
      { text: "一直沿着同一条推荐线看，其他话题越来越少见", score: 3 },
    ],
  },
  {
    id: 47, dimension: "cocoon",
    scene: "两个人对同一件事给出了不同解释。",
    title: "你更常怎么做？",
    options: [
      { text: "看看双方依据和各自适用的情况", score: 1 },
      { text: "先看熟悉的一方，偶尔补看另一方", score: 2 },
      { text: "只要其中一方和我想的一样，就不太想再看另一方", score: 3 },
    ],
  },
  {
    id: 48, dimension: "cocoon",
    scene: "一条观点让你很想转发。",
    title: "点发送之前，你更可能？",
    options: [
      { text: "确认原文和上下文，想想有没有遗漏", score: 1 },
      { text: "看看发帖者是否可靠、评论里有没有补充", score: 2 },
      { text: "只要说中了我的感受，就直接转发给同样想的人", score: 3 },
    ],
  },
  {
    id: 49, dimension: "cocoon",
    scene: "第一次使用一个推荐内容的平台。",
    title: "选择兴趣标签时，你通常会？",
    options: [
      { text: "既选喜欢的，也留几种陌生但想了解的方向", score: 1 },
      { text: "主要选择自己熟悉的方向", score: 2 },
      { text: "把兴趣范围收得很窄，最好每条都符合原有口味", score: 3 },
    ],
  },
  {
    id: 50, dimension: "cocoon",
    scene: "一个平时友好的人表达了与你不同的看法。",
    title: "你的第一步通常是？",
    options: [
      { text: "问问他为什么这样想，了解具体依据", score: 1 },
      { text: "暂时保留意见，之后有机会再聊", score: 2 },
      { text: "很快就不想再看他的内容，尽量把不同声音移出视野", score: 3 },
    ],
  },
  {
    id: 51, dimension: "cocoon",
    scene: "群里流传一条看起来很熟悉的消息。",
    title: "你会怎样判断它能不能继续转发？",
    options: [
      { text: "确认发布日期和原始来源，看看是否已有更新", score: 1 },
      { text: "先看看群里有没有人指出问题", score: 2 },
      { text: "只要和原来的判断一致，就不再检查时间和出处", score: 3 },
    ],
  },
  {
    id: 52, dimension: "cocoon",
    scene: "搜索一个旅行或学习攻略时，各家说法不一样。",
    title: "你通常怎么选？",
    options: [
      { text: "比较条件、时间和适用人群，再做选择", score: 1 },
      { text: "主要参考熟悉博主，也扫几条其他评价", score: 2 },
      { text: "只留下符合原计划的说法，不太想看可能推翻计划的内容", score: 3 },
    ],
  },
  {
    id: 53, dimension: "cyber",
    scene: "睡前刷到一段容易引起争论的内容。",
    title: "关掉手机之后，你通常会？",
    options: [
      { text: "把它留在屏幕里，继续自己的睡前安排", score: 1 },
      { text: "还会想一会儿，之后慢慢放下", score: 2 },
      { text: "反复拿起手机看更新，原来的睡前安排一拖再拖", score: 3 },
    ],
  },
  {
    id: 54, dimension: "cyber",
    scene: "你发了一条普通动态，点赞数开始变化。",
    title: "你和这个数字的关系更接近？",
    options: [
      { text: "想起来时看看，不太影响正在做的事", score: 1 },
      { text: "会多看几次，但能继续自己的安排", score: 2 },
      { text: "频繁刷新，数字起伏会明显牵动当下心情", score: 3 },
    ],
  },
  {
    id: 55, dimension: "cyber",
    scene: "朋友约了一场不太用手机的线下活动。",
    title: "活动过程中，你通常会？",
    options: [
      { text: "享受眼前的活动，结束再集中看消息", score: 1 },
      { text: "中途偶尔看看有没有重要消息", score: 2 },
      { text: "总惦记信息流里的新内容，很难安心留在现场", score: 3 },
    ],
  },
  {
    id: 56, dimension: "cyber",
    scene: "一段评论争论已经让你看得不太舒服。",
    title: "接下来通常会？",
    options: [
      { text: "先退出，去做一件让自己缓一缓的事", score: 1 },
      { text: "再看几条，意识到没意思就停", score: 2 },
      { text: "明知道不舒服，还是不断刷新、追着看后续", score: 3 },
    ],
  },
  {
    id: 57, dimension: "cyber",
    scene: "忙完一天，你想给自己留一点休息时间。",
    title: "面对安静下来的空档，你更接近？",
    options: [
      { text: "不打开信息流也能休息，做点别的也舒服", score: 1 },
      { text: "有时想刷一会儿，之后能换种休息方式", score: 2 },
      { text: "很难让信息流停下来，刷累了仍想继续找新内容", score: 3 },
    ],
  },
  {
    id: 58, dimension: "cyber",
    scene: "连续看到别人展示很精彩的生活片段。",
    title: "你的状态更接近？",
    options: [
      { text: "欣赏一下，也记得镜头只是一部分生活", score: 1 },
      { text: "短暂比较一下，之后能回到自己的节奏", score: 2 },
      { text: "不断切换同类内容，越看越在意，连原来的安排都受影响", score: 3 },
    ],
  },
  {
    id: 59, dimension: "cyber",
    scene: "你发出的消息暂时没有收到回复。",
    title: "你通常会怎样等待？",
    options: [
      { text: "先做自己的事，等有回复再看", score: 1 },
      { text: "过一会儿检查一次，然后继续手头的事", score: 2 },
      { text: "频繁点开聊天和动态页面，等待本身占住了很多注意力", score: 3 },
    ],
  },
  {
    id: 60, dimension: "cyber",
    scene: "准备退出平台时，一条新互动提醒出现了。",
    title: "这条提醒通常会把你带到哪里？",
    options: [
      { text: "看情况处理，结束后仍能按原计划退出", score: 1 },
      { text: "多停留几分钟，再回到原来的安排", score: 2 },
      { text: "像打开了新一轮循环，又在平台里待了很久", score: 3 },
    ],
  },
]

export const QUESTIONS: Question[] = [...BASE_QUESTIONS, ...ADDITIONAL_QUESTIONS]
export const QUESTION_MAP = new Map(QUESTIONS.map((question) => [question.id, question]))
export const QUESTION_BANK_VERSION = 'brainrot-60-v1'
/** 题库容量与每轮题数分开：60 题中每维度抽 4 题，每轮仍为 20 题。 */
export const QUESTION_BANK_SIZE = QUESTIONS.length
export const TOTAL_QUESTIONS = 20
/** 旧进度沿用原 20 题，不在升级时重抽或丢失答案。 */
export const LEGACY_QUESTION_IDS = BASE_QUESTIONS.map((question) => question.id)

