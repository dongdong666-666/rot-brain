/**
 * 本轮改动的浏览器验证（开发用，不参与打包）。
 * 执行：playwright-cli run-code --filename=scripts/browser-check.cjs
 */
async (page) => {
  const out = []
  const log = (m) => out.push(m)
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  const BASE = 'http://localhost:5173/rot-brain/'
  const DIM_KEYS = ['shortvideo', 'slang', 'attention', 'cocoon', 'cyber']

  try {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(BASE, { waitUntil: 'networkidle' })

    /** 注入指定五维得分的结果，走与旧结果恢复相同的入口 */
    const showResult = async (scores) => {
      const dimensions = DIM_KEYS.map((key, i) => ({ key, score: scores[i] }))
      const total = scores.reduce((a, b) => a + b, 0)
      await page.evaluate(([dims, t]) => {
        localStorage.setItem('brainrot.result.v1', JSON.stringify({ total: t, dimensions: dims, createdAt: 1700000000000 }))
        localStorage.setItem('brainrot.stage.v1', 'result')
        localStorage.removeItem('brainrot.session.v2')
        localStorage.removeItem('brainrot.answers.v1')
      }, [dimensions, total])
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForSelector('.page--result', { timeout: 15000 })
      await page.waitForTimeout(700)
      return total
    }

    const readResult = async () => ({
      name: await page.locator('.tier-card__name').innerText(),
      level: (await page.locator('.tier-card__level').innerText()).replace(/\s+/g, ' '),
      portrait: await page.locator('.tier-card__portrait img').getAttribute('src').catch(() => '(回退图标)'),
      total: (await page.locator('.score-card__value').innerText()).replace(/\s+/g, ''),
      range: (await page.locator('.score-card__range').innerText()).replace(/\s+/g, ' '),
      advice: (await page.locator('.advice__item .advice__text').allInnerTexts()).map(t => t.trim()),
    })

    // ================= 1. 八档名称 / 画像 / 分数边界 =================
    log('===== 【1】八档名称、画像与分数边界 =====')
    const EXPECTED = [
      ['数字净土人', 'pure.webp', 20], ['互联网观光客', 'tourist.webp', 25],
      ['轻度腌制人', 'casual.webp', 30], ['中度入味体', 'marinated.webp', 35],
      ['充分煮熟体', 'cooked.webp', 40], ['油炸酥脆体', 'deepfried.webp', 45],
      ['发酵变异体', 'fermented.webp', 50], ['脑腐飞升体', 'ascended.webp', 55],
    ]
    let nameOk = true
    for (let i = 0; i < 8; i += 1) {
      const v = 4 + i
      const total = await showResult([v, v, v, v, v])
      const r = await readResult()
      const [expName, expFile, expTotal] = EXPECTED[i]
      const ok = r.name === expName && r.portrait.endsWith(expFile) && total === expTotal
      if (!ok) nameOk = false
      log(`${ok ? '✅' : '❌'} ${total}分 → ${r.name} | ${r.level} | ${r.portrait.split('/').pop()} | 建议${r.advice.length}条`)
    }
    log(`八档名称与画像全部一致 = ${nameOk}`)

    // ================= 2. 建议场景 =================
    log('\n===== 【2】建议按维度得分分层 =====')
    const scenarios = [
      { label: '五维[4,4,4,4,4] 总分20', scores: [4, 4, 4, 4, 4] },
      { label: '五维[4,4,4,4,12] 总分28', scores: [4, 4, 4, 4, 12] },
      { label: '五维[7,8,9,8,8] 总分40', scores: [7, 8, 9, 8, 8] },
      { label: '五维[12,12,12,12,12] 总分60', scores: [12, 12, 12, 12, 12] },
    ]
    for (const s of scenarios) {
      const total = await showResult(s.scores)
      const r = await readResult()
      log(`\n--- ${s.label}（实测总分 ${r.total}）· 段位 ${r.name} · ${r.advice.length} 条建议`)
      r.advice.forEach((t, i) => log(`    ${i + 1}. ${t}`))
      log(`    条数在3—5之间 = ${r.advice.length >= 3 && r.advice.length <= 5}`)
    }

    // ================= 3. 图鉴名称一致性 =================
    log('\n===== 【3】人物图鉴名称一致性 =====')
    await showResult([12, 12, 12, 12, 12])
    await page.locator('.topbar__codex').click()
    await page.waitForSelector('.page--codex')
    await page.waitForTimeout(600)
    const codexNames = await page.locator('.codex-card__name').allInnerTexts()
    const codexMeta = await page.locator('.codex-card__meta').allInnerTexts()
    codexNames.forEach((n, i) => log(`${i + 1}. ${n}  [${codexMeta[i].replace(/\s+/g, ' ')}]`))
    log(`图鉴名称与配置一致 = ${JSON.stringify(codexNames) === JSON.stringify(EXPECTED.map(e => e[0]))}`)
    const marked = await page.locator('.codex-card__mine').count()
    log(`上次测得标记数（应为1，因为当前60分） = ${marked}`)

    // 逐个打开八份档案
    for (let i = 0; i < 8; i += 1) {
      await page.locator('.codex-card__open').nth(i).click()
      await page.waitForTimeout(350)
      const title = await page.locator('#codex-dialog-title').innerText()
      const range = (await page.locator('.codex-dialog__range').innerText()).replace(/\s+/g, ' ')
      const art = await page.locator('.codex-dialog__art img').getAttribute('src').catch(() => '(回退)')
      log(`  档案${i + 1}: ${title} | ${range} | ${art.split('/').pop()}`)
      await page.locator('.codex-dialog__close').click()
      await page.waitForTimeout(250)
    }

    // 图鉴返回原结果
    await page.locator('.codex-back').click()
    await page.waitForSelector('.page--result')
    await page.waitForTimeout(500)
    log(`图鉴返回后仍在结果页 = ${(await page.locator('.page--result').count()) > 0}，段位 = ${await page.locator('.tier-card__name').innerText()}`)

    // ================= 4. 首页举例与统计文案 =================
    log('\n===== 【4】首页文案（取自人物配置） =====')
    await page.evaluate(() => { localStorage.setItem('brainrot.stage.v1', 'home') })
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    log(`首页举例：${(await page.locator('.hero__desc').innerText()).replace(/\s+/g, ' ')}`)
    log(`统计提示：${(await page.locator('.stats__hint').innerText()).replace(/\s+/g, ' ')}`)
    log(`最近结果：${(await page.locator('.last-result__text').innerText()).replace(/\s+/g, ' ')}`)
    const heroText = await page.locator('.hero__desc').innerText()
    log(`首页不含旧名称 = ${!['浅尝辄止体', '半熟冲浪手', '深度入味体', '重度发酵体', '算法共生体', '轻度腌制体'].some(n => heroText.includes(n))}`)

    // ================= 5. 四档视口无横向溢出 =================
    log('\n===== 【5】四档视口 =====')
    for (const w of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width: w, height: 860 })
      await page.waitForTimeout(450)
      const home = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }))
      await showResult([12, 12, 12, 12, 12])
      const result = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }))
      const nameBox = await page.locator('.tier-card__name').evaluate(el => ({ sw: el.scrollWidth, cw: el.clientWidth }))
      await page.locator('.topbar__codex').click()
      await page.waitForSelector('.page--codex')
      await page.waitForTimeout(400)
      const codex = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }))
      const cardClip = await page.locator('.codex-card__name').first().evaluate(el => ({ sw: el.scrollWidth, cw: el.clientWidth }))
      await page.evaluate(() => { localStorage.setItem('brainrot.stage.v1', 'home') })
      log(`${w}px → 首页 ${home.s}/${home.i} 结果页 ${result.s}/${result.i} 图鉴 ${codex.s}/${codex.i} | 段位名未截断=${nameBox.sw <= nameBox.cw + 1} 图鉴名未截断=${cardClip.sw <= cardClip.cw + 1}`)
    }

    log(`\n[控制台] 错误数 = ${errors.length}`)
    errors.slice(0, 6).forEach(e => log(`   · ${e}`))
  } catch (e) {
    log(`\n[中断] ${e.message.split('\n')[0]}`)
    log(`[控制台] 错误数 = ${errors.length}`)
    errors.slice(0, 6).forEach(x => log(`   · ${x}`))
  }

  return out.join('\n')
}
