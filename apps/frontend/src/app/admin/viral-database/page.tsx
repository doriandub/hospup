'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Save,
  Trash2, 
  Copy,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2
} from 'lucide-react'

interface ViralVideo {
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
  script: string // JSON string
}

export default function ViralDatabaseAdmin() {
  const [videos, setVideos] = useState<ViralVideo[]>([])
  const [pasteData, setPasteData] = useState('')
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null)
  const [tempValue, setTempValue] = useState('')

  // Load videos
  useEffect(() => {
    const stored = localStorage.getItem('viral_videos_table')
    if (stored) {
      setVideos(JSON.parse(stored))
    } else {
      // Sample data
      setVideos([
        {
          hotel_name: 'Viens on part loin 🌍✈️',
          username: 'viensonpartloin_',
          country: 'France',
          video_link: 'https://www.instagram.com/p/DNcv2FosD_6/',
          account_link: 'https://www.instagram.com/viensonpartloin_/',
          followers: 235000,
          views: 1170352,
          likes: 22206,
          comments: 299,
          duration: 12.0,
          script: '{"clips":[{"order":1,"duration":3.80,"description":"Airplane view of clouds from a window, two figures walking on the clouds, daytime, high angle, wide shot, surreal, cinematic."}],"texts":[{"content":"DEPUIS SON HUBLOT, ELLE FILME UNE SCÈNE\\nSURRÉALISTE DANS LES NUAGES… 🫙","start":0.00,"end":3.80,"anchor":"top_center","x":0.50,"y":0.12,"w":"auto","h":"auto","align":"center","font_family":"Poppins","weight":400,"size_rel":0.035,"color":"#000000","background_color":null,"background_opacity":0.0,"stroke_color":null,"stroke_width_rel":0.0,"stroke_opacity":0.0,"shadow_blur":0,"shadow_dx":0,"shadow_dy":0,"shadow_opacity":0.0,"animation_in":"fade","animation_out":"fade","confidence":0.95}]}'
        }
      ])
    }
  }, [])

  // Save videos
  const saveVideos = (newVideos: ViralVideo[]) => {
    setVideos(newVideos)
    localStorage.setItem('viral_videos_table', JSON.stringify(newVideos))
  }

  // Handle paste from Airtable/Excel
  const handlePaste = () => {
    try {
      const rows = pasteData.trim().split('\n')
      const newVideos: ViralVideo[] = []
      
      rows.forEach((row, index) => {
        // Split by tab (Excel/Airtable format)
        const cols = row.split('\t')
        
        if (cols.length >= 10) {
          newVideos.push({
            hotel_name: cols[0] || '',
            username: cols[1] || '',
            country: cols[2] || '',
            video_link: cols[3] || '',
            account_link: cols[4] || '',
            followers: parseInt(cols[5]) || 0,
            views: parseInt(cols[6]) || 0,
            likes: parseInt(cols[7]) || 0,
            comments: parseInt(cols[8]) || 0,
            duration: parseFloat(cols[9]) || 0,
            script: cols[10] || '{"clips":[]}'
          })
        }
      })
      
      saveVideos([...videos, ...newVideos])
      setPasteData('')
      setShowPasteModal(false)
    } catch (error) {
      alert('Error parsing data. Make sure you copy from Airtable with all columns.')
    }
  }

  // Export to clipboard (Excel format)
  const exportToClipboard = () => {
    const tsv = videos.map(v => 
      [v.hotel_name, v.username, v.country, v.video_link, v.account_link, v.followers, v.views, v.likes, v.comments, v.duration, v.script].join('\t')
    ).join('\n')
    
    navigator.clipboard.writeText(tsv)
    alert('Copied to clipboard! You can paste this in Excel/Airtable')
  }

  // Start editing
  const startEdit = (row: number, col: string, value: any) => {
    setEditingCell({ row, col })
    setTempValue(String(value))
  }

  // Save edit
  const saveEdit = () => {
    if (editingCell) {
      const updatedVideos = [...videos]
      const video = updatedVideos[editingCell.row]
      
      switch(editingCell.col) {
        case 'hotel_name': video.hotel_name = tempValue; break
        case 'username': video.username = tempValue; break
        case 'country': video.country = tempValue; break
        case 'video_link': video.video_link = tempValue; break
        case 'account_link': video.account_link = tempValue; break
        case 'followers': video.followers = parseInt(tempValue) || 0; break
        case 'views': video.views = parseInt(tempValue) || 0; break
        case 'likes': video.likes = parseInt(tempValue) || 0; break
        case 'comments': video.comments = parseInt(tempValue) || 0; break
        case 'duration': video.duration = parseFloat(tempValue) || 0; break
        case 'script': video.script = tempValue; break
      }
      
      saveVideos(updatedVideos)
      setEditingCell(null)
    }
  }

  // Delete row
  const deleteRow = (index: number) => {
    const updatedVideos = videos.filter((_, i) => i !== index)
    saveVideos(updatedVideos)
  }

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileSpreadsheet className="w-6 h-6 text-primary mr-2" />
              Viral Videos Database (Excel-like)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Copy rows from Airtable and paste here directly
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={exportToClipboard}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
            <Button 
              onClick={() => setShowPasteModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Paste from Airtable
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Hotel Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Username</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Country</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Video Link</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Account Link</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Followers</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Views</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Likes</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Comments</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Duration</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Script</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video, index) => (
                <tr key={video.hotel_name + index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'hotel_name' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'hotel_name', video.hotel_name)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {video.hotel_name}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'username' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'username', video.username)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {video.username}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'country' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'country', video.country)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {video.country}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'video_link' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'video_link', video.video_link)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded truncate max-w-xs"
                      >
                        {video.video_link || '-'}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'account_link' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'account_link', video.account_link)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded truncate max-w-xs"
                      >
                        {video.account_link || '-'}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'followers' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'followers', video.followers)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {formatNumber(video.followers)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'views' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'views', video.views)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {formatNumber(video.views)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'likes' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'likes', video.likes)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {formatNumber(video.likes)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'comments' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'comments', video.comments)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {formatNumber(video.comments)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'duration' ? (
                      <input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full px-2 py-1 border border-primary rounded"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'duration', video.duration)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {video.duration}s
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-sm">
                    {editingCell?.row === index && editingCell?.col === 'script' ? (
                      <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={saveEdit}
                        className="w-full px-2 py-1 border border-primary rounded text-xs font-mono"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => startEdit(index, 'script', video.script)}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        <div className="text-xs font-mono truncate max-w-xs">
                          {video.script ? video.script.substring(0, 30) + '...' : 'Click to edit'}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  <td className="px-3 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRow(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {videos.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center mt-4">
            <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
            <p className="text-gray-600 mb-4">
              Copy your data from Airtable and paste it here
            </p>
            <Button 
              onClick={() => setShowPasteModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Paste from Airtable
            </Button>
          </div>
        )}

        {/* Paste Modal */}
        {showPasteModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Paste from Airtable/Excel</h3>
              <p className="text-sm text-gray-600 mb-4">
                Copy rows from Airtable (Ctrl+C) and paste here. Format: Hotel name, Username, Country, Video link, Account link, Followers, Views, Likes, Comments, Duration, Script (JSON)
              </p>
              <textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="Paste your data here (tab-separated, like from Excel/Airtable)..."
                className="w-full h-64 p-3 border border-gray-200 rounded-lg font-mono text-sm"
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handlePaste}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Videos
                </Button>
                <Button variant="outline" onClick={() => setShowPasteModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}