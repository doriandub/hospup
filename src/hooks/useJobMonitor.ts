import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
import { videoGenerationApi, JobStatus } from '@/lib/api/video-generation'

interface JobMonitorState {
  status: string
  progress?: number
  stage?: string
  result?: any
  error?: string
}

interface JobMonitorHookReturn {
  jobState: JobMonitorState | null
  isMonitoring: boolean
  startMonitoring: (jobId: string) => void
  stopMonitoring: () => void
}

export const useJobMonitor = (): JobMonitorHookReturn => {
  const { subscribe } = useWebSocket()
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [jobState, setJobState] = useState<JobMonitorState | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  const startMonitoring = useCallback((jobId: string) => {
    setCurrentJobId(jobId)
    setIsMonitoring(true)
    setJobState({ status: 'PENDING' })
    
    // Start polling the job status
    const poll = async () => {
      try {
        const status = await videoGenerationApi.getJobStatus(jobId)
        
        setJobState({
          status: status.status,
          progress: status.progress,
          stage: status.stage,
          result: status.result,
          error: status.error
        })
        
        // Stop polling if job is completed or failed
        if (status.status === 'SUCCESS' || status.status === 'FAILURE') {
          setIsMonitoring(false)
          if (pollInterval) {
            clearInterval(pollInterval)
            setPollInterval(null)
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        setJobState(prev => ({
          ...prev,
          status: 'ERROR',
          error: 'Failed to fetch job status'
        }))
        setIsMonitoring(false)
        if (pollInterval) {
          clearInterval(pollInterval)
          setPollInterval(null)
        }
      }
    }
    
    // Poll immediately, then every 2 seconds
    poll()
    const interval = setInterval(poll, 2000)
    setPollInterval(interval)
  }, [pollInterval])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    setCurrentJobId(null)
    setJobState(null)
    
    if (pollInterval) {
      clearInterval(pollInterval)
      setPollInterval(null)
    }
  }, [pollInterval])

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!currentJobId) return

    const unsubscribeJobUpdate = subscribe('job_update', (data) => {
      if (data.job_id === currentJobId) {
        setJobState({
          status: data.status,
          progress: data.progress,
          stage: data.stage,
          result: data.result,
          error: data.error
        })
        
        // Stop monitoring if job is completed
        if (data.status === 'SUCCESS' || data.status === 'FAILURE') {
          setIsMonitoring(false)
          if (pollInterval) {
            clearInterval(pollInterval)
            setPollInterval(null)
          }
        }
      }
    })

    const unsubscribeVideoGenerated = subscribe('video_generated', (data) => {
      if (data.job_id === currentJobId) {
        setJobState({
          status: 'SUCCESS',
          progress: 100,
          stage: 'completed',
          result: data
        })
        setIsMonitoring(false)
        if (pollInterval) {
          clearInterval(pollInterval)
          setPollInterval(null)
        }
      }
    })

    const unsubscribeJobFailed = subscribe('job_failed', (data) => {
      if (data.job_id === currentJobId) {
        setJobState({
          status: 'FAILURE',
          error: data.error
        })
        setIsMonitoring(false)
        if (pollInterval) {
          clearInterval(pollInterval)
          setPollInterval(null)
        }
      }
    })

    return () => {
      unsubscribeJobUpdate()
      unsubscribeVideoGenerated()
      unsubscribeJobFailed()
    }
  }, [currentJobId, subscribe, pollInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [pollInterval])

  return {
    jobState,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  }
}