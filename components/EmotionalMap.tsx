import type React from "react"
import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface EmotionData {
  timestamp: number
  sentiment: "positive" | "neutral" | "negative"
}

interface EmotionalMapProps {
  emotionData: EmotionData[]
}

const EmotionalMap: React.FC<EmotionalMapProps> = ({ emotionData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "#87CEEB") // Sky blue
      gradient.addColorStop(1, "#4B0082") // Indigo
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      ctx.fillStyle = "white"
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const radius = Math.random() * 2
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw emotion path
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)
      emotionData.forEach((data, index) => {
        const x = (index / (emotionData.length - 1)) * canvas.width
        let y
        switch (data.sentiment) {
          case "positive":
            y = canvas.height * 0.25
            break
          case "neutral":
            y = canvas.height * 0.5
            break
          case "negative":
            y = canvas.height * 0.75
            break
        }
        ctx.lineTo(x, y)
      })
      ctx.strokeStyle = "#FFD700" // Gold
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw cartoon face
      const lastEmotion = emotionData[emotionData.length - 1]
      const faceX = canvas.width - 50
      const faceY = canvas.height / 2
      ctx.beginPath()
      ctx.arc(faceX, faceY, 30, 0, Math.PI * 2)
      ctx.fillStyle = "#FFE4B5" // Moccasin
      ctx.fill()

      // Draw eyes
      ctx.fillStyle = "black"
      ctx.beginPath()
      ctx.arc(faceX - 10, faceY - 10, 5, 0, Math.PI * 2)
      ctx.arc(faceX + 10, faceY - 10, 5, 0, Math.PI * 2)
      ctx.fill()

      // Draw mouth based on sentiment
      ctx.beginPath()
      switch (lastEmotion.sentiment) {
        case "positive":
          ctx.arc(faceX, faceY + 10, 15, 0, Math.PI, false)
          break
        case "neutral":
          ctx.moveTo(faceX - 15, faceY + 10)
          ctx.lineTo(faceX + 15, faceY + 10)
          break
        case "negative":
          ctx.arc(faceX, faceY + 20, 15, Math.PI, 0, false)
          break
      }
      ctx.stroke()
    }

    drawMap()
  }, [emotionData])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-64 rounded-lg overflow-hidden shadow-lg"
    >
      <canvas ref={canvasRef} width={400} height={200} className="w-full h-full" />
    </motion.div>
  )
}

export default EmotionalMap

