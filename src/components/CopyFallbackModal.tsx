import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface CopyFallbackModalProps {
  /** 弹窗标题，区分「复制失败」与「分享失败」两种入口 */
  title: string
  /** 本次结果的完整摘要，必须是当前结果，不能残留上一次 */
  text: string
  /** 顶部说明 */
  hint: string
  onClose: () => void
  /** 关闭后焦点返回的元素，通常是触发复制的按钮 */
  returnFocusTo?: HTMLElement | null
}

/**
 * 自动复制失败时的手动复制弹窗。
 * 提供真实可操作的只读文本框：可选中、可长按、可 Ctrl/Cmd+C。
 * 使用 Portal 挂到 body，避免被 .page 的 transform 动画影响 fixed 定位。
 */
export default function CopyFallbackModal({
  title,
  text,
  hint,
  onClose,
  returnFocusTo,
}: CopyFallbackModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 打开即聚焦并全选，方便直接按 Ctrl/Cmd+C
    const el = textareaRef.current
    if (el) {
      el.focus()
      el.select()
    }

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // 关闭后把焦点还给触发按钮
      const target = returnFocusTo
      if (target && document.body.contains(target)) {
        window.requestAnimationFrame(() => target.focus())
      }
    }
  }, [onClose, returnFocusTo])

  const selectAll = () => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.select()
  }

  return createPortal(
    <div
      className="modal modal--copy"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="modal__body" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="modal__heading">{title}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="关闭手动复制窗口"
            ref={closeRef}
          >
            ×
          </button>
        </div>

        <p className="modal__hint">{hint}</p>

        <textarea
          ref={textareaRef}
          className="modal__textarea"
          value={text}
          readOnly
          rows={12}
          spellCheck={false}
          aria-label="结果摘要，可选中后复制"
          onFocus={(e) => e.currentTarget.select()}
        />

        <p className="modal__hint modal__hint--soft">
          电脑端可按 Ctrl / ⌘ + C；手机上长按文本框即可选择复制。
        </p>

        <div className="modal__actions">
          <button type="button" className="btn btn--secondary" onClick={selectAll}>
            全选文本
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            完成，关闭
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
