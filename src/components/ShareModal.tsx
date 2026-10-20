import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ShareModalProps {
  imageUrl: string
  onClose: () => void
}

/**
 * 分享图预览弹窗。
 * 使用 Portal 挂到 body，避免被 .page 的 transform 动画影响 fixed 定位。
 */
export default function ShareModal({ imageUrl, onClose }: ShareModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label="分享图预览" onClick={onClose}>
      <div className="modal__body" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal__close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <p className="modal__title">长按图片保存，分享到任意平台</p>
        <img className="modal__img" src={imageUrl} alt="脑腐指数测试结果分享图" />
      </div>
    </div>,
    document.body,
  )
}
