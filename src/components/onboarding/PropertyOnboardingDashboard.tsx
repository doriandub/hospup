'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProperties } from '@/hooks/useProperties'
import { PROPERTY_TYPES, SUPPORTED_LANGUAGES } from '@/types'
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Globe,
  CheckCircle,
  MapPin,
  Phone,
  Instagram,
  Loader2,
  Upload
} from 'lucide-react'

interface PropertyFormData {
  name: string
  type: string
  city: string
  country: string
  website: string
  phone: string
  instagram: string
  language: string
  description: string
}

export function PropertyOnboardingDashboard() {
  const router = useRouter()
  const { createProperty } = useProperties()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProperty, setCreatedProperty] = useState<any>(null)
  
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    type: '',
    city: '',
    country: '',
    website: '',
    phone: '',
    instagram: '',
    language: 'fr',
    description: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof PropertyFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value as string }))
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Property name is required'
    if (!formData.type) newErrors.type = 'Property type is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.country.trim()) newErrors.country = 'Country is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (currentStep === 1 && !validateStep1()) return
    
    // Si on quitte l'étape 3, on crée la propriété
    if (currentStep === 3 && !createdProperty) {
      await createPropertyFromForm()
    }
    setCurrentStep(prev => Math.min(prev + 1, 4)) // Maximum 4 étapes maintenant
  }

  const createPropertyFromForm = async () => {
    setIsSubmitting(true)
    try {
      const propertyData = { ...formData }
      const newProperty = await createProperty(propertyData)
      setCreatedProperty(newProperty)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFilesChange = useCallback((files: File[]) => {
    setTimeout(() => {
      setUploadedFiles(files)
    }, 0)
  }, [])


  const uploadFilesToProperty = async (propertyId: string, files: File[]) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.error('No access token found')
      return
    }

    console.log(`Starting upload for ${files.length} files to property ${propertyId}`)

    for (const file of files) {
      try {
        console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`)
        
        const urlResponse = await fetch('https://web-production-93a0d.up.railway.app/api/v1/upload/presigned-url', {
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

        if (!urlResponse.ok) {
          console.error(`Failed to get presigned URL: ${urlResponse.status} ${urlResponse.statusText}`)
          const errorText = await urlResponse.text()
          console.error('Error response:', errorText)
          continue
        }
        
        const urlData = await urlResponse.json()
        console.log('Received upload URL data:', urlData)

        const formData = new FormData()
        let uploadResponse: Response
        
        // Check if this is local storage (development) or S3
        if (urlData.upload_url.includes('/local')) {
          console.log('Using local storage upload')
          // Local storage upload
          formData.append('file', file)
          formData.append('s3_key', urlData.s3_key)
          formData.append('local_path', urlData.fields.local_path)
          
          console.log('Uploading to local storage:', urlData.upload_url)
          uploadResponse = await fetch(urlData.upload_url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          })
        } else {
          console.log('Using S3 upload')
          // S3 upload
          Object.entries(urlData.fields).forEach(([key, value]) => {
            formData.append(key, value as string)
          })
          formData.append('file', file)
          
          console.log('Uploading to S3:', urlData.upload_url)
          uploadResponse = await fetch(urlData.upload_url, {
            method: 'POST',
            body: formData
          })
        }
        
        console.log('Upload response status:', uploadResponse.status, uploadResponse.statusText)

        if (uploadResponse.ok) {
          await fetch('https://web-production-93a0d.up.railway.app/api/v1/upload/complete', {
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

  const getLanguageLabel = (value: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.value === value)?.label || value
  }

  const progressWidth = ((currentStep > 3 ? 3 : currentStep) / 3) * 100

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <div className="flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-3xl">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-10">
            {/* Header with back button and progress */}
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex-1 flex justify-center">
                <div className="w-32">
                  <div className="bg-gray-100 rounded-xl h-2 overflow-hidden">
                    <div 
                      className="h-full bg-[#09725c] rounded-xl transition-all duration-500 ease-out"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[#09725c] font-semibold text-lg">
                Step {currentStep > 3 ? 3 : currentStep} of 3
              </p>
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Inter' }}>Basic Information</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Property Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g. Grand Hotel Paris"
                        className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
                          errors.name ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                      />
                      {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <Label htmlFor="type" className="text-sm font-medium text-gray-700 mb-2 block">
                        Property Type *
                      </Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
                          errors.type ? 'border-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="rounded-lg">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                          City *
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Paris"
                          className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
                            errors.city ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                        />
                        {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-2 block">
                          Country *
                        </Label>
                        <Input
                          id="country"
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="France"
                          className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
                            errors.country ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                        />
                        {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country}</p>}
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={handleNext} 
                      className="px-6 py-3 bg-gradient-to-r from-[#09725c] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: More Information */}
              {currentStep === 2 && (
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Inter' }}>More Information</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-2 block">
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://www.your-hotel.com"
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+33 1 23 45 67 89"
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instagram" className="text-sm font-medium text-gray-700 mb-2 block">
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        type="text"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="@your_hotel"
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
                      />
                    </div>

                  </div>

                  <div className="flex justify-between mt-6">
                    <Button 
                      variant="outline" 
                      onClick={handlePrev}
                      className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium text-base transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      className="px-6 py-3 bg-gradient-to-r from-[#09725c] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Description */}
              {currentStep === 3 && (
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Inter' }}>Hotel Description</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your hotel, its atmosphere, specialties, unique features..."
                        rows={6}
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#09725c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 resize-none"
                      />
                      <p className="text-sm text-gray-500 mt-2">This will be used to generate engaging Instagram descriptions for your videos.</p>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button 
                      variant="outline" 
                      onClick={handlePrev}
                      className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium text-base transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      className="px-6 py-3 bg-gradient-to-r from-[#09725c] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div>
                  {!createdProperty ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#09725c] mx-auto mb-4"></div>
                      <p className="text-gray-600">Création de la propriété en cours...</p>
                    </div>
                  ) : (
                    <>
                      {/* Success Icon */}
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-[#09725c] bg-opacity-10 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-[#09725c]" />
                        </div>
                      </div>

                      {/* Success Message */}
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Inter' }}>
                          Propriété créée avec succès !
                        </h2>
                        <p className="text-base text-gray-600 mb-8" style={{ fontFamily: 'Inter' }}>
                          <strong>{formData.name}</strong> a été enregistrée. Vous pouvez maintenant ajouter vos photos et vidéos pour créer du contenu viral.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button 
                          onClick={() => router.push(`/dashboard/content-library?property=${createdProperty.id}`)}
                          className="w-full px-6 py-4 bg-futuristic text-white rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02] border-0"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Uploader mes vidéos
                        </Button>

                        <Button 
                          variant="outline"
                          onClick={() => router.push('/dashboard/properties')}
                          className="w-full px-6 py-3 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-base transition-all duration-200"
                        >
                          Passer pour l'instant
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>

                      {/* Help Text */}
                      <p className="text-sm text-gray-500 mt-6 text-center" style={{ fontFamily: 'Inter' }}>
                        Vous pourrez toujours ajouter vos contenus plus tard depuis la Content Library.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}