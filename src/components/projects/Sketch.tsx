// Sketch.tsx
// A line-drawn elevation for a project whose film has not been rendered yet.
// Drawn from two numbers (floors, bays), so every project gets its own outline
// without shipping an image.

export function Sketch({ floors, bays, className = '' }: { floors: number; bays: number; className?: string }) {
  const W = 180
  const H = 320
  const ground = 268
  // fit the building into the sheet whatever its proportions
  const unit = Math.min(140 / bays, 200 / floors, 20)
  const w = bays * unit
  const h = floors * unit
  const x = (W - w) / 2
  const y = ground - h
  const cells = []
  for (let f = 0; f < floors; f++)
    for (let b = 0; b < bays; b++)
      cells.push(<rect key={`${f}-${b}`} x={x + b * unit + unit * 0.22} y={y + f * unit + unit * 0.24} width={unit * 0.56} height={unit * 0.52} />)
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} fill="none" stroke="currentColor" strokeWidth="0.7" aria-hidden>
      {/* ground and section marks */}
      <path d={`M14 ${ground}H${W - 14}`} strokeWidth="1" />
      <path d={`M14 ${ground + 5}H${W - 14}`} opacity="0.35" strokeDasharray="2 3" />
      {/* the building */}
      <rect x={x} y={y} width={w} height={h} strokeWidth="1" />
      <path d={`M${x - 3} ${y}H${x + w + 3}M${x + w * 0.3} ${y}v-7h${w * 0.4}v7`} />
      <g opacity="0.6">{cells}</g>
      {/* height dimension */}
      <g opacity="0.55">
        <path d={`M${x + w + 12} ${y}V${ground}M${x + w + 9} ${y}h6M${x + w + 9} ${ground}h6`} />
        <text x={x + w + 17} y={(y + ground) / 2 + 2} fontSize="6" fill="currentColor" stroke="none" letterSpacing="0.6">
          {floors}F
        </text>
      </g>
    </svg>
  )
}

export default Sketch
