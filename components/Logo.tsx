'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  variant?: 'default' | 'full'
}

export default function Logo({ className = "h-12 w-auto", width = 180, height = 60, variant = 'default' }: LogoProps) {
  const logoSrc = variant === 'full' ? '/images/hlapl-full-logo.webp' : '/images/hlapl-logo.webp'
  
  return (
    <Image 
      src={logoSrc}
      alt="HLAPL - Hashmi Law Associates Pvt. Ltd." 
      width={width} 
      height={height} 
      className={className}
      priority
    />
  )
}
