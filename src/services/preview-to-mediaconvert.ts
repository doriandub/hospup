/**
 * 🎬 PREVIEW TO MEDIACONVERT CONVERTER
 *
 * Convertit les données exactes de l'aperçu en format MediaConvert clean
 * Input : Données preview (templateSlots, currentAssignments, contentVideos, textOverlays)
 * Output : Format MediaConvert Lambda compatible
 */

// Types pour les données de l'aperçu
interface TemplateSlot {
  id: string
  order: number
  duration: number
  description: string
  start_time: number
  end_time: number
}

interface ContentVideo {
  id: string
  title: string
  thumbnail_url: string
  video_url: string
  duration: number
  description: string
}

interface SlotAssignment {
  slotId: string
  videoId: string | null
}

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number }
  style: {
    color: string
    font_size: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
  }
}

// Types pour MediaConvert Lambda
interface MediaConvertSegment {
  video_url: string
  duration: number
  start_time: number
  end_time: number
}

interface MediaConvertTextOverlay {
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number }
  style: {
    color: string
    font_size: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
  }
}

interface MediaConvertPayload {
  property_id: string
  video_id: string
  job_id: string
  segments: MediaConvertSegment[]
  text_overlays: MediaConvertTextOverlay[]
  total_duration: number
  custom_script?: any
  webhook_url?: string
}

export class PreviewToMediaConvertConverter {

  /**
   * 🎯 CONVERSION PRINCIPALE
   * Convertit les données de l'aperçu en payload MediaConvert
   */
  static convertPreviewData(
    templateSlots: TemplateSlot[],
    currentAssignments: SlotAssignment[],
    contentVideos: ContentVideo[],
    textOverlays: TextOverlay[],
    options: {
      propertyId?: string
      videoId?: string
      jobId?: string
      webhookUrl?: string
    } = {}
  ): MediaConvertPayload {

    console.log('🎬 Starting Preview → MediaConvert conversion')
    console.log(`📊 Input data: ${templateSlots.length} slots, ${currentAssignments.length} assignments, ${contentVideos.length} videos, ${textOverlays.length} overlays`)

    // 1. Créer les segments avec la timeline exacte de l'aperçu
    const segments = this.createTimelineSegments(templateSlots, currentAssignments, contentVideos)

    // 2. Mapper les text overlays avec validation
    const processedOverlays = this.processTextOverlays(textOverlays)

    // 3. Calculer la durée totale
    const totalDuration = this.calculateTotalDuration(templateSlots)

    // 4. Construire le payload final
    const payload: MediaConvertPayload = {
      property_id: options.propertyId || '1',
      video_id: options.videoId || this.generateVideoId(),
      job_id: options.jobId || this.generateJobId(),
      segments: segments,
      text_overlays: processedOverlays,
      total_duration: totalDuration,
      webhook_url: options.webhookUrl
    }

    // 5. Validation finale
    this.validatePayload(payload)

    console.log('✅ Conversion completed successfully')
    console.log(`📹 Generated ${segments.length} segments, ${processedOverlays.length} overlays, ${totalDuration}s total`)

    return payload
  }

  /**
   * 📺 CRÉER LES SEGMENTS TIMELINE
   * Reconstruit la timeline exacte de l'aperçu : slot par slot avec durées configurées
   */
  private static createTimelineSegments(
    templateSlots: TemplateSlot[],
    currentAssignments: SlotAssignment[],
    contentVideos: ContentVideo[]
  ): MediaConvertSegment[] {

    const segments: MediaConvertSegment[] = []
    let currentTime = 0

    // Trier les slots par ordre
    const sortedSlots = [...templateSlots].sort((a, b) => a.order - b.order)

    for (const slot of sortedSlots) {
      // Trouver l'assignment pour ce slot
      const assignment = currentAssignments.find(a => a.slotId === slot.id)
      if (!assignment?.videoId) {
        console.warn(`⚠️ No video assigned to slot ${slot.id}, skipping`)
        currentTime += slot.duration // Avancer le temps même si pas de vidéo
        continue
      }

      // Trouver la vidéo assignée
      const video = contentVideos.find(v => v.id === assignment.videoId)
      if (!video) {
        console.warn(`⚠️ Video ${assignment.videoId} not found for slot ${slot.id}, skipping`)
        currentTime += slot.duration
        continue
      }

      // Vérifier que l'URL est valide
      if (!video.video_url || video.video_url.trim() === '') {
        console.warn(`⚠️ Empty video_url for video ${video.id}, skipping`)
        currentTime += slot.duration
        continue
      }

      // Créer le segment avec la durée configurée du slot (pas la durée originale de la vidéo)
      const segment: MediaConvertSegment = {
        video_url: this.normalizeVideoUrl(video.video_url),
        duration: slot.duration, // 🎯 Utiliser la durée du SLOT (configurée dans l'aperçu)
        start_time: currentTime,
        end_time: currentTime + slot.duration
      }

      segments.push(segment)

      console.log(`📹 Segment created: slot=${slot.id}, video=${video.id}, duration=${slot.duration}s, timeline=${currentTime}s-${currentTime + slot.duration}s`)

      currentTime += slot.duration
    }

    if (segments.length === 0) {
      throw new Error('❌ No valid segments created - check slot assignments and video URLs')
    }

    return segments
  }

  /**
   * 📝 TRAITER LES TEXT OVERLAYS
   * Valide et normalise les overlays de texte
   */
  private static processTextOverlays(textOverlays: TextOverlay[]): MediaConvertTextOverlay[] {
    return textOverlays
      .filter(overlay => {
        // Filtrer les overlays invalides
        if (!overlay.content || overlay.content.trim() === '') {
          console.warn(`⚠️ Skipping empty text overlay`)
          return false
        }

        if (overlay.start_time < 0 || overlay.end_time <= overlay.start_time) {
          console.warn(`⚠️ Skipping invalid timing overlay: ${overlay.start_time}s-${overlay.end_time}s`)
          return false
        }

        return true
      })
      .map(overlay => {
        // Normaliser et valider les données
        const processedOverlay: MediaConvertTextOverlay = {
          content: overlay.content.trim(),
          start_time: Math.max(0, overlay.start_time),
          end_time: Math.max(overlay.start_time + 0.1, overlay.end_time), // Minimum 0.1s duration
          position: {
            x: Math.max(0, Math.min(100, overlay.position?.x || 50)), // Clamp 0-100%
            y: Math.max(0, Math.min(100, overlay.position?.y || 50))  // Clamp 0-100%
          },
          style: {
            color: overlay.style?.color || '#ffffff',
            font_size: Math.max(12, Math.min(72, overlay.style?.font_size || 24)), // Clamp 12-72px
            fontFamily: overlay.style?.fontFamily || 'Arial',
            fontWeight: overlay.style?.fontWeight || 'normal',
            fontStyle: overlay.style?.fontStyle || 'normal',
            textAlign: overlay.style?.textAlign || 'center'
          }
        }

        console.log(`📝 Text overlay: "${processedOverlay.content}" ${processedOverlay.start_time}s-${processedOverlay.end_time}s at (${processedOverlay.position.x}%, ${processedOverlay.position.y}%)`)

        return processedOverlay
      })
  }

  /**
   * ⏱️ CALCULER DURÉE TOTALE
   * Somme des durées des slots (comme dans l'aperçu)
   */
  private static calculateTotalDuration(templateSlots: TemplateSlot[]): number {
    const totalDuration = templateSlots.reduce((total, slot) => total + slot.duration, 0)

    if (totalDuration <= 0) {
      throw new Error('❌ Total duration must be positive')
    }

    if (totalDuration > 300) { // Max 5 minutes
      console.warn(`⚠️ Very long video: ${totalDuration}s`)
    }

    return totalDuration
  }

  /**
   * 🔗 NORMALISER VIDEO URL
   * Convertit les URLs en format S3 si nécessaire
   */
  private static normalizeVideoUrl(url: string): string {
    // Si déjà en format s3://, retourner tel quel
    if (url.startsWith('s3://')) {
      return url
    }

    // Convertir les URLs HTTPS S3 en format s3://
    if (url.includes('s3.eu-west-1.amazonaws.com/hospup-files')) {
      const parts = url.split('amazonaws.com/hospup-files/')
      if (parts.length > 1) {
        const s3Key = parts[1].split('?')[0]
        return `s3://hospup-files/${s3Key}`
      }
    }

    if (url.includes('hospup-files.s3.eu-west-1.amazonaws.com')) {
      const parts = url.split('amazonaws.com/')
      if (parts.length > 1) {
        const s3Key = parts[1].split('?')[0]
        return `s3://hospup-files/${s3Key}`
      }
    }

    // Si ce n'est pas une URL S3, la retourner telle quelle (MediaConvert décidera si c'est valide)
    return url
  }

  /**
   * ✅ VALIDER LE PAYLOAD
   * Vérifications finales avant envoi
   */
  private static validatePayload(payload: MediaConvertPayload): void {
    if (!payload.property_id || !payload.video_id || !payload.job_id) {
      throw new Error('❌ Missing required IDs (property_id, video_id, job_id)')
    }

    if (payload.segments.length === 0) {
      throw new Error('❌ No video segments to process')
    }

    if (payload.total_duration <= 0) {
      throw new Error('❌ Invalid total duration')
    }

    // Vérifier que tous les segments ont des URLs valides
    for (const segment of payload.segments) {
      if (!segment.video_url || segment.video_url.trim() === '') {
        throw new Error(`❌ Invalid video_url in segment: ${JSON.stringify(segment)}`)
      }

      if (segment.duration <= 0) {
        throw new Error(`❌ Invalid duration in segment: ${JSON.stringify(segment)}`)
      }
    }

    console.log('✅ Payload validation passed')
  }

  /**
   * 🆔 GÉNÉRER IDs
   */
  private static generateVideoId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private static generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 🧪 DEBUG - Afficher le payload généré
   */
  static debugPayload(payload: MediaConvertPayload): void {
    console.log('🧪 MediaConvert Payload Debug:')
    console.log('📋 IDs:', {
      property_id: payload.property_id,
      video_id: payload.video_id,
      job_id: payload.job_id
    })
    console.log('📹 Segments:')
    payload.segments.forEach((seg, i) => {
      console.log(`  ${i+1}. ${seg.start_time}s-${seg.end_time}s (${seg.duration}s): ${seg.video_url}`)
    })
    console.log('📝 Text Overlays:')
    payload.text_overlays.forEach((overlay, i) => {
      console.log(`  ${i+1}. "${overlay.content}" ${overlay.start_time}s-${overlay.end_time}s at (${overlay.position.x}%, ${overlay.position.y}%)`)
    })
    console.log(`⏱️ Total Duration: ${payload.total_duration}s`)
  }
}