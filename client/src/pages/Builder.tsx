import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Code, ArrowLeft, Bot } from "lucide-react"
import FileExplorer from "../components/file-explorer"
import CodeEditor from "../components/code-editor-enhanced"
import DeploymentPanelV2 from "../components/deployment-panel-v2"
import DeploymentHistoryPanel from "../components/deployment-history"
import { useBuilderStore } from "../store/builderStore"
import { getApiUrl } from "../lib/config"

export default function BuilderPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('project')
  
  const [projectName, setProjectName] = useState("My Move Project")
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const { setCode, updateFile, currentFile, setCurrentFile, files } = useBuilderStore()

  // Load project data on mount
  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  const loadProject = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl(`projects/${id}`))
      const data = await response.json()
      
      if (data.success) {
        setProjectName(data.project.name)
        // Files will be loaded by FileExplorer component
        // Just ensure we have sources/project.move as current file if no file is selected
        if (!currentFile || currentFile === 'project.move') {
          setCurrentFile('sources/project.move')
        }
      } else {
        console.error("Failed to load project:", data.error)
      }
    } catch (error) {
      console.error("Error loading project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-200">
                  {isLoading ? "Loading..." : projectName}
                </h1>
                <p className="text-xs text-slate-500 font-mono">Code Editor</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setIsChatbotOpen(!isChatbotOpen)}
              className="text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <Bot className="w-4 h-4" />
            </Button>

            {/* Switch Toggle for Manage/History */}
            <div className="relative inline-flex items-center bg-slate-900/50 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setShowHistory(false)}
                className={`relative z-10 px-4 py-1.5 text-xs font-medium transition-colors rounded-md ${
                  !showHistory 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Manage
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`relative z-10 px-4 py-1.5 text-xs font-medium transition-colors rounded-md ${
                  showHistory 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                History
              </button>
              {/* Sliding background */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-linear-to-r transition-all duration-300 rounded-md ${
                  showHistory 
                    ? 'left-[calc(50%+2px)] from-blue-600 to-blue-700' 
                    : 'left-1 from-amber-600 to-amber-700'
                }`}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        <div className="w-64 shrink-0">
          <FileExplorer />
        </div>

        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentFile && files[currentFile] !== undefined ? (
            <CodeEditor onCodeChange={(newCode) => {
              setCode(newCode)
              updateFile(currentFile, newCode)
            }} />
          ) : (
            <div className="h-full flex items-center justify-center bg-[#0a0e1a]">
              <div className="text-center">
                <Code className="w-16 h-16 mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 text-sm">Select a file to start editing</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Deployment Panel */}
        {!showHistory && (
          <div className="w-80 shrink-0 border-l border-slate-800/50">
            <DeploymentPanelV2
              isChatbotOpen={isChatbotOpen}
              onChatbotClose={() => setIsChatbotOpen(false)}
              projectId={projectId || undefined}
            />
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="w-80 shrink-0 border-l border-slate-800/50">
            <DeploymentHistoryPanel />
          </div>
        )}
      </div>
    </div>
  )
}