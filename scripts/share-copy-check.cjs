/**
 * 复制 / 下载反馈专项验证（开发用，不参与打包）。
 * 执行：playwright-cli run-code --filename=scripts/share-copy-check.cjs
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

    // ================= 1. 自动复制成功 =================
    log('===== 【1】自动复制成功 =====')
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    await showResult([8, 8, 8, 8, 8])
    await page.getByRole('button', { name: /复制结果摘要/ }).click()
    await page.waitForTimeout(700)
    const okToast = await page.locator('.toast__text').first().innerText().catch(() => '无')
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => '(读取受限)'))
    log(`Toast = ${okToast}`)
    log(`按钮文案 = ${await page.getByRole('button', { name: /复制|已复制/ }).first().innerText()}`)
    log(`剪贴板含段位 = ${clip.includes('充分煮熟体')}；前30字 = ${clip.slice(0, 30).replace(/\n/g, '⏎')}`)
    log(`未弹出手动复制窗口 = ${(await page.locator('.modal--copy').count()) === 0}`)

    // ================= 2. 自动复制失败 → 手动复制弹窗 =================
    log('\n===== 【2】自动复制失败 → 手动复制弹窗 =====')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('模拟失败')) },
      })
      document.execCommand = () => false
    })
    // 等上一条成功提示消失，避免读到旧 Toast
    await page.waitForTimeout(3000)
    await page.getByRole('button', { name: /复制结果摘要|已复制/ }).first().click()
    await page.waitForTimeout(800)
    const failToast = await page.locator('.toast__text').last().innerText().catch(() => '无')
    const modalShown = (await page.locator('.modal--copy').count()) > 0
    log(`Toast = ${failToast}`)
    log(`弹出手动复制窗口 = ${modalShown}`)
    if (modalShown) {
      const ta = page.locator('.modal__textarea')
      const value = await ta.inputValue()
      log(`文本框内容长度 = ${value.length}`)
      log(`文本框为只读 = ${await ta.getAttribute('readonly') !== null}`)
      log(`文本框含总分40 = ${value.includes('40 / 60')}`)
      log(`文本框含段位 = ${value.includes('充分煮熟体')}`)
      log(`文本框含免责声明 = ${value.includes('不是医学诊断')}`)
      log(`提示文案 = ${(await page.locator('.modal__hint').first().innerText()).replace(/\s+/g, ' ')}`)
      log(`操作提示 = ${(await page.locator('.modal__hint--soft').innerText()).replace(/\s+/g, ' ')}`)

      // 全选按钮
      await page.getByRole('button', { name: '全选文本' }).click()
      await page.waitForTimeout(300)
      const selected = await page.locator('.modal__textarea').evaluate(el => el.selectionEnd - el.selectionStart)
      log(`点「全选文本」后选中字符数 = ${selected}（应等于 ${value.length}）`)

      // Escape 关闭 + 焦点返回
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      log(`Escape 关闭弹窗 = ${(await page.locator('.modal--copy').count()) === 0}`)
      const focused = await page.evaluate(() => {
        const el = document.activeElement
        return el ? (el.textContent || '').trim().slice(0, 20) : '(无)'
      })
      log(`关闭后焦点元素 = ${focused}`)

      // 关闭按钮也可用
      await page.getByRole('button', { name: /复制结果摘要|已复制/ }).first().click()
      await page.waitForTimeout(700)
      log(`再次弹出 = ${(await page.locator('.modal--copy').count()) > 0}`)
      await page.locator('.modal--copy .modal__close').click()
      await page.waitForTimeout(400)
      log(`关闭按钮生效 = ${(await page.locator('.modal--copy').count()) === 0}`)
    }

    // ================= 3. 重新测试后不残留旧摘要 =================
    log('\n===== 【3】重新测试后不残留旧摘要 =====')
    const beforeText = await page.evaluate(() => {
      const el = document.querySelector('.modal__textarea')
      return el ? el.value : '(已关闭)'
    })
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('模拟失败')) },
      })
      document.execCommand = () => false
    })
    await page.getByRole('button', { name: '重新测试' }).click()
    await page.waitForSelector('.page--quiz')
    await page.waitForTimeout(500)
    log(`重新测试后进入答题页 = ${(await page.locator('.page--quiz').count()) > 0}`)
    log(`重新测试后手动复制窗口已关闭 = ${(await page.locator('.modal--copy').count()) === 0}`)

    // 答完 20 题后看新结果（选项本轮已洗牌，不假定某一位置就是最高分）
    for (let i = 0; i < 20; i += 1) {
      const count = await page.locator('.q-option').count()
      await page.locator('.q-option').nth(i % count === 0 ? 0 : 2).click()
      await page.waitForTimeout(520)
    }
    await page.getByRole('button', { name: /查看我的脑腐段位/ }).click()
    await page.waitForSelector('.page--result')
    await page.waitForTimeout(1200)
    const newTotalText = (await page.locator('.score-card__value').innerText()).replace(/\s+/g, '')
    const newTotalNum = newTotalText.split('/')[0].trim()
    log(`新结果总分 = ${newTotalText}`)
    await page.getByRole('button', { name: /复制结果摘要/ }).click()
    await page.waitForTimeout(800)
    const afterText = await page.locator('.modal__textarea').inputValue().catch(() => '(未弹出)')
    log(`新窗口摘要含新总分 = ${afterText.includes(`${newTotalNum} / 60`)}`)
    log(`新摘要与旧摘要不同 = ${afterText !== beforeText}`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)

    // ================= 4. 下载反馈（桌面） =================
    log('\n===== 【4】下载反馈（桌面） =====')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      })
    })
    await page.getByRole('button', { name: /保存分享图/ }).click()
    await page.waitForTimeout(2200)
    const dlToast = await page.locator('.toast__text').first().innerText().catch(() => '无')
    log(`Toast = ${dlToast}`)
    log(`提示改为「已发起下载」= ${dlToast.includes('已发起图片下载')}`)
    log(`未声称保存成功 = ${!dlToast.includes('已保存')}`)
    const previewLink = await page.locator('.share-preview-link').count()
    log(`保留「查看已生成的分享图」入口 = ${previewLink > 0}`)
    if (previewLink > 0) {
      await page.locator('.share-preview-link').click()
      await page.waitForTimeout(700)
      const imgOk = await page.locator('.modal__img').evaluate(el => el.naturalWidth > 100 && el.naturalHeight > 300).catch(() => false)
      const size = await page.locator('.modal__img').evaluate(el => `${el.naturalWidth}×${el.naturalHeight}`).catch(() => '无')
      log(`预览图可用 = ${imgOk}（${size}）`)
      await page.locator('.modal__close').first().click()
      await page.waitForTimeout(400)
    }

    // ================= 5. 移动端预览长按保存 =================
    log('\n===== 【5】移动端预览 =====')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      })
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: /保存分享图/ }).click()
    await page.waitForTimeout(2000)
    const mToast = await page.locator('.toast__text').first().innerText().catch(() => '无')
    const mModal = (await page.locator('.modal__img').count()) > 0
    log(`Toast = ${mToast}`)
    log(`弹出预览 = ${mModal}`)
    log(`提示 = ${mModal ? await page.locator('.modal__title').innerText() : '无'}`)
    if (mModal) {
      const box = await page.locator('.modal__body').evaluate(el => {
        const r = el.getBoundingClientRect()
        return { y: Math.round(r.y), h: Math.round(r.height), vh: window.innerHeight }
      })
      log(`弹窗位置 y=${box.y} 高=${box.h} 视口=${box.vh} → 可见 = ${box.y >= 0 && box.y < box.vh}`)
      await page.locator('.modal__close').first().click()
      await page.waitForTimeout(300)
    }

    // ================= 6. 生成失败时不显示成功 =================
    log('\n===== 【6】图片生成失败反馈 =====')
    await page.setViewportSize({ width: 1280, height: 900 })
    // 先换一份新结果，清掉上一次已缓存的分享图，确保重新走生成流程
    await page.evaluate(() => {
      localStorage.setItem('brainrot.result.v1', JSON.stringify({
        total: 44, createdAt: 1700000000999,
        dimensions: ['shortvideo', 'slang', 'attention', 'cocoon', 'cyber']
          .map((key, i) => ({ key, score: [8, 9, 9, 9, 9][i] })),
      }))
      localStorage.setItem('brainrot.stage.v1', 'result')
    })
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('.page--result')
    await page.waitForTimeout(800)
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      })
      // 让 canvas 导出直接抛错，模拟生成失败
      HTMLCanvasElement.prototype.toDataURL = function () { throw new Error('模拟导出失败') }
    })
    await page.waitForTimeout(3000) // 清掉残留 Toast
    await page.getByRole('button', { name: /保存分享图/ }).click()
    await page.waitForTimeout(1800)
    const errToast = await page.locator('.toast__text').last().innerText().catch(() => '无')
    log(`Toast = ${errToast}`)
    log(`显示失败而非成功 = ${errToast.includes('失败') && !errToast.includes('已发起') && !errToast.includes('已保存')}`)
    log(`失败时不弹预览 = ${(await page.locator('.modal__img').count()) === 0}`)

    log(`\n[控制台] 错误数 = ${errors.length}`)
    errors.slice(0, 6).forEach(e => log(`   · ${e}`))
  } catch (e) {
    log(`\n[中断] ${e.message.split('\n')[0]}`)
    log(`[控制台] 错误数 = ${errors.length}`)
    errors.slice(0, 6).forEach(x => log(`   · ${x}`))
  }

  return out.join('\n')
}
