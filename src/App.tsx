import { useState, useRef, useEffect } from 'react'
import './App.css'

// Size presets
const SIZES = {
  widescreen: { width: 1920, height: 1080, label: 'Widescreen (16:9)' },
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
}

// Brand colors - Updated to match real Novig slips
const COLORS = {
  background: '#0f0f0f',
  cardBg: '#1a1a1a',
  confetti: '#d4a855',
  text: '#ffffff',
  textMuted: '#888888',
  pillWon: '#22c55e',
  pillLost: '#ef4444',
  pillPending: '#eab308',
  accent: '#38bdf8',
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

// Generate random bet ID
const generateBetId = () => {
  return Math.random().toString(16).slice(2, 14)
}

// Get today's date formatted
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

  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [cashImage, setCashImage] = useState<HTMLImageElement | null>(null)

  // Load assets on mount
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
      loadImage('/Novig_Logo.svg'),
      loadImage('/Novig-Cash.png'),
    ]).then(([logo, cash]) => {
      setLogoImage(logo)
      setCashImage(cash)
    })
  }, [])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !logoImage || !cashImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = SIZES[data.size]
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Clear canvas with dark background
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Card dimensions with padding
    const padding = data.size === 'square' ? 60 : 80
    const cardX = padding
    const cardY = padding
    const cardWidth = CANVAS_WIDTH - padding * 2
    const cardHeight = CANVAS_HEIGHT - padding * 2
    const cardRadius = 40

    // Draw card background (dark with rounded corners)
    ctx.fillStyle = COLORS.cardBg
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius)
    ctx.fill()

    // Draw gold confetti at top of card
    const confettiHeight = 180
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardWidth, confettiHeight, [cardRadius, cardRadius, 0, 0])
    ctx.clip()

    // Draw confetti particles
    const random = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    for (let i = 0; i < 60; i++) {
      const x = cardX + random(i * 1.1) * cardWidth
      const y = cardY + random(i * 2.2) * confettiHeight
      const size = 4 + random(i * 3.3) * 12
      const rotation = random(i * 4.4) * Math.PI * 2

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillStyle = COLORS.confetti
      ctx.globalAlpha = 0.3 + random(i * 5.5) * 0.5

      // Mix of shapes
      if (i % 3 === 0) {
        ctx.fillRect(-size/2, -size/4, size, size/2)
      } else if (i % 3 === 1) {
        ctx.beginPath()
        ctx.arc(0, 0, size/3, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(0, -size/2)
        ctx.lineTo(size/3, size/2)
        ctx.lineTo(-size/3, size/2)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.restore()

    // Draw logo with proper padding (40px from edges)
    const logoWidth = 160
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth
    ctx.drawImage(logoImage, cardX + 40, cardY + 40, logoWidth, logoHeight)

    // Draw trophy icon for winning bets
    if (data.status === 'Won') {
      ctx.font = '80px serif'
      ctx.fillText('🏆', cardX + cardWidth - 130, cardY + 100)
    }

    // Draw status pill (top right area)
    const pillWidth = 120
    const pillHeight = 50
    const pillX = cardX + cardWidth - pillWidth - 50
    const pillY = cardY + 130

    const statusColors: Record<Status, string> = {
      Won: COLORS.pillWon,
      Lost: COLORS.pillLost,
      Pending: COLORS.pillPending,
    }

    ctx.fillStyle = statusColors[data.status]
    ctx.beginPath()
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2)
    ctx.fill()

    ctx.fillStyle = data.status === 'Pending' ? '#000000' : '#ffffff'
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.status, pillX + pillWidth / 2, pillY + pillHeight / 2 + 10)
    ctx.textAlign = 'left'

    // Content area starts below confetti
    const contentY = cardY + confettiHeight + 40
    const contentX = cardX + 50
    const contentWidth = cardWidth - 100

    // Market question (big text)
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 56px system-ui, -apple-system, sans-serif'

    // Word wrap the question
    const words = data.marketQuestion.split(' ')
    let line = ''
    let y = contentY + 60
    const lineHeight = 70
    const maxWidth = contentWidth - 150

    for (const word of words) {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), contentX, y)
        line = word + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), contentX, y)

    // Odds + Bet type line
    const oddsY = y + 60
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '36px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${data.odds}  ·  ${data.betType}`, contentX, oddsY)

    // Amount → Paid section (centered)
    const amountSectionY = data.size === 'square' ? oddsY + 180 : oddsY + 120
    const centerX = cardX + cardWidth / 2
    const spacing = data.size === 'square' ? 200 : 250

    // Amount
    const cashIconSize = 50
    ctx.drawImage(cashImage, centerX - spacing - 30, amountSectionY - 35, cashIconSize, cashIconSize)
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.amount, centerX - spacing + 60, amountSectionY)

    // Arrow
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '48px system-ui, -apple-system, sans-serif'
    ctx.fillText('→', centerX, amountSectionY)

    // Paid
    ctx.drawImage(cashImage, centerX + spacing - 100, amountSectionY - 35, cashIconSize, cashIconSize)
    ctx.fillStyle = data.status === 'Won' ? COLORS.pillWon : COLORS.text
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif'
    ctx.fillText(data.paid, centerX + spacing, amountSectionY)

    // Labels under amounts
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '28px system-ui, -apple-system, sans-serif'
    ctx.fillText('Amount', centerX - spacing + 40, amountSectionY + 45)
    ctx.fillText('Paid', centerX + spacing - 20, amountSectionY + 45)
    ctx.textAlign = 'left'

    // Footer with Bet ID and Date
    const footerY = cardY + cardHeight - 50
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '24px system-ui, -apple-system, sans-serif'
    ctx.fillText(`ID: ${data.betId}`, contentX, footerY)

    ctx.textAlign = 'right'
    ctx.fillText(`Placed: ${data.datePlaced}`, cardX + cardWidth - 50, footerY)
    ctx.textAlign = 'left'

  }, [logoImage, cashImage, data])

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
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        alert('Copied to clipboard!')
      }
    })
  }

  const currentSize = SIZES[data.size]

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Controls Panel */}
      <div className="w-[360px] bg-slate-800 p-6 overflow-y-auto border-r border-slate-700">
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
                placeholder="-145"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bet Type</label>
              <input
                type="text"
                value={data.betType}
                onChange={e => setData(prev => ({ ...prev, betType: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="Moneyline"
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
                placeholder="0.95"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Paid</label>
              <input
                type="text"
                value={data.paid}
                onChange={e => setData(prev => ({ ...prev, paid: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="1.60"
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
