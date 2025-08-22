'use client'

import { useState } from 'react'
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
  Upload,
  CheckCircle,
  Sparkles,
  MapPin,
  Phone,
  Instagram,
  Camera
} from 'lucide-react'

interface OnboardingStep {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: OnboardingStep[] = [
  {
    title: "Informations de base",
    description: "Nom et localisation de votre établissement",
    icon: Building2
  },
  {
    title: "Coordonnées",
    description: "Website, téléphone, réseaux sociaux",
    icon: Globe
  },
  {
    title: "Médias",
    description: "Photos et vidéos de votre propriété",
    icon: Camera
  }
]

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

export function PropertyOnboarding() {
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la propriété est requis'
    }
    
    if (!formData.type) {
      newErrors.type = 'Le type d\'établissement est requis'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise'
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'Le pays est requis'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    // Optional validation for step 2
    return true
  }

  const validateStep3 = () => {
    if (uploadedFiles.length === 0) {
      alert('Veuillez ajouter au moins une photo ou vidéo')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    if (currentStep === 3 && !validateStep3()) return
    
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
  }

  const handleFinish = async () => {
    if (!validateStep3()) return
    
    setIsSubmitting(true)
    try {
      const property = await createProperty(formData)
      
      // TODO: Upload files to S3 and associate with property
      // For now, we'll just simulate this
      
      router.push('/dashboard/properties')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPropertyTypeLabel = (value: string) => {
    return PROPERTY_TYPES.find(type => type.value === value)?.label || value
  }

  const getLanguageLabel = (value: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.value === value)?.label || value
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-8 bg-white border-b">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Ajouter une propriété</h1>
              <p className="text-gray-600">Configurez votre établissement pour générer des vidéos virales</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b p-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const stepNumber = index + 1
              const isActive = stepNumber === currentStep
              const isCompleted = stepNumber < currentStep
              const isAccessible = stepNumber <= currentStep

              return (
                <div key={stepNumber} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-500 text-white shadow-lg'
                          : isActive
                          ? 'bg-blue-500 text-white shadow-lg scale-110'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="mt-3 text-center max-w-24">
                      <div className={`text-sm font-medium ${isAccessible ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.title}
                      </div>
                      <div className={`text-xs mt-1 ${isAccessible ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-1 mx-6 rounded-full transition-colors duration-300 ${
                      stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8 text-center">
                  <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Informations de base</h2>
                  <p className="text-gray-600">Parlez-nous de votre établissement</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nom de l'établissement *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="ex: Hôtel des Champs-Élysées"
                      className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                      Type d'établissement *
                    </Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className={`mt-1 ${errors.type ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Sélectionnez le type" />
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
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        Ville *
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Paris"
                        className={`mt-1 ${errors.city ? 'border-red-500' : ''}`}
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                        Pays *
                      </Label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="France"
                        className={`mt-1 ${errors.country ? 'border-red-500' : ''}`}
                      />
                      {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                      Langue principale
                    </Label>
                    <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button onClick={handleNextStep} className="bg-blue-500 hover:bg-blue-600">
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Coordonnées */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8 text-center">
                  <Globe className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coordonnées & Réseaux</h2>
                  <p className="text-gray-600">Aidez vos clients à vous trouver</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Site web
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.votre-hotel.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram" className="text-sm font-medium text-gray-700 flex items-center">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="@votre_hotel"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Décrivez votre établissement, son ambiance, ses spécialités..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={handleNextStep} className="bg-blue-500 hover:bg-blue-600">
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Upload médias */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8 text-center">
                  <Camera className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Photos & Vidéos</h2>
                  <p className="text-gray-600">
                    Ajoutez vos plus belles photos et vidéos pour créer du contenu viral
                  </p>
                </div>

                <FileUpload
                  accept={{ 
                    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
                    'video/*': ['.mp4', '.mov', '.avi', '.mkv'] 
                  }}
                  maxFiles={20}
                  maxSize={100 * 1024 * 1024} // 100MB
                  onFilesChange={handleFilesChange}
                />

                {uploadedFiles.length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">
                        {uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''} ajouté{uploadedFiles.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    onClick={handleFinish}
                    disabled={isSubmitting || uploadedFiles.length === 0}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
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

                {/* Summary */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Établissement:</span>
                        <p className="font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <p className="font-medium">{getPropertyTypeLabel(formData.type)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Localisation:</span>
                        <p className="font-medium">{formData.city}, {formData.country}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Médias:</span>
                        <p className="font-medium">{uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}