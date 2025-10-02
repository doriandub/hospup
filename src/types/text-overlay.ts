export interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: {
    x: number
    y: number
    anchor: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  }
  style: {
    font_family: string
    font_size: number
    color: string
    bold: boolean
    italic: boolean
    shadow: boolean
    outline: boolean
    background: boolean
    opacity: number
    text_align: 'left' | 'center' | 'right'
  }
  textAlign?: 'left' | 'center' | 'right'
}

export interface Font {
  id: string
  name: string
  display_name: string
  style: string
  description: string
}

export interface Color {
  name: string
  hex: string
  description: string
}