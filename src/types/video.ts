// Interface unifiée pour les overlays de texte - SEULE SOURCE DE VÉRITÉ
export interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: {
    x: number // Position horizontale en pixels absolus (0-1080)
    y: number // Position verticale en pixels absolus (0-1920)
    anchor: string
  }
  style: {
    font_family: string
    font_size: number // Taille en pixels absolus (20-200px)
    color: string
    bold: boolean
    italic: boolean
    shadow: boolean
    outline: boolean
    background: boolean
    opacity: number
  }
  textAlign?: 'left' | 'center' | 'right'
}

export interface VideoSlot {
  id: string
  order: number
  duration: number
  description: string
  start_time: number
  end_time: number
  assignedVideo?: {
    title: string
    thumbnail_url: string
  }
}