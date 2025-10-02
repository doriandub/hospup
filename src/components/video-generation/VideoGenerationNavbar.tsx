'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Shuffle, Music } from 'lucide-react'

interface VideoGenerationNavbarProps {
  currentStep: 1 | 2 | 3 | 4
  propertyId?: string
  templateId?: string
  videoId?: string
  showGenerationButtons?: boolean
  showRandomTemplate?: boolean
  showGenerateTemplate?: boolean
  onRandomTemplate?: () => void
  onGenerateTemplate?: () => void
  isGenerating?: boolean
}

export function VideoGenerationNavbar({
  currentStep,
  propertyId,
  templateId,
  videoId,
  showGenerationButtons = false,
  showRandomTemplate = false,
  showGenerateTemplate = false,
  onRandomTemplate,
  onGenerateTemplate,
  isGenerating = false
}: VideoGenerationNavbarProps) {
  const router = useRouter()
  const progressWidth = (currentStep / 4) * 100

  const handleBack = () => {
    switch (currentStep) {
      case 2:
        router.push('/dashboard/generate')
        break
      case 3:
        router.push('/dashboard/generate')
        break
      case 4:
        if (templateId) {
          const composeRoute = `/dashboard/compose/${templateId}?property=${propertyId}`
          router.push(composeRoute as any)
        } else {
          router.push('/dashboard/generate')
        }
        break
      default:
        router.push('/dashboard/generate')
    }
  }

  return (
    <div className="p-8 pb-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 px-4 py-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          {/* Progress Bar */}
          <div className="flex-1 flex justify-center px-6">
            <div className="w-48">
              <div className="bg-gray-100 rounded-xl h-2 overflow-hidden">
                <div 
                  className="h-full bg-[#09725c] rounded-xl transition-all duration-500 ease-out"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right side - Always show both buttons when appropriate */}
          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <>
                {/* Random Template - needs only property selection */}
                <Button
                  onClick={onRandomTemplate}
                  disabled={isGenerating || !propertyId}
                  variant="outline"
                  size="sm"
                  className="border-[#09725c] text-[#09725c] hover:bg-[#09725c]/10 disabled:opacity-50 px-4 py-2"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Random Template
                </Button>
                
                {/* Generate Template - needs property + description */}
                <Button
                  onClick={onGenerateTemplate}
                  disabled={isGenerating || !propertyId || !showGenerateTemplate}
                  size="sm"
                  className="bg-[#09725c] hover:bg-[#09725c]/90 disabled:opacity-50 px-4 py-2"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Template
                </Button>
              </>
            )}
            
            {/* Other steps buttons */}
            {currentStep > 1 && (
              <>
                <Button
                  onClick={onRandomTemplate}
                  disabled={isGenerating}
                  variant={currentStep === 4 ? "default" : "outline"}
                  size="sm"
                  className={currentStep === 4 ? 
                    "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white border-0 disabled:opacity-50 px-4 py-2" : 
                    "border-[#09725c] text-[#09725c] hover:bg-[#09725c]/10 disabled:opacity-50 px-4 py-2"
                  }
                >
                  {currentStep === 4 ? (
                    <Music className="w-4 h-4 mr-2" />
                  ) : (
                    <Shuffle className="w-4 h-4 mr-2" />
                  )}
                  {currentStep === 2 ? "Another Template" : currentStep === 3 ? "Add Text" : currentStep === 4 ? "Publier sur Instagram avec la musique" : "Random Template"}
                </Button>
                
                <Button
                  onClick={onGenerateTemplate}
                  disabled={isGenerating}
                  size="sm"
                  className="bg-[#09725c] hover:bg-[#09725c]/90 disabled:opacity-50 px-4 py-2"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {currentStep === 2 ? "Create This Video" : currentStep === 3 ? "Create Video" : currentStep === 4 ? "Créer une autre vidéo" : "Generate Template"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}