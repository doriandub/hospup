'use client'

import { useState, useEffect } from 'react'
import { Property, CreatePropertyRequest } from '@/types'
import { api } from '@/lib/api'

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getProperties() as any
      
      // Railway backend returns PropertyListResponse with properties in .properties field
      let propertiesData: Property[] = []
      
      if (response && typeof response === 'object') {
        if (Array.isArray(response.properties)) {
          propertiesData = response.properties
        } else if (Array.isArray(response.data)) {
          propertiesData = response.data
        } else if (Array.isArray(response)) {
          propertiesData = response
        }
      }
      
      setProperties(propertiesData)
    } catch (err: any) {
      console.error('Properties fetch error:', err)
      const errorMessage = err.message || 'Failed to fetch properties'
      setError(errorMessage)
      
      // If authentication error, redirect to login
      if (err.message?.includes('401') || err.message?.includes('Not authenticated')) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const createProperty = async (data: CreatePropertyRequest | any): Promise<Property> => {
    try {
      const response = await api.createProperty(data) as any
      
      // Handle different response formats
      let newProperty: Property
      if (response && typeof response === 'object') {
        if (response.data && typeof response.data === 'object') {
          newProperty = response.data
        } else if (response.id) {
          newProperty = response
        } else {
          throw new Error('Invalid response format for created property')
        }
      } else {
        throw new Error('Invalid response format for created property')
      }
      
      setProperties(prev => [...prev, newProperty])
      return newProperty
    } catch (err: any) {
      console.error('Error creating property:', err)
      throw new Error(err.message || 'Failed to create property')
    }
  }

  const updateProperty = async (id: number, data: Partial<CreatePropertyRequest> | any): Promise<Property> => {
    try {
      const response = await api.updateProperty(id, data) as any
      
      // Handle different response formats
      let updatedProperty: Property
      if (response && typeof response === 'object') {
        if (response.data && typeof response.data === 'object') {
          updatedProperty = response.data
        } else if (response.id) {
          updatedProperty = response
        } else {
          throw new Error('Invalid response format for updated property')
        }
      } else {
        throw new Error('Invalid response format for updated property')
      }
      
      setProperties(prev => 
        prev.map(property => 
          property.id === id ? updatedProperty : property
        )
      )
      return updatedProperty
    } catch (err: any) {
      console.error('Error updating property:', err)
      throw new Error(err.message || 'Failed to update property')
    }
  }

  const deleteProperty = async (id: number): Promise<void> => {
    try {
      await api.deleteProperty(id)
      setProperties(prev => prev.filter(property => property.id !== id))
    } catch (err: any) {
      console.error('Error deleting property:', err)
      throw new Error(err.message || 'Failed to delete property')
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