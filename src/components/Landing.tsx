'use client'

import React, { useState } from 'react'

// Data configuration
const landingData = {
  "brand": "Hospup",
  "navbar": ["Features", "How it works", "Pricing"],
  "hero": {
    "title": "Becoming Instagram's next viral property made easy",
    "subtitle": "Drive more direct bookings in just 3 minutes a day. Hospup makes content creation accessible to all with videos, captions, and music ready to post.",
    "starsLabel": "Used by 1,500+ hotels worldwide",
    "cta": "Start Creating Today"
  },
  "madeWith": {
    "titlePrefix": "750K+ viral clips have been",
    "titleAccent": "made with Hospup",
    "subtitle": "AI tools that help hotels catch trends and create content that goes viral."
  },
  "steps": [
    {
      "tab": "STEP 1",
      "title": "Describe your property",
      "body": "Upload photos, pick highlights (pool, breakfast, rooftop, spa) and describe your unique selling points."
    },
    {
      "tab": "STEP 2", 
      "title": "Pick a viral template",
      "body": "Select formats proven to perform in your region. Pre-built hooks, transitions, and trending audio."
    },
    {
      "tab": "STEP 3",
      "title": "Export & post",
      "body": "Auto-resize for IG/TikTok (9:16, 1:1), export captions & hooks. Schedule or post instantly."
    }
  ],
  "testimonials": [
    {"name": "Marie Dubois", "badge": "2.1M", "text": "Hospup transformed our social media presence. We went from 50K to 2M followers in 6 months."},
    {"name": "Giovanni Rossi", "badge": "850K", "text": "The AI understands hospitality perfectly. Our booking requests increased 300% since using viral templates."},
    {"name": "Hans Mueller", "badge": "1.2M", "text": "Finally, a tool made for hotels! The multi-language support is incredible for our European properties."},
    {"name": "Sophie Laurent", "badge": "640K", "text": "I was skeptical about AI for luxury hotels, but the content quality is exceptional. Guests love it."},
    {"name": "Carlos Santos", "badge": "920K", "text": "Hospup actually feels like a cheat code for hotel marketing. Our occupancy rates have never been higher."},
    {"name": "Emma Thompson", "badge": "780K", "text": "For real, Hospup has made content creation so much easier. We post daily now without stress."}
  ],
  "faq": [
    "Can I export in both 9:16 and 1:1 formats?",
    "Do subtitles support FR/DE/IT/EN languages?",
    "Can I import my hotel brand fonts and colors?",
    "How many viral templates are included?",
    "Is there a limit on video exports per month?",
    "Can I schedule posts directly to social media?",
    "Do you offer white-label solutions for hotel chains?"
  ]
}

// Logo Component
const Logo = () => (
  <div className="mr-5">
    <img 
      src="/Hospup logo.png" 
      alt="Hospup Logo" 
      width={120} 
      height={40}
      className="h-10 w-auto object-contain"
    />
  </div>
)

// Navbar Component
const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {landingData.navbar.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-gray-700 hover:text-[#09725c] transition-colors font-medium"
              >
                {item}
              </a>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <a href="/auth/login" className="border-2 border-gray-200 text-gray-700 px-6 py-2 rounded-2xl font-medium hover:border-[#09725c] hover:text-[#09725c] transition-all duration-200">
              Login
            </a>
            <a href="/auth/signup" className="bg-futuristic-small text-white px-6 py-2 rounded-2xl font-medium transition-all duration-200 hover:scale-105 border-0">
              S'inscrire
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Hero Section
const Hero = () => {
  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        {/* Light Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="absolute top-0 left-0">
            <defs>
              <pattern id="heroGrid" patternUnits="userSpaceOnUse" width="60" height="60">
                <rect width="60" height="60" fill="none" stroke="#09725c" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroGrid)" />
          </svg>
        </div>
        
        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-transparent to-gray-50/50"></div>
      </div>
      
      <div className="container max-w-[1200px] mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-[#09725c] rounded-full mr-3 animate-pulse"></div>
            <span className="text-gray-700 text-sm font-medium" style={{ fontFamily: 'Inter' }}>Powered by AI</span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight max-w-4xl mx-auto" style={{ fontFamily: 'Inter' }} dangerouslySetInnerHTML={{ __html: landingData.hero.title }}>
          </h1>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: 'Inter' }}>
            {landingData.hero.subtitle}
          </p>
          
          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-20">
            <a href="/auth/signup" 
              className="bg-futuristic text-white px-10 py-5 rounded-2xl text-lg font-semibold hover:scale-[1.02] transition-all duration-200 shadow-lg border-0 inline-flex items-center gap-3"
              style={{ fontFamily: 'Inter' }}
            >
              <span className="relative z-10">{landingData.hero.cta}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            
            <button className="text-gray-600 hover:text-gray-900 px-6 py-5 rounded-2xl text-lg font-medium hover:bg-gray-50 transition-all duration-200 inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6" />
              </svg>
              Watch Demo
            </button>
          </div>
          
          
        </div>
      </div>
    </section>
  )
}

// Videos Generated Section
const VideosGenerated = () => {
  return (
    <section className="py-20 bg-white" aria-labelledby="videos-title">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Data Stats - Featured First */}
        <div className="text-center mb-12">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 inline-block mb-8">
            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Inter' }}>1B+</div>
                <div className="text-gray-600 text-base" style={{ fontFamily: 'Inter' }}>Views</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Inter' }}>10M+</div>
                <div className="text-gray-600 text-base" style={{ fontFamily: 'Inter' }}>Followers</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Inter' }}>500+</div>
                <div className="text-gray-600 text-base" style={{ fontFamily: 'Inter' }}>Hotels</div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our AI analyzed this massive dataset to identify the most successful viral patterns. Based on your property and content goals, we automatically match and recreate the formats that have already proven to work, so you don't have to guess what goes viral.
          </p>
        </div>
        
        {/* Video Gallery */}
        <div className="relative overflow-hidden -mx-4 md:-mx-6">
          {/* Left gradient fade - starts from absolute edge */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Right gradient fade - starts from absolute edge */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex gap-3 justify-center">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl relative overflow-hidden flex-shrink-0"
                style={{ width: '200px', height: '355px' }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" className="mx-auto mb-2">
                      <path d="M16 12l16 12-16 12V12z" />
                    </svg>
                    <div className="text-sm font-medium">Viral Clip</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Steps Section
const Steps = () => {
  const [activeStep, setActiveStep] = useState(0)
  
  const steps = [
    {
      tab: "ÉTAPE 1",
      title: "Sélectionnez votre propriété et décrivez votre idée",
      body: "Choisissez l'établissement et dites-nous ce que vous voulez mettre en avant"
    },
    {
      tab: "ÉTAPE 2", 
      title: "Choisissez votre template viral",
      body: "Nous vous proposons les formats les plus performants avec statistiques et preview"
    },
    {
      tab: "ÉTAPE 3",
      title: "Personnalisez votre montage",
      body: "Modifiez les vidéos, textes et timings selon votre contenu"
    },
    {
      tab: "ÉTAPE 4",
      title: "Publiez votre création",
      body: "Votre vidéo finale avec description Instagram prête à être partagée"
    }
  ]
  
  const renderStepContent = (stepIndex: number) => {
    const step = steps[stepIndex]
    
    switch (stepIndex) {
      case 0:
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600 mb-6">{step.body}</p>
            
            {/* Property Selection + Description Interface like /generate */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Sélectionnez votre propriété</h4>
                <div className="relative">
                  <select className="w-full p-4 pr-12 border border-gray-200 rounded-lg bg-white text-gray-900 appearance-none focus:ring-2 focus:ring-[#09725c] focus:border-transparent">
                    <option value="">Choisissez une propriété...</option>
                    <option value="1">Hôtel Le Magnifique - Paris, France</option>
                    <option value="2">Resort Paradise - Nice, France</option>
                    <option value="3">Château de Luxe - Lyon, France</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <hr className="border-gray-200" />
              
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Décrivez votre vidéo</h4>
                  <button className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    Idée aléatoire
                  </button>
                </div>
                <textarea
                  placeholder="Que souhaitez-vous mettre en avant ? (ex: 'Dîner romantique au coucher de soleil sur notre terrasse')"
                  className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#09725c] focus:border-transparent"
                  rows={4}
                />
              </div>
            </div>
          </div>
        )
        
      case 1:
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600 mb-6">{step.body}</p>
            
            {/* Template Preview Interface like /template-preview */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* Left: Video Preview */}
              <div>
                <div className="bg-gray-100 relative overflow-hidden rounded-lg aspect-[9/16] cursor-pointer">
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors rounded-lg">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-gray-900 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle: Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-[#09725c]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span className="text-gray-600">Vues</span>
                    </div>
                    <span className="font-bold text-gray-900">2.3M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span className="text-gray-600">Likes</span>
                    </div>
                    <span className="font-bold text-gray-900">156K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-[#ff914d]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="m22 21-3-3m-3-3a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/>
                      </svg>
                      <span className="text-gray-600">Followers</span>
                    </div>
                    <span className="font-bold text-gray-900">89K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 7l-7 5 7 5V7z"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                      <span className="text-gray-600">Durée</span>
                    </div>
                    <span className="font-bold text-gray-900">28s</span>
                  </div>
                </div>
              </div>

              {/* Right: Performance */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <svg className="w-5 h-5 text-[#09725c] mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                  <div className="text-lg font-bold text-[#09725c]">1.8%</div>
                  <div className="text-xs text-gray-600">Taux d'engagement</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <svg className="w-5 h-5 text-blue-600 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <div className="text-lg font-bold text-blue-600">26x</div>
                  <div className="text-xs text-gray-600">Ratio Performance</div>
                </div>
                <button className="w-full bg-[#09725c] text-white py-2 px-4 rounded-lg text-sm font-medium">
                  Utiliser ce template
                </button>
              </div>
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600 mb-6">{step.body}</p>
            
            {/* Video Composition Interface like /compose */}
            <div className="space-y-6">
              {/* Timeline Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline de votre vidéo</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-white rounded border">
                    <div className="w-12 h-8 bg-blue-200 rounded flex items-center justify-center text-xs">0-3s</div>
                    <span className="text-sm flex-1">Vue aérienne de la piscine</span>
                    <button className="text-xs text-[#09725c]">Modifier</button>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white rounded border">
                    <div className="w-12 h-8 bg-green-200 rounded flex items-center justify-center text-xs">3-8s</div>
                    <span className="text-sm flex-1">Détail de l'eau cristalline</span>
                    <button className="text-xs text-[#09725c]">Modifier</button>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white rounded border">
                    <div className="w-12 h-8 bg-purple-200 rounded flex items-center justify-center text-xs">8-12s</div>
                    <span className="text-sm flex-1">Clients se relaxant</span>
                    <button className="text-xs text-[#09725c]">Modifier</button>
                  </div>
                </div>
              </div>
              
              {/* Content Library */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Votre bibliothèque de contenu</h4>
                <div className="grid grid-cols-4 gap-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-video bg-gray-200 rounded cursor-pointer hover:ring-2 hover:ring-[#09725c]">
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        Vidéo {i}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Text Overlay */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Texte et sous-titres</h4>
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm" 
                  rows={2}
                  placeholder="Découvrez notre piscine avec vue panoramique..."
                />
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600 mb-6">{step.body}</p>
            
            {/* Final Video Preview + Publishing */}
            <div className="grid grid-cols-2 gap-8">
              
              {/* Left: Final Video Preview */}
              <div className="text-center">
                <div className="bg-gray-100 relative overflow-hidden rounded-lg aspect-[9/16] mx-auto mb-4" style={{maxWidth: '200px'}}>
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  {/* Success badge */}
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Vidéo générée</span>
                  </div>
                  <p className="text-gray-500">28 secondes • 1080x1920</p>
                </div>
              </div>
              
              {/* Right: Publishing Options */}
              <div className="space-y-6">
                {/* Generated content summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Contenu généré :</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                      <span>Vidéo montée automatiquement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                      <span>Voix-off IA française</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                      <span>Sous-titres animés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                      <span>Description Instagram</span>
                    </div>
                  </div>
                </div>
                
                {/* Instagram Caption Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Caption générée :</h4>
                  <p className="text-sm text-gray-600 italic mb-2">"🏊‍♀️ Plongez dans le luxe absolu ! Notre piscine à débordement vous offre une vue imprenable sur l'océan..."</p>
                  <p className="text-xs text-[#09725c]">#luxury #hotel #piscine #vue #relaxation</p>
                </div>
                
                {/* Publishing buttons */}
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Publier sur Instagram
                  </button>
                  <button className="w-full border-2 border-[#09725c] text-[#09725c] py-3 px-4 rounded-xl font-medium">
                    💾 Télécharger la vidéo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <section className="py-20 bg-gray-50" aria-labelledby="steps-title">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-gray-600">
            De votre propriété à du contenu viral en 4 étapes simples
          </p>
        </div>
        
        {/* Step Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm" role="tablist">
            {steps.map((step, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={activeStep === index}
                aria-controls={`step-panel-${index}`}
                onClick={() => setActiveStep(index)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeStep === index
                    ? 'bg-[#09725c] text-white'
                    : 'text-gray-600 hover:text-[#09725c]'
                }`}
              >
                {step.tab}
              </button>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div
          id={`step-panel-${activeStep}`}
          role="tabpanel"
          aria-labelledby={`step-tab-${activeStep}`}
        >
          {renderStepContent(activeStep)}
        </div>
      </div>
    </section>
  )
}

// Testimonials Section
const Testimonials = () => {
  return (
    <section className="py-20 bg-white" aria-labelledby="testimonials-title">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        <h2 id="testimonials-title" className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Loved by hoteliers worldwide
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landingData.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#09725c] to-[#0f4a3d] rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-[#09725c] font-medium">{testimonial.badge} followers</div>
                </div>
              </div>
              <p className="text-gray-600">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ Section
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }
  
  return (
    <section className="py-20 bg-gray-50" aria-labelledby="faq-title">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        <h2 id="faq-title" className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {landingData.faq.map((question, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-semibold text-gray-900">{question}</span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${openIndex === index ? '-rotate-45' : ''}`}
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              
              <div
                id={`faq-answer-${index}`}
                className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === index ? 'pb-4 max-h-96' : 'max-h-0'
                }`}
              >
                <p className="text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Simple Process Section
const Benefits = () => {
  return (
    <section className="py-20 bg-white border-b border-gray-100">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Inter' }}>
            How it works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Inter' }}>
            From property videos to viral content in three simple steps
          </p>
        </div>

        {/* Three Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

          {/* Step 1 Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-500 font-bold text-lg">1</div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter' }}>
              Upload your footages
            </h3>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter' }}>
              Import all your property videos.
            </p>

            {/* Illustration */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50">
                <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 48 48">
                  <path d="M14 14h20v20H14z M18 10l6 6 6-6"/>
                </svg>
                <p className="text-sm font-medium text-blue-600">Drag & Drop</p>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 bg-green-100 p-2 rounded text-sm">
                  <div className="w-8 h-6 bg-gray-300 rounded"></div>
                  <span className="flex-1">villa-pool.mp4</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-100 p-2 rounded text-sm">
                  <div className="w-8 h-6 bg-gray-300 rounded"></div>
                  <span className="flex-1">luxury-suite.mp4</span>
                  <span className="text-blue-600">✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-500 font-bold text-lg">2</div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter' }}>
              Select your template
            </h3>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter' }}>
              Choose from proven viral templates.
            </p>

            {/* Illustration */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg p-3 border-2 border-pink-400 relative">
                  <div className="aspect-square bg-pink-300 rounded mb-2 flex items-center justify-center">
                    <span className="text-lg">🏊‍♀️</span>
                  </div>
                  <p className="text-xs font-bold text-pink-700">Pool Tour</p>
                  <p className="text-xs text-pink-600">2.3M views</p>
                  <div className="absolute top-1 right-1 bg-pink-500 text-white text-xs px-1 rounded-full">✓</div>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-3">
                  <div className="aspect-square bg-blue-300 rounded mb-2 flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                  <p className="text-xs font-bold text-blue-700">Luxury</p>
                  <p className="text-xs text-blue-600">3.2M views</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-500 font-bold text-lg">3</div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Inter' }}>
              Generate video
            </h3>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter' }}>
              Your post is ready in seconds.
            </p>

            {/* Illustration */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
              {/* Loading animation turning into polished video */}
              <div className="relative">
                <div className="w-full aspect-[9/16] bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                  {/* Circular loading animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>

                  {/* Phone screen overlay */}
                  <div className="absolute bottom-2 right-2 w-12 h-20 bg-black rounded-lg p-1">
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded flex items-center justify-center">
                      <div className="w-6 h-10 bg-gray-600 rounded-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs font-medium text-gray-900">🏨 Luxury villa with ocean view!</p>
                  <p className="text-xs text-blue-600">#luxury #villa #ocean</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button className="bg-futuristic text-white px-8 py-3 rounded-2xl font-medium hover:scale-[1.02] transition-all duration-200 border-0">
            Try it now
          </button>
        </div>
      </div>
    </section>
  )
}

// Features Detailed Section
const FeaturesDetailed = () => {
  const features = [
    { name: "Génération automatique de scripts IA", included: true },
    { name: "Voix-off naturelle en 20+ langues", included: true },
    { name: "Sous-titres animés optimisés", included: true },
    { name: "Templates viraux pré-conçus", included: true },
    { name: "Export multi-formats (9:16, 1:1, 16:9)", included: true },
    { name: "Bibliothèque de musiques libres", included: true },
    { name: "Analytics et performances", included: true },
    { name: "API pour intégrations", included: false },
    { name: "Marque blanche", included: false },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont votre hôtel a besoin
          </h2>
          <p className="text-lg text-gray-600">
            Une suite complète d'outils pour créer des contenus qui convertissent
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Fonctionnalités incluses
            </h3>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                    feature.included ? 'bg-[#09725c]' : 'bg-gray-300'
                  }`}>
                    {feature.included ? (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </div>
                  <span className={feature.included ? 'text-gray-900' : 'text-gray-600'}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border">
            <div className="aspect-video bg-gradient-to-br from-[#09725c] to-[#0f4a3d] rounded-xl mb-6 flex items-center justify-center">
              <div className="text-white text-center">
                <svg className="w-16 h-16 mx-auto mb-2" viewBox="0 0 64 64" fill="currentColor">
                  <path d="M32 4L12 20v32l20 8 20-8V20L32 4z"/>
                </svg>
                <p className="text-sm opacity-90">Aperçu de l'interface</p>
              </div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Interface intuitive</h4>
            <p className="text-gray-600 text-sm mb-6">
              Créez vos vidéos en quelques clics grâce à notre interface pensée pour les professionnels de l'hôtellerie
            </p>
            <button className="w-full bg-futuristic-small text-white py-3 rounded-xl font-medium hover:scale-[1.02] transition-all duration-200 border-0">
              Essayer gratuitement
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Who is this for Section
const WhoIsThisFor = () => {
  const personas = [
    {
      title: "Hôtels Indépendants",
      description: "Rivalisez avec les grandes chaînes sur les réseaux sociaux",
      features: ["Budget marketing limité", "Équipe réduite", "Besoin de visibilité"],
      icon: "🏨"
    },
    {
      title: "Chaînes Hôtelières", 
      description: "Uniformisez votre communication tout en gardant l'identité locale",
      features: ["Multi-propriétés", "Cohérence de marque", "Scale rapidement"],
      icon: "🏢"
    },
    {
      title: "Agences Marketing",
      description: "Proposez des services de content création à vos clients hôteliers",
      features: ["Gestion multi-clients", "White-label", "Facturation simplifiée"],
      icon: "🎯"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fait pour qui ?
          </h2>
          <p className="text-lg text-gray-600">
            Hospup s'adapte à tous les professionnels de l'hôtellerie
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {personas.map((persona, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">{persona.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{persona.title}</h3>
              <p className="text-gray-600 mb-6">{persona.description}</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {persona.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-[#0f4a3d] rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="bg-futuristic-small text-white px-6 py-2 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all duration-200 border-0">
                En savoir plus
              </button>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à commencer ?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-futuristic text-white px-8 py-3 rounded-2xl font-medium hover:scale-[1.02] transition-all duration-200 border-0">
              Démarrer maintenant
            </button>
            <button className="border-2 border-[#09725c] text-[#09725c] px-8 py-3 rounded-2xl font-medium hover:scale-[1.01] transition-transform">
              Programmer une démo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricing Section
const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(1) // Default to 1 establishment
  const [isAnnual, setIsAnnual] = useState(false) // Monthly by default
  
  const calculatePrice = (establishments: number) => {
    if (establishments === 0) return 0 // Free plan
    if (establishments === 1) return 59
    
    let totalPrice = 59 // Base price for first establishment
    let currentPrice = 59
    
    for (let i = 2; i <= establishments; i++) {
      currentPrice = Math.max(29, currentPrice - 3) // Minimum 29€ per establishment
      totalPrice += currentPrice
    }
    
    return totalPrice
  }
  
  const getCurrentTier = (establishments: number) => {
    const monthlyPrice = calculatePrice(establishments)
    const finalPrice = isAnnual ? Math.floor(monthlyPrice * 10) : monthlyPrice // 2 months free annually
    
    return {
      establishments: establishments,
      videos: establishments * 50, // 50 videos per establishment
      price: finalPrice,
      monthlyPrice: monthlyPrice,
      label: establishments === 1 ? "Starter" : 
             establishments <= 3 ? "Growth" :
             establishments <= 6 ? "Professional" :
             establishments <= 10 ? "Business" : "Scale"
    }
  }
  
  const selectedTier = getCurrentTier(selectedPlan)
  
  const plans = [
    {
      name: "Gratuit",
      price: "0",
      period: "",
      description: "Découvrez Hospup gratuitement",
      features: [
        "1 établissement",
        "2 vidéos par mois",
        "Templates de base",
        "Export HD",
        "Support communauté"
      ],
      cta: "Commencer gratuitement",
      popular: false
    },
    {
      name: "Flexible",
      price: selectedTier.price.toString(),
      period: "/mois",
      description: "Tarification adaptée à vos besoins",
      features: [
        `${selectedTier.establishments} établissement${selectedTier.establishments > 1 ? 's' : ''}`,
        `${selectedTier.videos} vidéos par mois`,
        "Tous les templates",
        "Export 4K + formats multiples",
        "Support prioritaire"
      ],
      cta: "Choisir ce plan",
      popular: true,
      customizable: true
    },
    {
      name: "Enterprise",
      price: "Sur mesure",
      period: "",
      description: "Pour les chaînes et agences",
      features: [
        "Établissements illimités",
        "Vidéos illimitées",
        "White-label",
        "API complète",
        "Manager dédié"
      ],
      cta: "Nous contacter",
      popular: false
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tarifs transparents
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Choisissez le plan qui correspond à vos besoins. Changez quand vous voulez.
          </p>
          
          {/* Monthly/Annual Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-12 h-6 bg-gray-200 rounded-full transition-colors duration-200 focus:outline-none"
              style={{
                backgroundColor: isAnnual ? "#09725c" : "#e5e7eb"
              }}
            >
              <div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200"
                style={{
                  transform: isAnnual ? 'translateX(1.5rem)' : 'translateX(0)'
                }}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
              Annuel
            </span>
            {isAnnual && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                2 mois offerts
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`bg-white rounded-2xl p-8 relative ${
              plan.popular ? 'border-2 border-[#0f4a3d] shadow-lg' : 'border border-gray-200'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#0f4a3d] text-white px-4 py-2 rounded-full text-sm font-medium">
                    Plus populaire
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                {/* Custom counter for flexible plan */}
                {plan.customizable && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-900 mb-4">
                      Nombre d'établissements
                    </label>
                    
                    {/* Counter with +/- buttons */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={() => setSelectedPlan(Math.max(1, selectedPlan - 1))}
                        disabled={selectedPlan <= 1}
                        className="w-10 h-10 rounded-full border-2 border-[#09725c] text-[#09725c] font-bold text-xl flex items-center justify-center hover:bg-[#09725c] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#09725c]"
                      >
                        −
                      </button>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {selectedTier.establishments}
                        </div>
                        <div className="text-xs text-gray-600">
                          établissement{selectedTier.establishments > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedPlan(Math.min(20, selectedPlan + 1))}
                        disabled={selectedPlan >= 20}
                        className="w-10 h-10 rounded-full border-2 border-[#09725c] text-[#09725c] font-bold text-xl flex items-center justify-center hover:bg-[#09725c] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#09725c]"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-sm font-medium text-[#09725c]">
                        {selectedTier.label} • {selectedTier.videos} vidéos/mois
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  {plan.customizable ? (
                    <div className="text-center">
                      <span className="text-4xl font-bold text-gray-900">€{selectedTier.price}</span>
                      <span className="text-gray-600">{isAnnual ? '/an' : '/mois'}</span>
                      {isAnnual && (
                        <div className="text-sm text-green-600 mt-1">
                          au lieu de €{selectedTier.monthlyPrice * 12}/an
                        </div>
                      )}
                    </div>
                  ) : typeof plan.price === 'string' && plan.price !== 'Sur mesure' && plan.price !== '0' ? (
                    <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
                  ) : plan.price === '0' ? (
                    <span className="text-4xl font-bold text-[#09725c]">Gratuit</span>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                  )}
                  {plan.period && !plan.customizable && <span className="text-gray-600">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center text-gray-900">
                    <svg className="w-5 h-5 text-[#09725c] mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 px-6 rounded-2xl font-medium transition-all duration-200 border-0 ${
                plan.popular 
                  ? 'bg-futuristic text-white hover:scale-[1.02]' 
                  : 'bg-futuristic-small text-white hover:scale-[1.02]'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Tous les plans incluent un essai gratuit de 14 jours • Aucune carte bancaire requise
          </p>
          <button className="bg-white text-[#09725c] px-8 py-3 rounded-2xl font-medium border-2 border-[#09725c] hover:scale-[1.02] transition-all duration-200">
            Voir la démonstration
          </button>
        </div>
      </div>
    </section>
  )
}

// Footer
const Footer = () => {
  return (
    <footer className="bg-futuristic text-white py-16 relative">
      <div className="container max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <img 
                src="/Hospup (34) (1).png" 
                alt="Hospup Logo" 
                width={120} 
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              La plateforme qui transforme vos vidéos d'hôtel en contenu viral pour Instagram et TikTok. IA, templates et automatisation.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#09725c] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#09725c] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#09725c] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Produit</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Templates viraux</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">IA & Automatisation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Analytics</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Intégrations</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">API</a></li>
            </ul>
          </div>
          
          {/* Solutions Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Solutions</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Hôtels indépendants</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Chaînes hôtelières</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Agences marketing</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Restaurants</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Resorts & Spas</a></li>
            </ul>
          </div>
          
          {/* Support & Legal Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support & Légal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Statut des services</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Politique de confidentialité</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4 md:mb-0">
              <span>© 2024 {landingData.brand}. Tous droits réservés.</span>
              <span className="hidden md:inline">•</span>
              <span className="text-gray-500">Fait avec ❤️ à Paris</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>🇫🇷 Français</span>
              <span>•</span>
              <span>🌍 Europe</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Main Landing Component
const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        :root {
          --brand: #09725c;
          --accent: #ff914d;
          --ink: #0b1220;
          --muted: #6b7280;
          --bg: #fafafa;
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      
      <Navbar />
      
      <Hero />
      <Benefits />
      <VideosGenerated />
      <Steps />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}

export default Landing