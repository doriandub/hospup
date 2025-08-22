'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/upload/file-upload'
import { useProperties } from '@/hooks/useProperties'
import { PROPERTY_TYPES } from '@/types'
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Globe,
  Camera,
  Check,
  Sparkles
} from 'lucide-react'

interface PropertyFormData {
  name: string
  type: string
  city: string
  country: string
  website: string
  phone: string
  instagram: string
  description: string
}

export function PropertyOnboardingDashboard() {
  const router = useRouter()
  const { createProperty } = useProperties()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    type: '',
    city: '',
    country: '',
    website: '',
    phone: '',
    instagram: '',
    description: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Required'
    if (!formData.type) newErrors.type = 'Required'
    if (!formData.city.trim()) newErrors.city = 'Required'
    if (!formData.country.trim()) newErrors.country = 'Required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFilesChange = useCallback((files: File[]) => {
    // Defer the state update to avoid render cycle issues
    setTimeout(() => {
      setUploadedFiles(files)
    }, 0)
  }, [])

  const handleFinish = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one photo or video')
      return
    }
    
    setIsSubmitting(true)
    try {
      // First create the property
      const propertyData = { ...formData, language: 'fr' }
      const newProperty = await createProperty(propertyData)
      
      // Then upload files to the property
      if (newProperty && newProperty.id) {
        await uploadFilesToProperty(newProperty.id, uploadedFiles)
      }
      
      router.push('/dashboard/properties')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const uploadFilesToProperty = async (propertyId: string, files: File[]) => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    for (const file of files) {
      try {
        // Get presigned URL
        const urlResponse = await fetch('http://localhost:8000/api/v1/upload/presigned-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            file_name: file.name,
            content_type: file.type,
            property_id: propertyId,
            file_size: file.size
          })
        })

        if (!urlResponse.ok) continue

        const urlData = await urlResponse.json()

        // Upload to S3
        const formData = new FormData()
        Object.entries(urlData.fields).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
        formData.append('file', file)

        const uploadResponse = await fetch(urlData.upload_url, {
          method: 'POST',
          body: formData
        })

        if (uploadResponse.ok) {
          // Complete upload
          await fetch('http://localhost:8000/api/v1/upload/complete', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              property_id: propertyId,
              s3_key: urlData.s3_key,
              file_name: file.name,
              file_size: file.size,
              content_type: file.type
            })
          })
        }
      } catch (error) {
        console.error('Error uploading file:', file.name, error)
      }
    }
  }

  const getPropertyTypeLabel = (value: string) => {
    return PROPERTY_TYPES.find(type => type.value === value)?.label || value
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* Header cohérent avec le dashboard */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center justify-between max-w-md">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step < currentStep 
                      ? 'bg-primary text-white'
                      : step === currentStep
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-3 rounded ${
                    step < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Essential details about your property</p>
                </div>

                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Property Name *
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="The Grand Hotel"
                      className={`${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Property Type *
                    </Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className={`${errors.type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        City *
                      </Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="New York"
                        className={`${errors.city ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Country *
                      </Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="United States"
                        className={`${errors.country ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-gray-600">How guests can reach and find you</p>
                </div>

                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Website
                    </Label>
                    <Input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourdomain.com"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Instagram Handle
                    </Label>
                    <Input
                      value={formData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="@yourhotel"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your property's unique features, atmosphere, and what makes it special..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Media Assets */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Upload your best photos and videos for content creation</p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <FileUpload
                    accept={{ 
                      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
                      'video/*': ['.mp4', '.mov', '.avi'] 
                    }}
                    maxFiles={20}
                    maxSize={100 * 1024 * 1024}
                    onFilesChange={handleFilesChange}
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-center">
                        <Check className="w-5 h-5 text-primary mr-2" />
                        <span className="text-primary font-medium">
                          {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                      <h3 className="font-medium text-gray-900 mb-4">Uploaded Files</h3>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 truncate flex-1 mr-4">{file.name}</span>
                            <span className="text-gray-500 text-xs">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
              {currentStep > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={handlePrev}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button 
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary-700 text-white flex items-center"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleFinish}
                  disabled={isSubmitting || uploadedFiles.length === 0}
                  className="bg-primary hover:bg-primary-700 text-white flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Creating property and uploading files...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}