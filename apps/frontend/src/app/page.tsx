'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Zap, 
  Clock, 
  Target, 
  Sparkles, 
  Video, 
  Upload, 
  Settings, 
  Download,
  ArrowRight,
  CheckCircle,
  Star,
  Building,
  Users,
  TrendingUp
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(1)

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Video Generation",
      description: "Generate viral-ready videos in seconds using advanced AI that understands what makes content go viral"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Viral Template Library",
      description: "Access hundreds of proven viral video templates from TikTok, Instagram, and YouTube"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save 10+ Hours Per Week",
      description: "No more spending hours editing videos. Create professional content in minutes, not hours"
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "Property-Focused Content",
      description: "Specifically designed for hotels, Airbnbs, and property managers to showcase their spaces"
    }
  ]

  const steps = [
    {
      number: 1,
      title: "Choose Your Property",
      description: "Select the property you want to promote from your portfolio",
      icon: <Building className="w-8 h-8" />
    },
    {
      number: 2,
      title: "Pick a Viral Template",
      description: "Browse our library of proven viral video patterns and choose what fits your content",
      icon: <Video className="w-8 h-8" />
    },
    {
      number: 3,
      title: "Set Language & Style",
      description: "Customize the language, tone, and style to match your brand and target audience",
      icon: <Settings className="w-8 h-8" />
    },
    {
      number: 4,
      title: "Generate & Share",
      description: "AI creates your viral-ready video instantly. Download and share across all platforms",
      icon: <Download className="w-8 h-8" />
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Airbnb Host",
      image: "/api/placeholder/50/50",
      content: "I went from 0 to 50K followers in 3 months using Hospup's viral templates. My bookings tripled!",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Hotel Manager",
      image: "/api/placeholder/50/50", 
      content: "Finally, a tool that understands hospitality marketing. Our social media engagement is through the roof.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Property Manager",
      image: "/api/placeholder/50/50",
      content: "I'm not a content creator, but with Hospup I look like a pro. Saves me 15+ hours every week.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-gray-900">Hospup</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push('/auth/register')}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Viral-Ready Videos in Seconds
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your All-in-One Tool for Creating
              <span className="text-primary block">Viral Property Videos</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Stop struggling with content creation. No community manager? No time? No problem! 
              Create professional, viral-ready videos for your properties in minutes, not hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={() => router.push('/auth/register')}
                className="bg-primary text-white hover:bg-primary/90 px-8 py-4 text-lg"
              >
                Start Creating Videos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-gray-500">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>10,000+ Properties</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span>2M+ Videos Created</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Property Owners Choose Hospup
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for hospitality professionals who want to create engaging content without the hassle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Create Viral Videos in 4 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From property selection to viral video - it's easier than posting on Instagram
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  activeStep === step.number 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setActiveStep(step.number)}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    activeStep === step.number ? 'bg-primary' : 'bg-gray-400'
                  }`}>
                    {step.number}
                  </div>
                  <div className={`ml-4 ${activeStep === step.number ? 'text-primary' : 'text-gray-400'}`}>
                    {step.icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Examples Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Viral Videos Created with Hospup
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our users are creating - from hotel tours to Airbnb reveals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                  <Play className="w-16 h-16 text-white opacity-80" />
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    2.3M views
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Hotel Room Tour - Luxury Collection
                  </h3>
                  <p className="text-gray-600 text-sm">
                    "This template helped us get 50K new followers in one month!"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Property Owners Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Go Viral?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of property owners creating viral content effortlessly
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              onClick={() => router.push('/auth/register')}
              className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-primary-100">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">Hospup</span>
            </div>
            <p className="text-gray-400">
              © 2024 Hospup. All rights reserved. Making viral videos accessible to everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}