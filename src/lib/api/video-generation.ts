import { ApiResponse, Video } from '@/types'
import { api } from '../api'

export interface VideoMatchRequest {
  input_type: 'photo' | 'text'
  input_data: string
  property_id: string
  limit?: number
}

export interface VideoGenerationRequest {
  viral_video_id: string
  property_id: string
  input_data: string
  input_type: 'photo' | 'text'
  language?: string
}

export interface JobStatus {
  job_id: string
  status: string
  progress?: number
  stage?: string
  result?: any
  error?: string
}

export interface ViralVideoMatch {
  viral_video: {
    id: string
    title: string
    description: string
    thumbnail_url: string
    original_url: string
    tags: string[]
    style: string
    music: string
    created_at: string
  }
  similarity: number
  matching_scenes: Array<{
    id: string
    start_time: number
    end_time: number
    description: string
    tags: string[]
    similarity: number
  }>
}

export const videoGenerationApi = {
  // Match viral videos based on input
  async matchVideos(request: VideoMatchRequest): Promise<ApiResponse<{ job_id: string }>> {
    const response = await api.post('/video-generation/match-videos', request)
    return response.data
  },

  // Upload and analyze photo
  async uploadPhotoForAnalysis(file: File, propertyId: string): Promise<ApiResponse<{ job_id: string, image_url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('property_id', propertyId)

    const response = await api.post('/video-generation/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Generate video from template
  async generateVideo(request: VideoGenerationRequest): Promise<ApiResponse<{ job_id: string }>> {
    const response = await api.post('/video-generation/generate', request)
    return response.data
  },

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await api.get(`/video-generation/status/${jobId}`)
    return response.data
  },

  // Get user's generated videos
  async getUserVideos(params?: {
    skip?: number
    limit?: number
    property_id?: string
    status?: string
  }): Promise<ApiResponse<{ videos: Video[], total: number }>> {
    const response = await api.get('/video-generation/videos', { params })
    return response.data
  },

  // Delete video
  async deleteVideo(videoId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/video-generation/videos/${videoId}`)
    return response.data
  },

  // Populate viral database (development)
  async populateViralDatabase(): Promise<ApiResponse<{ job_id: string }>> {
    const response = await api.post('/video-generation/populate-viral-database')
    return response.data
  }
}