/**
 * Available fonts in the ECS FFmpeg worker
 * Must match fonts installed in aws-ecs-ffmpeg/Dockerfile
 */
export const AVAILABLE_FONTS = [
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto',
    variants: ['Regular', 'Bold'],
    category: 'sans-serif',
    description: 'Modern, ultra-versatile sans-serif'
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    family: 'Open Sans',
    variants: ['Regular', 'Bold'],
    category: 'sans-serif',
    description: 'Very readable sans-serif'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: 'Montserrat',
    variants: ['Regular', 'Bold'],
    category: 'sans-serif',
    description: 'Geometric, modern sans-serif'
  },
  {
    id: 'lato',
    name: 'Lato',
    family: 'Lato',
    variants: ['Regular'],
    category: 'sans-serif',
    description: 'Elegant sans-serif'
  }
] as const

export type FontFamily = typeof AVAILABLE_FONTS[number]['family']
export type FontVariant = 'Regular' | 'Bold'

/**
 * Get font family string for FFmpeg (e.g., "Roboto Bold", "Lato Regular")
 */
export function getFontFamilyString(family: string, variant: FontVariant = 'Regular'): string {
  if (variant === 'Regular') {
    return family
  }
  return `${family} ${variant}`
}

/**
 * Check if a font family + variant combination is available
 */
export function isFontAvailable(family: string, variant: FontVariant = 'Regular'): boolean {
  const font = AVAILABLE_FONTS.find(f => f.family === family)
  if (!font) return false
  return font.variants.includes(variant)
}
