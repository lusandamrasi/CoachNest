import Image from 'next/image'

type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  size?: LogoSize
  className?: string
  showWordmark?: boolean
}

const sizeMap: Record<LogoSize, { img: number; text: string }> = {
  sm: { img: 28, text: 'text-base' },
  md: { img: 32, text: 'text-xl' },
  lg: { img: 40, text: 'text-2xl' },
}

export default function Logo({
  size = 'md',
  className = '',
  showWordmark = true,
}: LogoProps) {
  const { img, text } = sizeMap[size]

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="CoachNest"
        width={img}
        height={img}
        priority
        className="object-contain dark:invert"
      />
      {showWordmark && (
        <span className={`font-bold ${text}`}>
          <span className="text-gray-900">Coach</span>
          <span className="text-orange-500">Nest</span>
        </span>
      )}
    </span>
  )
}
