'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TEMPLATES, type Template } from '@/lib/commsTemplates'

export default function CommsPanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Close on Escape, open on custom event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onOpen() { setOpen(true) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('openCommsPanel', onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('openCommsPanel', onOpen)
    }
  }, [])

  function handleSelect(t: Template) {
    setOpen(false)
    router.push(`/comms?send=${t.id}`)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: '#F7620A',
          color: '#fff',
          boxShadow: '0 4px 24px rgba(247,98,10,0.35)',
        }}
        aria-label="Message Parents"
      >
        <span style={{ fontSize: 18 }}>📣</span>
        <span className="hidden sm:inline">Message Parents</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden transition-transform duration-300"
        style={{
          width: 'min(420px, 100vw)',
          backgroundColor: '#080C12',
          borderLeft: '1px solid rgba(241,245,249,0.08)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}
        >
          <div>
            <p className="text-base font-bold text-sp-text">Message Parents</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
              Choose a template to customize &amp; send
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}
          >
            ✕
          </button>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:scale-98"
              style={{
                backgroundColor: '#0E1520',
                border: '1px solid rgba(241,245,249,0.07)',
                minHeight: 64,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,245,249,0.13)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,245,249,0.07)' }}
            >
              {/* Accent bar */}
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: t.accent }} />
              <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sp-text">{t.title}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
                  {t.body}
                </p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }}>→</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          <button
            onClick={() => { setOpen(false); router.push('/comms') }}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(247,98,10,0.1)', color: '#F7620A', border: '1px solid rgba(247,98,10,0.2)' }}
          >
            Open full Comms hub →
          </button>
        </div>
      </div>
    </>
  )
}
