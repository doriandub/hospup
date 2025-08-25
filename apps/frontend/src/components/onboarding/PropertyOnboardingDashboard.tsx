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
import { PROPERTY_TYPES, SUPPORTED_LANGUAGES } from '@/types'
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Globe,
  Camera,
  CheckCircle,
  Sparkles,
  MapPin,
  Phone,
  Instagram,
  Loader2
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
  brandFont: string
  brandColor: string
  textOutline: boolean
  outlineColor: string
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
    language: 'fr',
    description: '',
    brandFont: 'Inter',
    brandColor: '#115446',
    textOutline: true,
    outlineColor: '#FFFFFF'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof PropertyFormData, value: string | boolean) => {
    if (field === 'textOutline') {
      setFormData(prev => ({ ...prev, [field]: value === 'true' || value === true }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value as string }))
    }
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

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    setCurrentStep(prev => Math.min(prev + 1, 5))
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFilesChange = useCallback((files: File[]) => {
    setTimeout(() => {
      setUploadedFiles(files)
    }, 0)
  }, [])

  const handleFinish = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please add at least one photo or video')
      return
    }
    
    setIsSubmitting(true)
    try {
      const propertyData = { ...formData }
      const newProperty = await createProperty(propertyData)
      
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
    if (!token) {
      console.error('No access token found')
      return
    }

    console.log(`Starting upload for ${files.length} files to property ${propertyId}`)

    for (const file of files) {
      try {
        console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`)
        
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

  const getLanguageLabel = (value: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.value === value)?.label || value
  }

  const progressWidth = (currentStep / 5) * 100

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
                      className="h-full bg-[#115446] rounded-xl transition-all duration-500 ease-out"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[#115446] font-semibold text-lg">
                Step {currentStep} of 5
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
                        className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
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
                        <SelectTrigger className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
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
                          className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
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
                          className={`px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 ${
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
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
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
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
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
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
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
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
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
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
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
                        className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200 resize-none"
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
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Text Styling */}
              {currentStep === 4 && (
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Inter' }}>Brand Text Styling</h2>
                    <p className="text-base font-medium text-gray-600" style={{ fontFamily: 'Inter' }}>
                      Choose your brand fonts and colors for video text overlays
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Font Selection */}
                    <div>
                      <Label htmlFor="brandFont" className="text-sm font-medium text-gray-700 mb-2 block">
                        Brand Font
                      </Label>
                      <Select value={formData.brandFont} onValueChange={(value) => handleInputChange('brandFont', value)}>
                        <SelectTrigger className="px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus:ring-offset-0 focus:shadow-sm transition-all duration-200">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Inter" className="rounded-lg">Inter (Modern & Clean)</SelectItem>
                          <SelectItem value="Montserrat" className="rounded-lg">Montserrat (Bold & Strong)</SelectItem>
                          <SelectItem value="Poppins" className="rounded-lg">Poppins (Friendly & Round)</SelectItem>
                          <SelectItem value="Playfair Display" className="rounded-lg">Playfair Display (Elegant & Luxury)</SelectItem>
                          <SelectItem value="Oswald" className="rounded-lg">Oswald (Impact & Bold)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Brand Color */}
                    <div>
                      <Label htmlFor="brandColor" className="text-sm font-medium text-gray-700 mb-2 block">
                        Brand Color
                      </Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="brandColor"
                          value={formData.brandColor}
                          onChange={(e) => handleInputChange('brandColor', e.target.value)}
                          className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.brandColor}
                          onChange={(e) => handleInputChange('brandColor', e.target.value)}
                          placeholder="#115446"
                          className="flex-1 px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Text Outline Toggle */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="textOutline" className="text-sm font-medium text-gray-700">
                          Add Text Outline
                        </Label>
                        <button
                          type="button"
                          onClick={() => handleInputChange('textOutline', (!formData.textOutline).toString())}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.textOutline ? 'bg-[#115446]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.textOutline ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Helps text stand out on various backgrounds</p>
                    </div>

                    {/* Outline Color (if outline is enabled) */}
                    {formData.textOutline && (
                      <div>
                        <Label htmlFor="outlineColor" className="text-sm font-medium text-gray-700 mb-2 block">
                          Outline Color
                        </Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            id="outlineColor"
                            value={formData.outlineColor}
                            onChange={(e) => handleInputChange('outlineColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.outlineColor}
                            onChange={(e) => handleInputChange('outlineColor', e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1 px-4 py-3 rounded-xl border-gray-200 focus:outline-none focus:border-[#115446] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-sm transition-all duration-200"
                          />
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    <div className="mt-6 p-6 bg-gray-900 rounded-xl">
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
                        <div
                          className="text-2xl font-bold"
                          style={{
                            fontFamily: formData.brandFont,
                            color: formData.brandColor,
                            textShadow: formData.textOutline ? `2px 2px 0px ${formData.outlineColor}, -2px -2px 0px ${formData.outlineColor}, 2px -2px 0px ${formData.outlineColor}, -2px 2px 0px ${formData.outlineColor}` : 'none'
                          }}
                        >
                          {formData.name || 'Your Hotel Name'}
                        </div>
                        <p className="text-gray-400 text-sm mt-2">This is how text will appear on your videos</p>
                      </div>
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
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Media Upload */}
              {currentStep === 5 && (
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Inter' }}>Photos & Videos</h2>
                    <p className="text-base font-medium text-gray-600" style={{ fontFamily: 'Inter' }}>
                      Add your best photos and videos to create viral content
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#115446] transition-all duration-200">
                    <FileUpload
                      accept={{ 
                        'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
                        'video/*': ['.mp4', '.mov', '.avi', '.mkv'] 
                      }}
                      maxFiles={20}
                      maxSize={100 * 1024 * 1024}
                      onFilesChange={handleFilesChange}
                    />
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-6 p-4 bg-[#115446] bg-opacity-5 border border-[#115446] border-opacity-20 rounded-xl">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-[#115446] mr-3" />
                        <span className="text-[#115446] font-medium">
                          {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} added
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                      <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Property:</span>
                          <p className="font-medium text-gray-900">{formData.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <p className="font-medium text-gray-900">{getPropertyTypeLabel(formData.type)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <p className="font-medium text-gray-900">{formData.city}, {formData.country}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Media:</span>
                          <p className="font-medium text-gray-900">{uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  )}

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
                      onClick={handleFinish}
                      disabled={isSubmitting || uploadedFiles.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Finish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}