import { useState, useRef, useEffect } from 'react'
import './App.css'

// Canvas dimensions
const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

// Brand colors
const COLORS = {
  dark: '#020617',
  blue: '#38bdf8',
  orange: '#f97316',
  green: '#22c55e',
  light: '#f8fafc',
}

interface BetslipData {
  eventTitle: string
  sideLabel: string
  avgPrice: string
  betAmount: string
  toWinAmount: string
  pillColor: string
  marketImage: string | null
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<BetslipData>({
    eventTitle: 'Will the Buffalo Bills win Super Bowl LIX?',
    sideLabel: 'YES',
    avgPrice: '52¢',
    betAmount: '100.00',
    toWinAmount: '192.00',
    pillColor: COLORS.orange,
    marketImage: null,
  })

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [cashImage, setCashImage] = useState<HTMLImageElement | null>(null)
  const [marketImg, setMarketImg] = useState<HTMLImageElement | null>(null)

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
      loadImage('/novig_bg.png'),
      loadImage('/Novig_Logo.svg'),
      loadImage('/Novig-Cash.png'),
    ]).then(([bg, logo, cash]) => {
      setBgImage(bg)
      setLogoImage(logo)
      setCashImage(cash)
    })
  }, [])

  // Load market image when changed
  useEffect(() => {
    if (data.marketImage) {
      const img = new Image()
      img.onload = () => setMarketImg(img)
      img.src = data.marketImage
    } else {
      setMarketImg(null)
    }
  }, [data.marketImage])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !bgImage || !logoImage || !cashImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = COLORS.dark
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Card dimensions
    const cardPadding = 60
    const cardWidth = CANVAS_WIDTH - cardPadding * 2
    const cardHeight = CANVAS_HEIGHT - cardPadding * 2
    const cardX = cardPadding
    const cardY = cardPadding

    // Draw card background (blue with confetti)
    const cardRadius = 40
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius)
    ctx.clip()

    // Draw the background image scaled to fit
    const bgScale = Math.max(cardWidth / bgImage.width, cardHeight / bgImage.height)
    const bgW = bgImage.width * bgScale
    const bgH = bgImage.height * bgScale
    const bgX = cardX + (cardWidth - bgW) / 2
    const bgY = cardY + (cardHeight - bgH) / 2
    ctx.drawImage(bgImage, bgX, bgY, bgW, bgH)
    ctx.restore()

    // Draw logo in top-left of card
    const logoWidth = 200
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth
    ctx.drawImage(logoImage, cardX + 40, cardY + 30, logoWidth, logoHeight)

    // Inner dark area
    const innerPadding = 30
    const innerX = cardX + innerPadding
    const innerY = cardY + 120
    const innerWidth = cardWidth - innerPadding * 2
    const innerHeight = cardHeight - 120 - innerPadding - 60 // Leave room for perforated edge
    const innerRadius = 30

    // Draw dark inner rectangle
    ctx.fillStyle = COLORS.dark
    ctx.beginPath()
    ctx.roundRect(innerX, innerY, innerWidth, innerHeight, innerRadius)
    ctx.fill()

    // Draw perforated edge (scalloped circles at bottom)
    const circleRadius = 12
    const circleSpacing = 30
    const circleY = innerY + innerHeight + circleRadius
    const numCircles = Math.floor(innerWidth / circleSpacing)
    const startX = innerX + (innerWidth - (numCircles - 1) * circleSpacing) / 2

    ctx.fillStyle = COLORS.dark
    for (let i = 0; i < numCircles; i++) {
      ctx.beginPath()
      ctx.arc(startX + i * circleSpacing, circleY, circleRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Market image (if uploaded)
    const imgSize = 180
    const imgX = innerX + 50
    const imgY = innerY + 40

    if (marketImg) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(imgX, imgY, imgSize, imgSize, 20)
      ctx.clip()
      ctx.drawImage(marketImg, imgX, imgY, imgSize, imgSize)
      ctx.restore()
    } else {
      // Placeholder
      ctx.fillStyle = '#334155'
      ctx.beginPath()
      ctx.roundRect(imgX, imgY, imgSize, imgSize, 20)
      ctx.fill()
    }

    // Event title
    const titleX = imgX + imgSize + 40
    const titleY = innerY + 70
    const titleMaxWidth = innerWidth - imgSize - 150

    ctx.fillStyle = COLORS.light
    ctx.font = 'bold 54px system-ui, -apple-system, sans-serif'

    // Word wrap the title
    const words = data.eventTitle.split(' ')
    let line = ''
    let y = titleY
    const lineHeight = 65

    for (const word of words) {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > titleMaxWidth && line !== '') {
        ctx.fillText(line.trim(), titleX, y)
        line = word + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line.trim(), titleX, y)

    // Side pill (centered below title area)
    const pillWidth = 200
    const pillHeight = 70
    const pillX = innerX + (innerWidth - pillWidth) / 2
    const pillY = innerY + innerHeight / 2 - 20

    ctx.fillStyle = data.pillColor
    ctx.beginPath()
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2)
    ctx.fill()

    ctx.fillStyle = COLORS.dark
    ctx.font = 'bold 40px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.sideLabel, pillX + pillWidth / 2, pillY + pillHeight / 2 + 14)
    ctx.textAlign = 'left'

    // Avg price (right side of pill)
    ctx.fillStyle = COLORS.light
    ctx.font = '36px system-ui, -apple-system, sans-serif'
    const avgText = `Avg ${data.avgPrice}`
    ctx.fillText(avgText, pillX + pillWidth + 60, pillY + pillHeight / 2 + 12)

    // Placed and To Win section
    const amountY = innerY + innerHeight - 100
    const leftCol = innerX + 200
    const rightCol = innerX + innerWidth - 450

    // Placed label
    ctx.fillStyle = '#94a3b8'
    ctx.font = '32px system-ui, -apple-system, sans-serif'
    ctx.fillText('Placed', leftCol, amountY - 50)

    // Placed amount with cash icon
    const cashIconSize = 50
    ctx.drawImage(cashImage, leftCol - 60, amountY - 40, cashIconSize, cashIconSize)
    ctx.fillStyle = COLORS.light
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
    ctx.fillText(`$${data.betAmount}`, leftCol, amountY)

    // To Win label
    ctx.fillStyle = '#94a3b8'
    ctx.font = '32px system-ui, -apple-system, sans-serif'
    ctx.fillText('To Win', rightCol, amountY - 50)

    // To Win amount with cash icon
    ctx.drawImage(cashImage, rightCol - 60, amountY - 40, cashIconSize, cashIconSize)
    ctx.fillStyle = COLORS.green
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
    ctx.fillText(`$${data.toWinAmount}`, rightCol, amountY)

  }, [bgImage, logoImage, cashImage, marketImg, data])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setData(prev => ({ ...prev, marketImage: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'novig-betslip.png'
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

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Controls Panel */}
      <div className="w-[340px] bg-slate-800 p-6 overflow-y-auto border-r border-slate-700">
        <h1 className="text-2xl font-bold text-white mb-6">Novig Slip Machine</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Event Title</label>
            <textarea
              value={data.eventTitle}
              onChange={e => setData(prev => ({ ...prev, eventTitle: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Side</label>
              <input
                type="text"
                value={data.sideLabel}
                onChange={e => setData(prev => ({ ...prev, sideLabel: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Avg Price</label>
              <input
                type="text"
                value={data.avgPrice}
                onChange={e => setData(prev => ({ ...prev, avgPrice: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bet Amount ($)</label>
              <input
                type="text"
                value={data.betAmount}
                onChange={e => setData(prev => ({ ...prev, betAmount: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">To Win ($)</label>
              <input
                type="text"
                value={data.toWinAmount}
                onChange={e => setData(prev => ({ ...prev, toWinAmount: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Pill Color</label>
            <div className="flex gap-2">
              {[COLORS.orange, COLORS.green, COLORS.blue, '#ef4444', '#a855f7'].map(color => (
                <button
                  key={color}
                  onClick={() => setData(prev => ({ ...prev, pillColor: color }))}
                  className={`w-10 h-10 rounded-full border-2 ${data.pillColor === color ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Market Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-600 file:text-white hover:file:bg-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
        <div ref={previewRef} className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
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
