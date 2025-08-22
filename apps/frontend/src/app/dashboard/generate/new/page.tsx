'use client'

import { useState, useEffect } from 'react'
import { Property } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { propertiesApi } from '@/lib/api'
import { videoGenerationApi, ViralVideoMatch, JobStatus } from '@/lib/api/video-generation'
import { useRouter } from 'next/navigation'
import { 
  Camera,
  FileText,
  ArrowRight,
  Sparkles,
  Building2,
  Plus,
  Upload,
  Loader2,
  Play,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import Image from 'next/image'
import { FileUpload } from '@/components/upload/file-upload'

type GenerationStep = 'input' | 'matching' | 'template_selection' | 'generation' | 'completed'

export default function GenerateVideoPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<GenerationStep>('input')
  
  // Input state
  const [inputType, setInputType] = useState<'photo' | 'text'>('text')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [textInput, setTextInput] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  
  // Matching state
  const [matchingJobId, setMatchingJobId] = useState<string>('')
  const [viralMatches, setViralMatches] = useState<ViralVideoMatch[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  
  // Generation state
  const [generationJobId, setGenerationJobId] = useState<string>('')
  const [generationProgress, setGenerationProgress] = useState<number>(0)
  const [generationStage, setGenerationStage] = useState<string>('')
  const [generatedVideoId, setGeneratedVideoId] = useState<string>('')
  
  // Error state
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await propertiesApi.getAll()
      setProperties(response.data)
    } catch (err) {
      setError('Failed to fetch properties')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return
    
    const file = files[0]
    setUploadedFile(file)
    
    try {
      const response = await videoGenerationApi.uploadPhotoForAnalysis(file, selectedProperty)
      setUploadedImageUrl(response.data?.image_url || '')
      
      // Start monitoring the analysis job
      const jobId = response.data?.job_id
      if (jobId) {
        monitorImageAnalysis(jobId)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload image')
    }
  }

  const monitorImageAnalysis = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const status = await videoGenerationApi.getJobStatus(jobId)
        
        if (status.status === 'SUCCESS' && status.result?.description) {
          setTextInput(status.result.description)
          setCurrentStep('matching')
          await startVideoMatching(status.result.description)
        } else if (status.status === 'FAILURE') {
          setError(status.error || 'Image analysis failed')
        } else {
          // Still processing, check again
          setTimeout(checkStatus, 2000)
        }
      } catch (err) {
        setError('Failed to check analysis status')
      }
    }
    
    checkStatus()
  }

  const startVideoMatching = async (inputData?: string) => {
    if (!selectedProperty) {
      setError('Please select a property')
      return
    }
    
    const input = inputData || textInput
    if (!input.trim()) {
      setError('Please provide input text or upload an image')
      return
    }
    
    try {
      setError('')
      setCurrentStep('matching')
      
      const response = await videoGenerationApi.matchVideos({
        input_type: inputType,
        input_data: input,
        property_id: selectedProperty,
        limit: 6
      })
      
      const jobId = response.data?.job_id
      if (jobId) {
        setMatchingJobId(jobId)
        monitorMatching(jobId)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start video matching')
    }
  }

  const monitorMatching = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const status = await videoGenerationApi.getJobStatus(jobId)
        
        if (status.status === 'SUCCESS' && status.result?.matches) {
          setViralMatches(status.result.matches)
          setCurrentStep('template_selection')
        } else if (status.status === 'FAILURE') {
          setError(status.error || 'Video matching failed')
        } else {
          // Still processing, check again
          setTimeout(checkStatus, 2000)
        }
      } catch (err) {
        setError('Failed to check matching status')
      }
    }
    
    checkStatus()
  }

  const startVideoGeneration = async () => {
    if (!selectedTemplate) {
      setError('Please select a viral video template')
      return
    }
    
    try {
      setError('')
      setCurrentStep('generation')
      
      const response = await videoGenerationApi.generateVideo({
        viral_video_id: selectedTemplate,
        property_id: selectedProperty,
        input_data: textInput,
        input_type: inputType,
        language: 'en'
      })
      
      const jobId = response.data?.job_id
      if (jobId) {
        setGenerationJobId(jobId)
        monitorGeneration(jobId)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start video generation')
    }
  }

  const monitorGeneration = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const status = await videoGenerationApi.getJobStatus(jobId)
        
        if (status.progress) {
          setGenerationProgress(status.progress)
        }
        
        if (status.stage) {
          setGenerationStage(status.stage)
        }
        
        if (status.status === 'SUCCESS' && status.result?.video_id) {
          setGeneratedVideoId(status.result.video_id)
          setCurrentStep('completed')
        } else if (status.status === 'FAILURE') {
          setError(status.error || 'Video generation failed')
        } else {
          // Still processing, check again
          setTimeout(checkStatus, 3000)
        }
      } catch (err) {
        setError('Failed to check generation status')
      }
    }
    
    checkStatus()
  }

  const resetGeneration = () => {
    setCurrentStep('input')
    setInputType('text')
    setTextInput('')
    setUploadedFile(null)
    setUploadedImageUrl('')
    setViralMatches([])
    setSelectedTemplate('')
    setGenerationProgress(0)
    setGenerationStage('')
    setGeneratedVideoId('')
    setError('')
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Generate Viral Video</h1>
        <p className="text-gray-600 mt-1">Create engaging viral content for your properties using AI</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          {['Input', 'Matching', 'Template', 'Generation', 'Completed'].map((step, index) => {
            const stepKey = ['input', 'matching', 'template_selection', 'generation', 'completed'][index]
            const isActive = currentStep === stepKey
            const isCompleted = ['input', 'matching', 'template_selection', 'generation', 'completed'].indexOf(currentStep) > index
            
            return (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive ? 'bg-primary text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>
                  {step}
                </span>
                {index < 4 && <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Input */}
      {currentStep === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Provide Your Input</CardTitle>
            <CardDescription>
              Choose how you want to describe your ideal viral video content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Property Selection */}
            <div className="space-y-2">
              <Label htmlFor="property">Select Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} - {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Input Type Selection */}
            <div className="space-y-4">
              <Label>Input Method</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setInputType('text')}
                  className={`p-6 border-2 rounded-lg text-left transition-colors ${
                    inputType === 'text' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Text Description</h3>
                  <p className="text-sm text-gray-600">
                    Describe your ideal viral video concept in text
                  </p>
                </button>

                <button
                  onClick={() => setInputType('photo')}
                  className={`p-6 border-2 rounded-lg text-left transition-colors ${
                    inputType === 'photo' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Camera className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Photo Upload</h3>
                  <p className="text-sm text-gray-600">
                    Upload an inspiration photo and let AI analyze it
                  </p>
                </button>
              </div>
            </div>

            {/* Text Input */}
            {inputType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="textInput">Describe Your Video Concept</Label>
                <Textarea
                  id="textInput"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Describe the type of viral video you want to create for your property. For example: 'Luxury hotel room tour with dramatic lighting and smooth transitions showing the city view and premium amenities...'"
                  rows={4}
                />
              </div>
            )}

            {/* Photo Upload */}
            {inputType === 'photo' && (
              <div className="space-y-4">
                <Label>Upload Inspiration Photo</Label>
                {!uploadedFile ? (
                  <FileUpload
                    onFilesChange={handleFileUpload}
                    accept={{'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']}}
                    maxFiles={1}
                    maxSize={10 * 1024 * 1024} // 10MB
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      {uploadedImageUrl ? (
                        <Image
                          src={uploadedImageUrl}
                          alt="Uploaded inspiration"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {textInput && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <Label className="text-sm font-medium text-gray-700">AI Analysis:</Label>
                        <p className="text-sm text-gray-600 mt-1">{textInput}</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setUploadedFile(null)
                        setUploadedImageUrl('')
                        setTextInput('')
                      }}
                    >
                      Upload Different Photo
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Continue Button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => startVideoMatching()}
                disabled={!selectedProperty || (!textInput.trim() && inputType === 'text') || (!uploadedFile && inputType === 'photo')}
                className="bg-primary hover:bg-primary/90"
              >
                Find Matching Templates
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Matching */}
      {currentStep === 'matching' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Finding Viral Templates</CardTitle>
            <CardDescription>
              Our AI is searching for viral video templates that match your concept
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Input</h3>
                <p className="text-gray-600 mb-4">Finding the best viral video templates for your property...</p>
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                  <span className="text-sm text-gray-500">This may take a moment</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Template Selection */}
      {currentStep === 'template_selection' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Choose Your Template</CardTitle>
            <CardDescription>
              Select a viral video template that best matches your vision
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viralMatches.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
                <p className="text-gray-600 mb-4">We couldn&apos;t find viral templates matching your input. Try a different description.</p>
                <Button onClick={resetGeneration} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {viralMatches.map((match) => (
                    <button
                      key={match.viral_video.id}
                      onClick={() => setSelectedTemplate(match.viral_video.id)}
                      className={`text-left p-4 border-2 rounded-lg transition-colors ${
                        selectedTemplate === match.viral_video.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {match.viral_video.thumbnail_url ? (
                          <Image
                            src={match.viral_video.thumbnail_url}
                            alt={match.viral_video.title}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                        {match.viral_video.title}
                      </h3>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {match.viral_video.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {match.viral_video.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-primary font-medium">
                          {Math.round(match.similarity * 100)}% match
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={resetGeneration}>
                    Start Over
                  </Button>
                  <Button 
                    onClick={startVideoGeneration}
                    disabled={!selectedTemplate}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Generate Video
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generation */}
      {currentStep === 'generation' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Generating Your Video</CardTitle>
            <CardDescription>
              Our AI is creating a custom viral video for your property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Viral Video</h3>
                <p className="text-gray-600 mb-6">This process typically takes 2-5 minutes</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900 font-medium">{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
                
                {generationStage && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 capitalize">
                      {generationStage.replace('_', ' ')}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Completed */}
      {currentStep === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Video Generated Successfully!</CardTitle>
            <CardDescription>
              Your viral video is ready. You can view it in your video library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Created Successfully!</h3>
                <p className="text-gray-600">
                  Your viral video has been generated and is now available in your video library.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => router.push('/dashboard/videos')}
                  className="bg-primary hover:bg-primary/90"
                >
                  View Video Library
                </Button>
                <Button variant="outline" onClick={resetGeneration}>
                  Generate Another Video
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}