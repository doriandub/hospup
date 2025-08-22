'use client'

import { useState, useEffect } from 'react'
import { Property, CreatePropertyRequest, UpdatePropertyRequest } from '@/types'
import { propertiesApi } from '@/lib/api'

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await propertiesApi.getAll()
      setProperties(response.data)
    } catch (err: any) {
      console.error('Properties fetch error:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch properties'
      setError(errorMessage)
      
      // If authentication error, redirect to login
      if (err.response?.status === 401) {
        window.location.href = '/auth/signin'
      }
    } finally {
      setLoading(false)
    }
  }

  const createProperty = async (data: CreatePropertyRequest): Promise<Property> => {
    try {
      const response = await propertiesApi.create(data)
      const newProperty = response.data
      setProperties(prev => [...prev, newProperty])
      return newProperty
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to create property')
    }
  }

  const updateProperty = async (id: string, data: Partial<CreatePropertyRequest>): Promise<Property> => {
    try {
      const response = await propertiesApi.update(id, data)
      const updatedProperty = response.data
      setProperties(prev => 
        prev.map(property => 
          property.id === id ? updatedProperty : property
        )
      )
      return updatedProperty
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to update property')
    }
  }

  const deleteProperty = async (id: string): Promise<void> => {
    try {
      await propertiesApi.delete(id)
      setProperties(prev => prev.filter(property => property.id !== id))
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to delete property')
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  return {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    refetch: fetchProperties,
  }
}