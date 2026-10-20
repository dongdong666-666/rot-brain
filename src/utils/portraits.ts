import type { Tier } from '../data/tiers'

/** 与 Vite 的 /rot-brain/ 等子目录部署前缀兼容，不依赖外站热链。 */
export function getPortraitUrl(tier: Pick<Tier, 'portrait'>): string {
  return import.meta.env.BASE_URL + tier.portrait
}

/** 分享图只读取同源本地图片；失败时由导出器绘制图标回退。 */
export function loadPortraitImage(tier: Pick<Tier, 'portrait'>): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    const timer = window.setTimeout(() => {
      image.onload = null
      image.onerror = null
      resolve(null)
    }, 8000)
    image.onload = () => {
      window.clearTimeout(timer)
      resolve(image.naturalWidth > 0 ? image : null)
    }
    image.onerror = () => {
      window.clearTimeout(timer)
      resolve(null)
    }
    image.src = getPortraitUrl(tier)
  })
}
