'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Shuffle, Menu, Undo2, Redo2, Maximize2 } from 'lucide-react'

interface VideoGenerationHeaderProps {
  currentStep: 1 | 2 | 3 | 4
  propertyId?: string
  templateId?: string
  videoId?: string
  showGenerationButtons?: boolean
  onRandomTemplate?: () => void
  onGenerateTemplate?: () => void
  isGenerating?: boolean
  onToggleSidebar?: () => void
  showSidebarToggle?: boolean
  // New props for undo/redo and preview
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onPreview?: () => void
}

export function VideoGenerationHeader({
  currentStep,
  propertyId,
  templateId,
  videoId,
  showGenerationButtons = false,
  onRandomTemplate,
  onGenerateTemplate,
  isGenerating = false,
  onToggleSidebar,
  showSidebarToggle = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onPreview
}: VideoGenerationHeaderProps) {
  const router = useRouter()

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

  const getStepText = () => {
    switch (currentStep) {
      case 1:
        return 'Choisir un Template'
      case 2:
        return 'Prévisualiser'
      case 3:
        return 'Composer la Vidéo'
      case 4:
        return 'Finaliser'
      default:
        return 'Génération Vidéo'
    }
  }

  const getStepProgress = () => {
    return `${currentStep}/4`
  }

  return (
    <div className="bg-gradient-to-r from-[#09725c] to-[#138a73] text-white sticky top-0 z-50 shadow-lg border-b border-white/10">
      <div className="px-6 h-16 flex items-center justify-between">
          {/* Left: Sidebar Toggle + Back Button + Step Info */}
          <div className="flex items-center gap-4">
            {showSidebarToggle && (
              <Button
                variant="ghost"
                onClick={onToggleSidebar}
                className="text-white hover:text-white hover:bg-white/10 px-2 py-1 h-auto text-sm"
                size="sm"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-white hover:text-white hover:bg-white/10 px-2 py-1 h-auto text-sm"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-px h-4 bg-white/30" />
              <div>
                <h1 className="text-base font-semibold">{getStepText()}</h1>
                <p className="text-xs text-white/80">Étape {getStepProgress()}</p>
              </div>
            </div>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex-1">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        step <= currentStep ? 'bg-white' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <>
                {/* Random Template */}
                <Button
                  onClick={onRandomTemplate}
                  disabled={isGenerating || !propertyId}
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent disabled:opacity-50 px-3 py-1 text-sm"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Template Aléatoire
                </Button>

                {/* Generate Template */}
                <Button
                  onClick={onGenerateTemplate}
                  disabled={isGenerating || !propertyId}
                  size="sm"
                  className="bg-white text-[#09725c] hover:bg-white/90 hover:text-[#09725c] px-3 py-1 font-medium text-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer avec IA
                </Button>
              </>
            )}

            {currentStep === 3 && showGenerationButtons && (
              <>
                {/* Undo Button */}
                <Button
                  onClick={onUndo}
                  disabled={!canUndo}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 py-1"
                  title="Annuler (Cmd+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>

                {/* Redo Button */}
                <Button
                  onClick={onRedo}
                  disabled={!canRedo}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 py-1"
                  title="Refaire (Cmd+Shift+Z)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>

                {/* Preview Button */}
                <Button
                  onClick={onPreview}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-3 py-1"
                  title="Aperçu plein écran"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>

                {/* Generate Video Button */}
                <Button
                  onClick={onGenerateTemplate}
                  disabled={isGenerating}
                  size="sm"
                  className="bg-white text-[#09725c] hover:bg-white/90 hover:text-[#09725c] px-3 py-1 font-medium text-sm"
                >
                  {isGenerating ? 'Generating...' : 'Generate video'}
                </Button>
              </>
            )}

            {/* Other steps can have their specific buttons here */}
            {currentStep === 2 && (
              <Button
                onClick={onGenerateTemplate}
                disabled={isGenerating}
                size="sm"
                className="bg-white text-[#09725c] hover:bg-white/90 hover:text-[#09725c] px-4 py-2 font-medium"
              >
                Continuer
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                onClick={onGenerateTemplate}
                disabled={isGenerating}
                size="sm"
                className="bg-white text-[#09725c] hover:bg-white/90 hover:text-[#09725c] px-4 py-2 font-medium"
              >
                Finaliser la Vidéo
              </Button>
            )}
          </div>
      </div>
    </div>
  )
}