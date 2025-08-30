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

export function PropertyOnboardingSoft() {
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
    
    if (!formData.name.trim()) newErrors.name = 'Requis'
    if (!formData.type) newErrors.type = 'Requis'
    if (!formData.city.trim()) newErrors.city = 'Requis'
    if (!formData.country.trim()) newErrors.country = 'Requis'
    
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

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
  }

  const handleFinish = async () => {
    if (uploadedFiles.length === 0) {
      alert('Ajoutez au moins une photo ou vidéo')
      return
    }
    
    setIsSubmitting(true)
    try {
      // Add default language since we removed it from the form
      const propertyData = { ...formData, language: 'fr' }
      await createProperty(propertyData)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50">
      <div className="max-w-2xl mx-auto pt-8 pb-16 px-6">
        
        {/* Header simplifié */}
        <div className="text-center mb-12">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="absolute top-8 left-8 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-gray-600 mb-8">
            Étape {currentStep} sur 3
          </div>
          
          <h1 className="text-3xl font-light text-gray-800 mb-3">
            {currentStep === 1 && "Votre établissement"}
            {currentStep === 2 && "Restons en contact"}
            {currentStep === 3 && "Quelques visuels"}
          </h1>
          
          <p className="text-gray-500 font-light">
            {currentStep === 1 && "Les informations de base"}
            {currentStep === 2 && "Comment vous joindre"}
            {currentStep === 3 && "Pour créer du contenu viral"}
          </p>
        </div>

        {/* Progress bar ultra simple */}
        <div className="flex justify-center mb-16">
          <div className="flex space-x-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step <= currentStep 
                    ? step === currentStep 
                      ? 'bg-orange-400 w-8' 
                      : 'bg-primary-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-primary-100/20">
          
          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Nom de l'établissement</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Mon Super Hôtel"
                  className={`h-12 text-lg border-0 bg-gray-50 focus:bg-white transition-colors ${
                    errors.name ? 'ring-2 ring-red-200' : ''
                  }`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Type d'établissement</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className={`h-12 text-lg border-0 bg-gray-50 focus:bg-white ${
                    errors.type ? 'ring-2 ring-red-200' : ''
                  }`}>
                    <SelectValue placeholder="Choisissez..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-lg py-3">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 font-medium mb-3 block">Ville</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Paris"
                    className={`h-12 text-lg border-0 bg-gray-50 focus:bg-white transition-colors ${
                      errors.city ? 'ring-2 ring-red-200' : ''
                    }`}
                  />
                  {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-3 block">Pays</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="France"
                    className={`h-12 text-lg border-0 bg-gray-50 focus:bg-white transition-colors ${
                      errors.country ? 'ring-2 ring-red-200' : ''
                    }`}
                  />
                  {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Coordonnées */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Site web</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://mon-hotel.com"
                  className="h-12 text-lg border-0 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                  className="h-12 text-lg border-0 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="@mon_hotel"
                  className="h-12 text-lg border-0 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="L'ambiance de votre établissement en quelques mots..."
                  rows={4}
                  className="text-lg border-0 bg-gray-50 focus:bg-white transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* Étape 3: Upload médias */}
          {currentStep === 3 && (
            <div className="space-y-8">
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
                <div className="text-center p-6 bg-primary-50 rounded-2xl">
                  <Check className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                  <p className="text-primary-700 font-medium">
                    {uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''} ajouté{uploadedFiles.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Récapitulatif minimaliste */}
              {uploadedFiles.length > 0 && (
                <div className="p-6 bg-gray-50 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Établissement</span>
                    <span className="font-medium text-gray-800">{formData.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium text-gray-800">{getPropertyTypeLabel(formData.type)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Localisation</span>
                    <span className="font-medium text-gray-800">{formData.city}, {formData.country}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12">
            {currentStep > 1 ? (
              <Button 
                variant="ghost" 
                onClick={handlePrev}
                className="text-gray-600 hover:text-gray-800 h-12 px-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white h-12 px-8 rounded-full shadow-lg"
              >
                Continuer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleFinish}
                disabled={isSubmitting || uploadedFiles.length === 0}
                className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white h-12 px-8 rounded-full shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Terminer
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}