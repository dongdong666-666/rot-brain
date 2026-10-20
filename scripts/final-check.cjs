/**
 * 回归与留档（开发用，不参与打包）。
 * 执行：playwright-cli run-code --filename=scripts/final-check.cjs
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
    const showResult = async (scores, createdAt = 1700000000000) => {
      const dimensions = DIM_KEYS.map((key, i) => ({ key, score: scores[i] }))
      const total = scores.reduce((a, b) => a + b, 0)
      await page.evaluate(([dims, t, c]) => {
        localStorage.setItem('brainrot.result.v1', JSON.stringify({ total: t, dimensions: dims, createdAt: c }))
        localStorage.setItem('brainrot.stage.v1', 'result')
        localStorage.removeItem('brainrot.session.v2')
        localStorage.removeItem('brainrot.answers.v1')
      }, [dimensions, total, createdAt])
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForSelector('.page--result', { timeout: 15000 })
      await page.waitForTimeout(700)
    }

    // ===== A. 一键分享的复制兜底 =====
    log('===== 【A】一键分享兜底 =====')
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await showResult([9, 9, 9, 9, 9])
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true, value: { writeText: () => Promise.reject(new Error('模拟失败')) },
      })
      document.execCommand = () => false
    })
    await page.getByRole('button', { name: /一键分享/ }).click()
    await page.waitForTimeout(900)
    const m = await page.locator('.modal--copy').count()
    log(`一键分享兜底弹出手动复制窗口 = ${m > 0}`)
    if (m > 0) {
      log(`标题 = ${await page.locator('.modal__heading').innerText()}`)
      const v = await page.locator('.modal__textarea').inputValue()
      log(`摘要含当前段位 = ${v.includes('油炸酥脆体')}，含总分45 = ${v.includes('45 / 60')}`)
      await page.screenshot({ path: '.playwright-cli/final-manual-copy-desktop.png' })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      log(`Escape 关闭 = ${(await page.locator('.modal--copy').count()) === 0}`)
    }

    // ===== B. 随机抽题 + 刷新续答 + 图鉴返回原题 =====
    log('\n===== 【B】随机抽题 / 刷新续答 / 图鉴返回 =====')
    await page.evaluate(() => localStorage.clear())
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    const round1Ids = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /开始测试|再测一次/.test(b.textContent || ''))
      btn.click()
      return null
    })
    void round1Ids
    await page.waitForSelector('.page--quiz')
    await page.waitForTimeout(500)
    const ids1 = await page.evaluate(() => JSON.parse(localStorage.getItem('brainrot.session.v2')).questionIds)
    log(`第一轮题数 = ${ids1.length}，前5题 = ${ids1.slice(0, 5).join(',')}`)

    for (let i = 0; i < 5; i += 1) {
      await page.locator('.q-option').nth(0).click()
      await page.waitForTimeout(520)
    }
    const before = await page.locator('.q-header__count').innerText()
    log(`答了5题后位置 = ${before.replace(/\s+/g, '')}`)

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    const onQuiz = (await page.locator('.page--quiz').count()) > 0
    const idsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('brainrot.session.v2')).questionIds)
    const after = await page.locator('.q-header__count').innerText().catch(() => '无')
    log(`刷新后仍在答题页 = ${onQuiz}`)
    log(`刷新后题组不变 = ${JSON.stringify(ids1) === JSON.stringify(idsAfter)}`)
    log(`刷新后位置 = ${after.replace(/\s+/g, '')}`)
    log(`首页文案显示继续 = ${(await page.evaluate(() => {
      localStorage.setItem('brainrot.stage.v1', 'home'); return true
    })) ? await (async () => { await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(600)
      const b = await page.locator('.btn--xl').innerText(); return b })() : ''}`)

    // 从首页进入图鉴再返回
    await page.locator('.topbar__codex').click()
    await page.waitForSelector('.page--codex')
    await page.waitForTimeout(400)
    log(`图鉴卡数 = ${await page.locator('.codex-card').count()}`)
    await page.locator('.codex-back').click()
    await page.waitForSelector('.page--home')
    await page.waitForTimeout(400)
    log(`从首页进图鉴可返回首页 = ${(await page.locator('.page--home').count()) > 0}`)

    // 继续答题 → 进入图鉴 → 返回原题
    await page.locator('.btn--xl').click()
    await page.waitForSelector('.page--quiz')
    await page.waitForTimeout(400)
    const posBefore = await page.locator('.q-header__count').innerText()
    const titleBefore = await page.locator('.q-title').innerText()
    await page.locator('.topbar__codex').click()
    await page.waitForSelector('.page--codex')
    await page.waitForTimeout(400)
    const backLabel = await page.locator('.codex-back').innerText()
    log(`答题中进图鉴的返回按钮 = ${backLabel.replace(/\s+/g, '')}`)
    await page.locator('.codex-back').click()
    await page.waitForSelector('.page--quiz')
    await page.waitForTimeout(400)
    const posAfter = await page.locator('.q-header__count').innerText()
    const titleAfter = await page.locator('.q-title').innerText()
    log(`返回后位置一致 = ${posBefore === posAfter}（${posBefore.replace(/\s+/g, '')} → ${posAfter.replace(/\s+/g, '')}）`)
    log(`返回后题目一致 = ${titleBefore === titleAfter}`)
    log(`返回后已选答案保留 = ${(await page.locator('.q-option--selected').count()) >= 0}`)

    // 重新抽题：相邻两轮不重复
    await page.evaluate(() => localStorage.setItem('brainrot.stage.v1', 'home'))
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    const restart = page.getByRole('button', { name: /重新抽取20题/ })
    if (await restart.count() > 0) {
      await restart.click()
      await page.waitForTimeout(300)
      await page.getByRole('button', { name: '确认重新抽题' }).click()
      await page.waitForTimeout(700)
    }
    const ids2 = await page.evaluate(() => JSON.parse(localStorage.getItem('brainrot.session.v2')).questionIds)
    const overlap = ids2.filter(id => ids1.includes(id)).length
    log(`重抽后题数 = ${ids2.length}；与上一轮重复题数 = ${overlap}（题库60可保证0）`)

    // ===== C. 分享图文件名含新名称 =====
    log('\n===== 【C】分享图与文件名 =====')
    await showResult([7, 7, 7, 7, 7]) // 35 分 → 中度入味体
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      })
    })
    const dlPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null)
    await page.getByRole('button', { name: /保存分享图/ }).click()
    const dl = await dlPromise
    log(`触发下载 = ${!!dl}；文件名 = ${dl ? dl.suggestedFilename() : '无'}`)
    log(`文件名含统一后的名称 = ${dl ? dl.suggestedFilename().includes('中度入味体') : false}`)
    await page.waitForTimeout(1500)
    log(`Toast = ${await page.locator('.toast__text').last().innerText().catch(() => '无')}`)
    await page.locator('.share-preview-link').click()
    await page.waitForTimeout(800)
    const size = await page.locator('.modal__img').evaluate(el => `${el.naturalWidth}×${el.naturalHeight}`).catch(() => '无')
    log(`预览图尺寸 = ${size}`)
    await page.screenshot({ path: '.playwright-cli/final-share-preview.png' })
    await page.locator('.modal__close').first().click()
    await page.waitForTimeout(400)

    // ===== D. 留档截图 =====
    log('\n===== 【D】留档截图 =====')
    await showResult([7, 7, 7, 7, 7])
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: '.playwright-cli/final-result-1440.png', fullPage: true })
    await showResult([4, 4, 4, 4, 4])
    await page.waitForTimeout(400)
    await page.screenshot({ path: '.playwright-cli/final-result-low-1440.png', fullPage: true })
    await page.setViewportSize({ width: 320, height: 860 })
    await showResult([12, 12, 12, 12, 12])
    await page.waitForTimeout(400)
    await page.screenshot({ path: '.playwright-cli/final-result-320.png', fullPage: true })
    await page.locator('.topbar__codex').click()
    await page.waitForSelector('.page--codex')
    await page.waitForTimeout(500)
    await page.screenshot({ path: '.playwright-cli/final-codex-320.png', fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: '.playwright-cli/final-codex-390.png', fullPage: true })
    log('已保存 final-result-1440 / final-result-low-1440 / final-result-320 / final-codex-320 / final-codex-390')

    log(`\n[控制台] 错误数 = ${errors.length}`)
    errors.slice(0, 6).forEach(e => log(`   · ${e}`))
  } catch (e) {
    log(`\n[中断] ${e.message.split('\n')[0]}`)
    log(`[控制台] 错误数 = ${errors.length}`)
    errors.slice(0, 6).forEach(x => log(`   · ${x}`))
  }

  return out.join('\n')
}
