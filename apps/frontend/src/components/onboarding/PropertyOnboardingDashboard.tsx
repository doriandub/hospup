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
    
    if (!formData.name.trim()) newErrors.name = 'Le nom de la propriété est requis'
    if (!formData.type) newErrors.type = 'Le type d\'établissement est requis'
    if (!formData.city.trim()) newErrors.city = 'La ville est requise'
    if (!formData.country.trim()) newErrors.country = 'Le pays est requis'
    
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
    setTimeout(() => {
      setUploadedFiles(files)
    }, 0)
  }, [])

  const handleFinish = async () => {
    if (uploadedFiles.length === 0) {
      alert('Veuillez ajouter au moins une photo ou vidéo')
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

  const progressWidth = (currentStep / 3) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e6f4ef] font-inter">
      <div className="flex items-center justify-center min-h-screen py-8 px-4">
        <div className="w-full max-w-3xl">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-10">
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="text-right">
                <p className="text-[#115446] font-semibold text-lg">
                  Step {currentStep} of 3
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 flex justify-center">
              <div className="w-full max-w-xs">
                <div className="bg-gray-100 rounded-xl h-2 overflow-hidden">
                  <div 
                    className="h-full bg-[#115446] rounded-xl transition-all duration-500 ease-out"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-8">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#115446] bg-opacity-10 rounded-2xl mb-6">
                      <Building2 className="w-8 h-8 text-[#115446]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations de base</h2>
                    <p className="text-gray-600 mb-6">Parlez-nous de votre établissement</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Nom de l'établissement *
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="ex: Hôtel des Champs-Élysées"
                          className={`pl-12 px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200 ${
                            errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                          }`}
                        />
                      </div>
                      {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <Label htmlFor="type" className="text-sm font-medium text-gray-700 mb-2 block">
                        Type d'établissement *
                      </Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger className={`px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200 ${
                          errors.type ? 'border-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Sélectionnez le type" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                          Ville *
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="city"
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="Paris"
                            className={`pl-12 px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200 ${
                              errors.city ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                            }`}
                          />
                        </div>
                        {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-2 block">
                          Pays *
                        </Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="country"
                            type="text"
                            value={formData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            placeholder="France"
                            className={`pl-12 px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200 ${
                              errors.country ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                            }`}
                          />
                        </div>
                        {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="language" className="text-sm font-medium text-gray-700 mb-2 block">
                        Langue principale
                      </Label>
                      <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                        <SelectTrigger className="px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value} className="rounded-lg">
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <Button 
                      onClick={handleNext} 
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
                    >
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === 2 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#115446] bg-opacity-10 rounded-2xl mb-6">
                      <Globe className="w-8 h-8 text-[#115446]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Coordonnées & Réseaux</h2>
                    <p className="text-gray-600 mb-6">Aidez vos clients à vous trouver</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-2 block">
                        Site web
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://www.votre-hotel.com"
                          className="pl-12 px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Téléphone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+33 1 23 45 67 89"
                          className="pl-12 px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="instagram" className="text-sm font-medium text-gray-700 mb-2 block">
                        Instagram
                      </Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="instagram"
                          type="text"
                          value={formData.instagram}
                          onChange={(e) => handleInputChange('instagram', e.target.value)}
                          placeholder="@votre_hotel"
                          className="pl-12 px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Décrivez votre établissement, son ambiance, ses spécialités..."
                        rows={4}
                        className="px-4 py-3 rounded-xl border-gray-200 focus:ring-[#115446] focus:border-[#115446] transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button 
                      variant="outline" 
                      onClick={handlePrev}
                      className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium text-base transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105"
                    >
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Media Upload */}
              {currentStep === 3 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#115446] bg-opacity-10 rounded-2xl mb-6">
                      <Camera className="w-8 h-8 text-[#115446]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Photos & Vidéos</h2>
                    <p className="text-gray-600 mb-6">
                      Ajoutez vos plus belles photos et vidéos pour créer du contenu viral
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
                          {uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''} ajouté{uploadedFiles.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                      <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Établissement:</span>
                          <p className="font-medium text-gray-900">{formData.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <p className="font-medium text-gray-900">{getPropertyTypeLabel(formData.type)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Localisation:</span>
                          <p className="font-medium text-gray-900">{formData.city}, {formData.country}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Médias:</span>
                          <p className="font-medium text-gray-900">{uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-8">
                    <Button 
                      variant="outline" 
                      onClick={handlePrev}
                      className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50 font-medium text-base transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button 
                      onClick={handleFinish}
                      disabled={isSubmitting || uploadedFiles.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-[#115446] to-[#0f4a3d] hover:shadow-lg rounded-xl font-medium text-base transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Terminer
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