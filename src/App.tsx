import { useState, useRef, useEffect } from 'react'
import './App.css'

// Size presets
const SIZES = {
  widescreen: { width: 1920, height: 1080, label: 'Widescreen (16:9)' },
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
}

// Brand colors
const COLORS = {
  background: '#0f172a',
  cardBg: '#0f172a',
  contentBg: '#1a1a1a',
  text: '#ffffff',
  textMuted: '#888888',
  pillWon: '#22c55e',
  pillLost: '#ef4444',
  pillPending: '#eab308',
  green: '#22c55e',
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
  const today = new Date()
  return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [data, setData] = useState<BetslipData>({
    marketQuestion: 'Will the Buffalo Bills win Super Bowl LIX?',
    odds: '-145',
    betType: 'Moneyline',
    amount: '0.95',
    paid: '1.60',
    status: 'Won',
    betId: generateBetId(),
    datePlaced: getTodayDate(),
    size: 'widescreen',
  })

  const [bannerImage, setBannerImage] = useState<HTMLImageElement | null>(null)
  const [cashImage, setCashImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    Promise.all([
      loadImage('/novig_bg.png'),
      loadImage('/Novig-Cash.png'),
    ]).then(([banner, cash]) => {
      setBannerImage(banner)
      setCashImage(cash)
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !bannerImage || !cashImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width: W, height: H } = SIZES[data.size]
    canvas.width = W
    canvas.height = H

    // Fill entire canvas with background color (no contrast with card)
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, W, H)

    // Card dimensions
    const padding = 40
    const cardX = padding
    const cardY = padding
    const cardW = W - padding * 2
    const cardH = H - padding * 2
    const radius = 30

    // Banner height
    const bannerH = 150

    // Draw dark content area (below banner)
    ctx.fillStyle = COLORS.contentBg
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, radius)
    ctx.fill()

    // Draw blue banner at top using novig_bg.png
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, bannerH, [radius, radius, 0, 0])
    ctx.clip()

    // Stretch banner to full card width
    const bannerScale = cardW / bannerImage.width
    const scaledBannerH = bannerImage.height * bannerScale
    ctx.drawImage(bannerImage, cardX, cardY - (scaledBannerH - bannerH) / 2, cardW, scaledBannerH)
    ctx.restore()

    // Trophy + Status pill in top right of blue banner area
    if (data.status === 'Won') {
      ctx.font = '64px serif'
      ctx.fillText('🏆', cardX + cardW - 200, cardY + 90)
    }

    // Status pill
    const pillW = 100
    const pillH = 44
    const pillX = cardX + cardW - pillW - 30
    const pillY = cardY + bannerH - pillH - 20

    const statusColors: Record<Status, string> = {
      Won: COLORS.pillWon,
      Lost: COLORS.pillLost,
      Pending: COLORS.pillPending,
    }

    ctx.fillStyle = statusColors[data.status]
    ctx.beginPath()
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2)
    ctx.fill()

    ctx.fillStyle = data.status === 'Pending' ? '#000' : '#fff'
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.status, pillX + pillW / 2, pillY + pillH / 2 + 8)

    // Content area starts below banner
    const contentY = cardY + bannerH + 30
    const centerX = cardX + cardW / 2

    // Market question (centered)
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'

    // Word wrap the question
    const words = data.marketQuestion.split(' ')
    let line = ''
    let y = contentY + 50
    const lineHeight = 58
    const maxWidth = cardW - 100

    for (const word of words) {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), centerX, y)
        line = word + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), centerX, y)

    // Odds + Bet type line (centered)
    const oddsY = y + 50
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '32px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${data.odds}  ·  ${data.betType}`, centerX, oddsY)

    // === HERO SECTION: Amount → Paid (HUGE, CENTERED) ===
    const heroY = data.size === 'square' ? oddsY + 140 : oddsY + 100
    const cashSize = 70
    const spacing = data.size === 'square' ? 180 : 220

    // Amount
    ctx.drawImage(cashImage, centerX - spacing - 80, heroY - 50, cashSize, cashSize)
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 96px system-ui, -apple-system, sans-serif'
    ctx.fillText(data.amount, centerX - spacing + 40, heroY + 10)

    // Arrow
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '72px system-ui, -apple-system, sans-serif'
    ctx.fillText('→', centerX, heroY + 10)

    // Paid (GREEN)
    ctx.drawImage(cashImage, centerX + spacing - 120, heroY - 50, cashSize, cashSize)
    ctx.fillStyle = COLORS.green
    ctx.font = 'bold 96px system-ui, -apple-system, sans-serif'
    ctx.fillText(data.paid, centerX + spacing + 10, heroY + 10)

    // Labels under amounts
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '28px system-ui, -apple-system, sans-serif'
    ctx.fillText('Amount', centerX - spacing + 20, heroY + 55)
    ctx.fillText('Paid', centerX + spacing - 10, heroY + 55)

    // Footer (centered)
    const footerY = cardY + cardH - 40
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '22px system-ui, -apple-system, sans-serif'
    ctx.fillText(`ID: ${data.betId}   ·   Placed: ${data.datePlaced}`, centerX, footerY)

    ctx.textAlign = 'left'

  }, [bannerImage, cashImage, data])

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `novig-slip-${data.betId}.png`
    link.href = dataUrl
    link.click()
  }

  const handleCopy = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        alert('Copied to clipboard!')
      }
    })
  }

  const currentSize = SIZES[data.size]

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Controls Panel */}
      <div className="w-[360px] p-6 overflow-y-auto border-r border-slate-700" style={{ backgroundColor: '#1e293b' }}>
        <h1 className="text-2xl font-bold text-white mb-6">Novig Slip Machine</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Market Question</label>
            <textarea
              value={data.marketQuestion}
              onChange={e => setData(prev => ({ ...prev, marketQuestion: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Odds</label>
              <input
                type="text"
                value={data.odds}
                onChange={e => setData(prev => ({ ...prev, odds: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bet Type</label>
              <input
                type="text"
                value={data.betType}
                onChange={e => setData(prev => ({ ...prev, betType: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Amount</label>
              <input
                type="text"
                value={data.amount}
                onChange={e => setData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Paid</label>
              <input
                type="text"
                value={data.paid}
                onChange={e => setData(prev => ({ ...prev, paid: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={data.status}
              onChange={e => setData(prev => ({ ...prev, status: e.target.value as Status }))}
              className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bet ID</label>
              <input
                type="text"
                value={data.betId}
                onChange={e => setData(prev => ({ ...prev, betId: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date Placed</label>
              <input
                type="text"
                value={data.datePlaced}
                onChange={e => setData(prev => ({ ...prev, datePlaced: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Size</label>
            <select
              value={data.size}
              onChange={e => setData(prev => ({ ...prev, size: e.target.value as SizeKey }))}
              className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="widescreen">Widescreen (1920x1080)</option>
              <option value="square">Square (1080x1080)</option>
            </select>
          </div>

          <button
            onClick={() => setData(prev => ({ ...prev, betId: generateBetId() }))}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Generate New Bet ID
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={currentSize.width}
            height={currentSize.height}
            className="max-w-full h-auto rounded-lg shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
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
