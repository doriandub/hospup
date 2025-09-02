'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Upload,
  Download,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Loader2,
  Edit3,
  Check,
  X,
  Copy,
  Clipboard
} from 'lucide-react'

interface ViralVideo {
  id: string
  title: string
  hotel_name: string
  username: string
  country: string
  video_link: string
  account_link: string
  followers: number
  views: number
  likes: number
  comments: number
  duration: number
  category: string
  description: string
  popularity_score: number
  tags: string
  script: string
}

const COLUMNS = [
  { key: 'title', label: 'Titre', type: 'text', width: '200px' },
  { key: 'hotel_name', label: 'Hotel', type: 'text', width: '150px' },
  { key: 'username', label: 'Username', type: 'text', width: '120px' },
  { key: 'country', label: 'Pays', type: 'text', width: '100px' },
  { key: 'video_link', label: 'Lien Vidéo', type: 'url', width: '120px' },
  { key: 'account_link', label: 'Lien Compte', type: 'url', width: '120px' },
  { key: 'followers', label: 'Followers', type: 'number', width: '100px' },
  { key: 'views', label: 'Vues', type: 'number', width: '100px' },
  { key: 'likes', label: 'Likes', type: 'number', width: '100px' },
  { key: 'comments', label: 'Commentaires', type: 'number', width: '100px' },
  { key: 'duration', label: 'Durée', type: 'number', width: '80px' },
  { key: 'category', label: 'Catégorie', type: 'select', width: '120px', options: [
    'Morning Routine', 'Hotel Tour', 'Pool/Beach', 'Food & Drinks', 'Wellness/Spa', 
    'Activities', 'Room Service', 'Local Experience', 'Travel Tips', 'Behind the Scenes'
  ]},
  { key: 'popularity_score', label: 'Score', type: 'number', width: '80px' },
  { key: 'description', label: 'Description', type: 'textarea', width: '200px' },
  { key: 'tags', label: 'Tags', type: 'text', width: '150px' },
  { key: 'script', label: 'Script JSON', type: 'textarea', width: '200px' }
]

export default function DatabasePage() {
  const router = useRouter()
  const [data, setData] = useState<ViralVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{rowId: string, column: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)
  const [pasteData, setPasteData] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const templates = await response.json()
        const formattedData = templates.map((t: any) => ({
          id: t.id,
          title: t.title || '',
          hotel_name: t.hotel_name || '',
          username: t.username || '',
          country: t.country || '',
          video_link: t.video_link || '',
          account_link: t.account_link || '',
          followers: t.followers || 0,
          views: t.views || 0,
          likes: t.likes || 0,
          comments: t.comments || 0,
          duration: t.duration || 0,
          category: t.category || '',
          description: t.description || '',
          popularity_score: t.popularity_score || 0,
          tags: Array.isArray(t.tags) ? t.tags.join(', ') : '',
          script: typeof t.script === 'object' ? JSON.stringify(t.script, null, 2) : t.script || ''
        }))
        setData(formattedData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = (rowId: string, column: string, currentValue: any, event?: React.MouseEvent) => {
    // Si on maintient Shift ou Ctrl, on sélectionne multiple
    if (event && (event.shiftKey || event.ctrlKey)) {
      const cellKey = `${rowId}-${column}`
      setSelectedCells(prev => {
        const newSet = new Set(prev)
        if (newSet.has(cellKey)) {
          newSet.delete(cellKey)
        } else {
          newSet.add(cellKey)
        }
        return newSet
      })
      return
    }
    
    // Sinon, édition normale
    setSelectedCells(new Set())
    setEditingCell({ rowId, column })
    setEditValue(currentValue?.toString() || '')
  }

  const handleSaveCell = async () => {
    if (!editingCell) return
    
    setSaving(editingCell.rowId)
    try {
      let processedValue: any = editValue
      const column = COLUMNS.find(c => c.key === editingCell.column)
      
      if (column?.type === 'number') {
        processedValue = parseFloat(editValue) || 0
      } else if (editingCell.column === 'tags') {
        processedValue = editValue.split(',').map(tag => tag.trim()).filter(tag => tag)
      } else if (editingCell.column === 'script' && editValue.trim()) {
        try {
          processedValue = JSON.parse(editValue)
        } catch (e) {
          alert('JSON invalide dans le script')
          return
        }
      }
      
      const updateData: any = { [editingCell.column]: processedValue }
      
      const response = await fetch(`https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates/${editingCell.rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        // Update local data
        setData(prev => prev.map(row => 
          row.id === editingCell.rowId 
            ? { ...row, [editingCell.column]: editingCell.column === 'script' ? editValue : processedValue }
            : row
        ))
        setEditingCell(null)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleAddRow = async () => {
    try {
      const response = await fetch('https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'Nouvelle Vidéo',
          description: '',
          category: 'Hotel Tour',
          popularity_score: 5.0,
          total_duration_min: 15.0,
          total_duration_max: 60.0,
          tags: [],
          script: { clips: [], texts: [] }
        })
      })
      
      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Failed to add row:', error)
    }
  }

  // Gestion du copier-coller depuis Airtable
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    event.preventDefault()
    const clipboardData = event.clipboardData.getData('text/plain')
    
    if (!clipboardData.trim()) return
    
    // Diviser les données par lignes et colonnes (format TSV d'Airtable)
    const rows = clipboardData.trim().split('\n')
    const parsedRows = rows.map(row => row.split('\t'))
    
    console.log('Données collées:', parsedRows)
    
    // Créer des nouvelles lignes pour chaque ligne collée
    for (const row of parsedRows) {
      if (row.length > 0 && row[0].trim()) {
        try {
          await fetch('https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              title: row[0] || 'Nouvelle Vidéo',
              hotel_name: row[1] || '',
              username: row[2] || '',
              country: row[3] || '',
              video_link: row[4] || '',
              account_link: row[5] || '',
              followers: parseFloat(row[6]) || 0,
              views: parseFloat(row[7]) || 0,
              likes: parseFloat(row[8]) || 0,
              comments: parseFloat(row[9]) || 0,
              duration: parseFloat(row[10]) || 0,
              category: row[11] || 'Travel Tips',
              popularity_score: parseFloat(row[12]) || 5.0,
              description: row[13] || '',
              tags: row[14] ? row[14].split(',').map(t => t.trim()) : [],
              script: row[15] ? { clips: [], texts: [], raw: row[15] } : { clips: [], texts: [] }
            })
          })
        } catch (error) {
          console.error('Erreur lors de l\'ajout:', error)
        }
      }
    }
    
    // Recharger les données
    await loadData()
    alert(`✅ ${parsedRows.length} lignes ajoutées depuis Airtable!`)
  }, [])

  const handleCopySelectedCells = () => {
    if (selectedCells.size === 0) return
    
    const cellData: string[] = []
    selectedCells.forEach(cellKey => {
      const [rowId, column] = cellKey.split('-')
      const row = data.find(r => r.id === rowId)
      if (row) {
        const value = row[column as keyof ViralVideo]
        cellData.push(value?.toString() || '')
      }
    })
    
    navigator.clipboard.writeText(cellData.join('\t'))
    alert(`📋 ${selectedCells.size} cellules copiées!`)
  }

  const handleDeleteRow = async (id: string) => {
    if (!confirm('Supprimer cette ligne ?')) return
    
    try {
      const response = await fetch(`https://web-production-93a0d.up.railway.app/api/v1/viral-matching/viral-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setData(prev => prev.filter(row => row.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete row:', error)
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleExportCSV = () => {
    const headers = COLUMNS.map(col => col.label).join(',')
    const rows = filteredAndSortedData.map(row => 
      COLUMNS.map(col => {
        const value = row[col.key as keyof ViralVideo]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      }).join(',')
    ).join('\n')
    
    const csv = headers + '\n' + rows
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'viral_videos_database.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter and sort data
  const filteredAndSortedData = data
    .filter(row => 
      searchTerm === '' || 
      Object.values(row).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortColumn) return 0
      
      const aVal = a[sortColumn as keyof ViralVideo]
      const bVal = b[sortColumn as keyof ViralVideo]
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      const aStr = aVal?.toString() || ''
      const bStr = bVal?.toString() || ''
      
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })

  const renderCell = (row: ViralVideo, column: any) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.column === column.key
    const value = row[column.key as keyof ViralVideo]
    const isSaving = saving === row.id

    if (isEditing) {
      if (column.type === 'select') {
        return (
          <div className="flex items-center space-x-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {column.options.map((option: string) => (
                  <SelectItem key={option} value={option} className="text-xs">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={handleSaveCell} className="h-6 w-6 p-0">
              <Check className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      }

      if (column.type === 'textarea') {
        return (
          <div className="flex items-start space-x-1">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-xs border rounded px-1 py-0.5 resize-none w-full"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveCell()
                } else if (e.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
            />
            <div className="flex flex-col space-y-1">
              <Button size="sm" variant="ghost" onClick={handleSaveCell} className="h-6 w-6 p-0">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="flex items-center space-x-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-xs h-6 border"
            type={column.type}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveCell()
              } else if (e.key === 'Escape') {
                handleCancelEdit()
              }
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSaveCell} className="h-6 w-6 p-0">
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    // Display mode
    let displayValue = value?.toString() || ''
    
    if (column.type === 'url' && displayValue) {
      return (
        <div 
          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer truncate"
          onClick={() => window.open(displayValue, '_blank')}
          title={displayValue}
        >
          🔗 {displayValue.length > 20 ? displayValue.substring(0, 20) + '...' : displayValue}
        </div>
      )
    }

    if (column.type === 'number') {
      displayValue = typeof value === 'number' ? value.toLocaleString() : '0'
    }

    if (column.key === 'script' && displayValue) {
      displayValue = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue
    }

    const cellKey = `${row.id}-${column.key}`
    const isSelected = selectedCells.has(cellKey)
    
    return (
      <div 
        className={`text-xs cursor-pointer px-1 py-0.5 rounded truncate ${
          isSaving ? 'opacity-50' : ''
        } ${
          isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'
        }`}
        onClick={(e) => handleCellClick(row.id, column.key, value, e)}
        title={value?.toString()}
      >
        {isSaving && <Loader2 className="inline w-3 h-3 animate-spin mr-1" />}
        {displayValue || <span className="text-gray-400 italic">Cliquer pour éditer</span>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 max-w-full mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Chargement de la base de données...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Base de Données - Vidéos Virales
            </h1>
            <p className="text-gray-600 mt-1">{filteredAndSortedData.length} vidéos</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          {selectedCells.size > 0 && (
            <Button onClick={handleCopySelectedCells} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copier ({selectedCells.size})
            </Button>
          )}
          
          <Button onClick={handleAddRow} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ligne
          </Button>
          
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Instructions copier-coller */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Clipboard className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">📋 Copier-Coller depuis Airtable</h3>
            <p className="text-sm text-blue-700">
              1. Sélectionnez vos données dans Airtable (Ctrl+C) <br/>
              2. Cliquez dans cette zone et collez (Ctrl+V) → Les lignes seront automatiquement ajoutées! <br/>
              3. Maintenez Ctrl/Shift pour sélectionner plusieurs cellules ici
            </p>
          </div>
        </div>
      </div>

      {/* Zone de collage invisible */}
      <textarea
        className="sr-only"
        onPaste={handlePaste}
        placeholder="Zone de collage (invisible)"
      />

      {/* Table */}
      <div 
        className="border rounded-lg overflow-hidden bg-white"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="w-12 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  #
                </th>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r cursor-pointer hover:bg-gray-100"
                    style={{ width: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.label}</span>
                      {sortColumn === column.key && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-20 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((row, index) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-gray-50"
                  onContextMenu={(e) => {
                    e.preventDefault()
                    // Menu contextuel possible ici
                  }}
                >
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500 border-r">
                    {index + 1}
                  </td>
                  {COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className="px-1 py-1 border-r"
                      style={{ width: column.width }}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRow(row.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedData.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border mt-4">
          <p className="text-gray-500">Aucune donnée trouvée</p>
          <Button onClick={handleAddRow} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter la première ligne
          </Button>
        </div>
      )}
    </div>
  )
}