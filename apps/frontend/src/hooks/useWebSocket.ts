import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface WebSocketHookReturn {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: any) => void
  subscribe: (eventType: string, callback: (data: any) => void) => () => void
}

export const useWebSocket = (): WebSocketHookReturn => {
  const { token } = useAuth()
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const subscribers = useRef<Map<string, Set<(data: any) => void>>>(new Map())
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!token) return

    try {
      // In development, use localhost. In production, use your domain
      // Use Railway WebSocket URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-93a0d.up.railway.app'
      const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://') + `/ws?token=${token}`
      
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          
          // Notify subscribers
          const eventSubscribers = subscribers.current.get(message.type)
          if (eventSubscribers) {
            eventSubscribers.forEach(callback => callback(message.data))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000 // Exponential backoff
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }, [token])

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Component unmounting')
      ws.current = null
    }
    
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    if (!subscribers.current.has(eventType)) {
      subscribers.current.set(eventType, new Set())
    }
    
    const eventSubscribers = subscribers.current.get(eventType)!
    eventSubscribers.add(callback)
    
    // Return unsubscribe function
    return () => {
      eventSubscribers.delete(callback)
      if (eventSubscribers.size === 0) {
        subscribers.current.delete(eventType)
      }
    }
  }, [])

  useEffect(() => {
    if (token) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [token, connect, disconnect])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe
  }
}