import { useState, useRef, useEffect } from 'react'
import './App.css'

const SIZES = {
  widescreen: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
}

const COLORS = {
  background: '#0f172a',
  contentBg: '#1a1a1a',
  text: '#ffffff',
  textMuted: '#6b7280',
  green: '#22c55e',
  pillWon: '#22c55e',
  pillLost: '#ef4444',
  pillPending: '#eab308',
}

type Status = 'Won' | 'Lost' | 'Pending'
type SizeKey = 'widescreen' | 'square'

interface BetslipData {
  marketQuestion: string
  odds: string
  betType: string
  amount: string
  paid: string
  status: Status
  betId: string
  datePlaced: string
  size: SizeKey
}

const generateBetId = () => Math.random().toString(16).slice(2, 14)
const getTodayDate = () => {
  const d = new Date()
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [data, setData] = useState<BetslipData>({
    marketQuestion: 'Will the Bills win the Super Bowl?',
    odds: '-145',
    betType: 'Moneyline',
    amount: '0.95',
    paid: '1.60',
    status: 'Won',
    betId: generateBetId(),
    datePlaced: getTodayDate(),
    size: 'widescreen',
  })

  const [bannerImg, setBannerImg] = useState<HTMLImageElement | null>(null)
  const [cashImg, setCashImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image()
      img.onload = () => res(img)
      img.onerror = rej
      img.src = src
    })
    Promise.all([load('/novig_bg.png'), load('/Novig-Cash.png')]).then(([b, c]) => {
      setBannerImg(b)
      setCashImg(c)
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !bannerImg || !cashImg) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width: W, height: H } = SIZES[data.size]
    canvas.width = W
    canvas.height = H

    // Background
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, W, H)

    // Card dimensions
    const pad = 40
    const cardX = pad
    const cardY = pad
    const cardW = W - pad * 2
    const cardH = H - pad * 2
    const radius = 24

    // Banner height - taller to show logo properly
    const bannerH = 160

    // Draw content area first (dark background)
    ctx.fillStyle = COLORS.contentBg
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, radius)
    ctx.fill()

    // Draw banner image at top - scale to fit width, align to TOP
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, bannerH, [radius, radius, 0, 0])
    ctx.clip()

    // Scale image to fill width, draw from TOP (not centered)
    const scale = cardW / bannerImg.width
    const scaledH = bannerImg.height * scale
    ctx.drawImage(bannerImg, cardX, cardY, cardW, scaledH)
    ctx.restore()

    // Trophy for wins (top right of banner)
    if (data.status === 'Won') {
      ctx.font = '56px serif'
      ctx.textAlign = 'left'
      ctx.fillText('🏆', cardX + cardW - 170, cardY + 70)
    }

    // Status pill (below trophy, in banner area)
    const pillW = 90
    const pillH = 38
    const pillX = cardX + cardW - pillW - 24
    const pillY = cardY + bannerH - pillH - 16

    ctx.fillStyle = data.status === 'Won' ? COLORS.pillWon : data.status === 'Lost' ? COLORS.pillLost : COLORS.pillPending
    ctx.beginPath()
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2)
    ctx.fill()

    ctx.fillStyle = data.status === 'Pending' ? '#000' : '#fff'
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(data.status, pillX + pillW / 2, pillY + pillH / 2)

    // Content below banner
    const centerX = cardX + cardW / 2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    // Market question
    let textY = cardY + bannerH + 60
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 52px system-ui, sans-serif'

    // Word wrap
    const words = data.marketQuestion.split(' ')
    let line = ''
    const maxW = cardW - 120
    const lineH = 62

    for (const word of words) {
      const test = line + word + ' '
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), centerX, textY)
        line = word + ' '
        textY += lineH
      } else {
        line = test
      }
    }
    ctx.fillText(line.trim(), centerX, textY)

    // Odds line
    textY += 50
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillText(`${data.odds}  ·  ${data.betType}`, centerX, textY)

    // === HERO: Amount → Paid ===
    const heroY = textY + (data.size === 'square' ? 160 : 120)
    const cashSize = 65
    const gap = data.size === 'square' ? 300 : 380

    // Amount (left side)
    const amtX = centerX - gap / 2
    ctx.drawImage(cashImg, amtX - 45, heroY - 48, cashSize, cashSize)
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 96px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.amount, amtX + 50, heroY)

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillText('Amount', amtX + 30, heroY + 50)

    // Arrow
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '64px system-ui, sans-serif'
    ctx.fillText('→', centerX, heroY - 5)

    // Paid (right side)
    const paidX = centerX + gap / 2
    ctx.drawImage(cashImg, paidX - 45, heroY - 48, cashSize, cashSize)
    ctx.fillStyle = COLORS.green
    ctx.font = 'bold 96px system-ui, sans-serif'
    ctx.fillText(data.paid, paidX + 50, heroY)

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillText('Paid', paidX + 30, heroY + 50)

    // Footer
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '22px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`ID: ${data.betId}   ·   Placed: ${data.datePlaced}`, centerX, cardY + cardH - 36)

  }, [bannerImg, cashImg, data])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `novig-slip-${data.betId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleCopy = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => {
      if (blob) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        alert('Copied!')
      }
    })
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#0f172a' }}>
      <div className="w-[360px] p-6 overflow-y-auto border-r border-slate-700" style={{ backgroundColor: '#1e293b' }}>
        <h1 className="text-2xl font-bold text-white mb-6">Novig Slip Machine</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Market Question</label>
            <textarea
              value={data.marketQuestion}
              onChange={e => setData(p => ({ ...p, marketQuestion: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Odds</label>
              <input type="text" value={data.odds} onChange={e => setData(p => ({ ...p, odds: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bet Type</label>
              <input type="text" value={data.betType} onChange={e => setData(p => ({ ...p, betType: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Amount</label>
              <input type="text" value={data.amount} onChange={e => setData(p => ({ ...p, amount: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Paid</label>
              <input type="text" value={data.paid} onChange={e => setData(p => ({ ...p, paid: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select value={data.status} onChange={e => setData(p => ({ ...p, status: e.target.value as Status }))}
              className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none">
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bet ID</label>
              <input type="text" value={data.betId} onChange={e => setData(p => ({ ...p, betId: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date Placed</label>
              <input type="text" value={data.datePlaced} onChange={e => setData(p => ({ ...p, datePlaced: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Size</label>
            <select value={data.size} onChange={e => setData(p => ({ ...p, size: e.target.value as SizeKey }))}
              className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none">
              <option value="widescreen">Widescreen (1920x1080)</option>
              <option value="square">Square (1080x1080)</option>
            </select>
          </div>
          <button onClick={() => setData(p => ({ ...p, betId: generateBetId() }))}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg text-sm">
            Generate New Bet ID
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
        <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-2xl" style={{ maxHeight: 'calc(100vh - 200px)' }} />
        <div className="flex gap-4 mt-6">
          <button onClick={handleCopy} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
