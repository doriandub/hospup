'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Video, 
  Upload, 
  Heart, 
  Share2, 
  Play, 
  Download,
  Plus,
  Settings,
  User,
  Bell,
  Search,
  Filter,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Building2,
  BarChart3
} from 'lucide-react'

export default function DesignDemo() {
  const [activeTab, setActiveTab] = useState('buttons')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#115446] text-white rounded-lg mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">HOSPUP DESIGN SYSTEM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Design System Unifié
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Design moderne, propre et corporate pour Hospup
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-1">
            {['buttons', 'colors', 'cards', 'forms'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md font-medium text-sm transition-colors capitalize ${
                  activeTab === tab 
                    ? 'bg-[#115446] text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-12">
          
          {/* Buttons Section */}
          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Boutons</h2>
              
              {/* Primary Buttons */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Boutons Principaux</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Video className="w-4 h-4 mr-2" />
                    Générer vidéo
                  </Button>
                  
                  <Button variant="destructive">
                    <X className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                  
                  <Button size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer
                  </Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Boutons Secondaires</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  
                  <Button variant="secondary">
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                  
                  <Button variant="ghost">
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </Button>
                </div>
              </div>

              {/* Icon Buttons */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Boutons Icône</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default" size="icon">
                    <Play className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="secondary" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Colors Section */}
          {activeTab === 'colors' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">Palette de Couleurs</h2>
              
              {/* Primary Colors */}
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Couleurs Principales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#115446] rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Vert Hospup</p>
                    <p className="text-sm text-slate-500">#115446</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#FF6B35] rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Orange Énergie</p>
                    <p className="text-sm text-slate-500">#FF6B35</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white border-2 border-slate-200 rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Blanc Pur</p>
                    <p className="text-sm text-slate-500">#FFFFFF</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-900 rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Texte Principal</p>
                    <p className="text-sm text-slate-500">#0F172A</p>
                  </div>
                </div>
              </div>

              {/* Status Colors */}
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Couleurs de Statut</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-500 rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Succès</p>
                    <p className="text-sm text-slate-500">#10B981</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-red-500 rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Erreur</p>
                    <p className="text-sm text-slate-500">#EF4444</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-yellow-500 rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Attention</p>
                    <p className="text-sm text-slate-500">#F59E0B</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto mb-3 shadow-lg"></div>
                    <p className="font-medium text-slate-800">Information</p>
                    <p className="text-sm text-slate-500">#3B82F6</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards Section */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Cartes & Composants</h2>
              
              {/* Stats Cards */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cartes Statistiques</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-[#115446] p-2 rounded-lg">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold text-gray-900">24</div>
                        <div className="text-xs text-green-600 font-medium">+12%</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Vidéos</h4>
                      <p className="text-gray-600 text-sm">Contenu généré</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-gray-600 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold text-gray-900">3</div>
                        <div className="text-xs text-gray-600 font-medium">Actives</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Propriétés</h4>
                      <p className="text-gray-600 text-sm">Hôtels</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-orange-500 p-2 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold text-gray-900">2/5</div>
                        <div className="text-xs text-orange-600 font-medium">40%</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Crédits</h4>
                      <p className="text-gray-600 text-sm">Ce mois</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Succès</p>
                      <p className="text-sm text-green-600">Vidéo générée avec succès</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Erreur</p>
                      <p className="text-sm text-red-600">Impossible de traiter la demande</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Information</p>
                      <p className="text-sm text-blue-600">Nouvelle fonctionnalité disponible</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forms Section */}
          {activeTab === 'forms' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">Formulaires & Inputs</h2>
              
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'hôtel</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#115446] focus:border-[#115446] transition-all"
                      placeholder="Le Meurice"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea 
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#115446] focus:border-[#115446] transition-all h-24 resize-none"
                      placeholder="Décrivez votre établissement..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#115446] focus:border-[#115446] transition-all">
                      <option>Hôtel de luxe</option>
                      <option>Boutique hotel</option>
                      <option>Resort</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button className="flex-1 bg-[#115446] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#115446]/90 transition-all">
                      Sauvegarder
                    </button>
                    <button className="px-6 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-100 transition-all">
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 pt-12 border-t border-slate-200/60">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#115446] rounded-full animate-pulse"></div>
            <p className="text-slate-600 font-medium tracking-wider">
              HOSPUP AI DESIGN SYSTEM
            </p>
            <div className="w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
          <p className="text-slate-500 text-sm">
            Futuriste • IA • Corporate • Moderne
          </p>
        </div>
      </div>
    </div>
  )
}