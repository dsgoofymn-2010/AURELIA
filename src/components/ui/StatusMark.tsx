import { useEffect, useMemo, useId } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from 'framer-motion'

export type StatusMarkStatus = 'idle' | 'running' | 'done' | 'failed'

export interface StatusMarkProps {
  status?: StatusMarkStatus
  label?: string
  color?: string
  doneColor?: string
  errorColor?: string
  size?: number
  strokeWidth?: number
  fontSize?: number
  className?: string
  style?: React.CSSProperties
}

export const StatusMark: React.FC<StatusMarkProps> = ({
  status = 'idle',
  label,
  color = 'currentColor',
  doneColor = '#22c55e',
  errorColor = '#ef4444',
  size = 20,
  strokeWidth = 2,
  fontSize = 14,
  className = '',
  style,
}) => {
  const id = useId()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const progress = useMotionValue(0)
  const dashOffset = useTransform(progress, (v) => circumference * (1 - v))

  // Spinning animation for running state
  const rotation = useMotionValue(0)

  useEffect(() => {
    if (status === 'running') {
      const controls = animate(rotation, 360, {
        duration: 1.2,
        repeat: Infinity,
        ease: 'linear',
      })
      const progressControls = animate(progress, 0.7, {
        duration: 0.6,
        ease: 'easeOut',
      })
      return () => {
        controls.stop()
        progressControls.stop()
      }
    } else if (status === 'done' || status === 'failed') {
      const controls = animate(progress, 1, {
        duration: 0.4,
        ease: 'easeOut',
      })
      return () => controls.stop()
    } else {
      progress.set(0)
      rotation.set(0)
    }
  }, [status, progress, rotation])

  const activeColor = useMemo(() => {
    if (status === 'done') return doneColor
    if (status === 'failed') return errorColor
    return color
  }, [status, color, doneColor, errorColor])

  // Check mark path
  const checkPath = `M${center * 0.6} ${center} L${center * 0.9} ${center * 1.25} L${center * 1.45} ${center * 0.7}`
  // Cross mark path
  const crossPath1 = `M${center * 0.7} ${center * 0.7} L${center * 1.3} ${center * 1.3}`
  const crossPath2 = `M${center * 1.3} ${center * 0.7} L${center * 0.7} ${center * 1.3}`

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      style={style}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle (idle dashed) */}
          {status === 'idle' && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference / 8} ${circumference / 8}`}
              opacity={0.3}
            />
          )}

          {/* Spinning arc for running */}
          {status === 'running' && (
            <motion.g style={{ rotate: rotation, originX: '50%', originY: '50%' }}>
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={activeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashOffset }}
                transform={`rotate(-90 ${center} ${center})`}
              />
            </motion.g>
          )}

          {/* Full circle for done/failed */}
          {(status === 'done' || status === 'failed') && (
            <>
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill={activeColor}
                fillOpacity={0.1}
                stroke={activeColor}
                strokeWidth={strokeWidth}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ originX: '50%', originY: '50%' }}
              />
            </>
          )}

          {/* Check mark */}
          <AnimatePresence>
            {status === 'done' && (
              <motion.path
                d={checkPath}
                fill="none"
                stroke={doneColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              />
            )}
          </AnimatePresence>

          {/* Cross mark */}
          <AnimatePresence>
            {status === 'failed' && (
              <>
                <motion.path
                  d={crossPath1}
                  fill="none"
                  stroke={errorColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, delay: 0.15 }}
                />
                <motion.path
                  d={crossPath2}
                  fill="none"
                  stroke={errorColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, delay: 0.25 }}
                />
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {label && (
        <motion.span
          style={{ fontSize }}
          className="relative whitespace-nowrap"
          initial={{ opacity: 0.7 }}
          animate={{
            opacity: status === 'done' || status === 'failed' ? 0.5 : 1,
          }}
        >
          {label}
          {(status === 'done' || status === 'failed') && (
            <motion.span
              className="absolute left-0 top-1/2 h-px w-full"
              style={{ backgroundColor: activeColor }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              layoutId={`strike-${id}`}
            />
          )}
        </motion.span>
      )}
    </div>
  )
}

export default StatusMark

