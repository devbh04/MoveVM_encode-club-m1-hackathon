import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit2,
  Check,
  X,
  RefreshCw,
  FileCode,
  FileText,
  Settings,
  Lock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useBuilderStore } from '../store/builderStore';

interface FileItem {
  name: string;
  content: string;
  path: string;
  type: 'source' | 'build' | 'config';
  readOnly?: boolean;
  lastModified?: string;
}

export default function FileExplorer() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  
  const { files, currentFile, setCurrentFile, addFile, deleteFile, updateFile, loadFilesFromProject } = useBuilderStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbFiles, setDbFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['sources', 'build']));

  useEffect(() => {
    if (projectId) {
      loadFilesFromDB();
    }
  }, [projectId]);

  const loadFilesFromDB = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(getApiUrl(`projects/${projectId}/files`));
      const data = await response.json();
      
      if (data.success) {
        setDbFiles(data.files || []);
        
        // Load all editable files into Zustand store on initial load
        loadFilesFromProject(data.files || []);
      }
    } catch (error) {
      console.error('Error loading files from DB:', error);
    }
  };

  const syncFromBackend = async () => {
    if (!projectId) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(getApiUrl(`projects/${projectId}/sync-files`));
      const data = await response.json();
      
      if (data.success) {
        setDbFiles(data.files || []);
        
        // Reload all files from project data to preserve content
        loadFilesFromProject(data.files || []);
      }
    } catch (error) {
      console.error('Error syncing files:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveFileToDb = async (fileName: string, content: string) => {
    if (!projectId) return;
    
    try {
      const actualFileName = fileName.split('/').pop() || fileName;
      const filePath = fileName.includes('/') 
        ? fileName.split('/').slice(0, -1).join('/') 
        : 'sources';
      
      await fetch(getApiUrl(`projects/${projectId}/files`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: actualFileName,
          content,
          path: filePath,
          type: 'source'
        })
      });
    } catch (error) {
      console.error('Error saving file to DB:', error);
    }
  };

  const handleCreateFile = async () => {
    if (newFileName.trim()) {
      // Ensure we don't have this file already
      const existingFile = dbFiles.find(f => f.name === newFileName);
      if (existingFile) {
        alert('File already exists');
        return;
      }
      
      // Create truly fresh file with minimal content
      const defaultContent = newFileName.endsWith('.move') 
        ? `// ${newFileName}\n\n`
        : '';
      
      // Store with full path sources/filename
      const fullPath = `sources/${newFileName}`;
      
      // Add to local store with fresh content using full path
      addFile(fullPath, defaultContent);
      
      // Save to backend (DB + filesystem)
      await saveFileToDb(newFileName, defaultContent);
      
      // Add to dbFiles locally without reloading from server
      // This prevents overwriting other files that haven't auto-saved yet
      setDbFiles(prev => [...prev, {
        name: newFileName,
        content: defaultContent,
        path: 'sources',
        type: 'source',
        readOnly: false,
        lastModified: new Date().toISOString()
      }]);
      
      setNewFileName('');
      setIsCreating(false);
      setCurrentFile(fullPath);
    }
  };

  const handleDeleteFile = async (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (Object.keys(files).length > 1) {
      // Delete from local store immediately
      deleteFile(fileName);
      
      // Delete from backend (DB + filesystem)
      if (projectId) {
        // Extract just the filename, not the full path
        const actualFileName = fileName.split('/').pop() || fileName;
        await fetch(getApiUrl(`projects/${projectId}/files/${actualFileName}`), {
          method: 'DELETE'
        }).catch(console.error);
        
        // Remove from dbFiles locally without reloading
        setDbFiles(prev => prev.filter(f => f.name !== actualFileName));
      }
    }
  };

  const handleRename = async (oldName: string) => {
    if (editName.trim() && editName !== oldName && !files[editName]) {
      const content = files[oldName];
      
      // Update local store
      deleteFile(oldName);
      addFile(editName, content);
      
      // Delete old file and create new one in backend
      if (projectId) {
        // Extract just the filename for delete
        const actualOldFileName = oldName.split('/').pop() || oldName;
        await fetch(getApiUrl(`projects/${projectId}/files/${actualOldFileName}`), {
          method: 'DELETE'
        }).catch(console.error);
        
        await saveFileToDb(editName, content);
        
        // Update dbFiles locally without reloading
        setDbFiles(prev => {
          const filtered = prev.filter(f => f.name !== actualOldFileName);
          return [...filtered, {
            name: editName,
            content,
            path: 'sources',
            type: 'source',
            readOnly: false,
            lastModified: new Date().toISOString()
          }];
        });
      }
      
      setCurrentFile(editName);
      setEditingFile(null);
      setEditName('');
    }
  };

  const startRename = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFile(fileName);
    setEditName(fileName);
  };

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (type === 'config') return <Settings className="w-4 h-4 text-orange-400" />;
    if (fileName.endsWith('.move')) return <FileCode className="w-4 h-4 text-amber-400" />;
    if (fileName.endsWith('.mv')) return <File className="w-4 h-4 text-blue-400" />;
    if (fileName.endsWith('.yaml') || fileName.endsWith('.toml')) return <FileText className="w-4 h-4 text-yellow-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  // Organize files by folder
  const organizeFiles = () => {
    const organized: Record<string, FileItem[]> = {
      'sources': [],
      'build': [],
      'config': []
    };

    dbFiles.forEach(file => {
      if (file.type === 'config') {
        organized['config'].push(file);
      } else if (file.path.startsWith('build')) {
        organized['build'].push(file);
      } else {
        organized['sources'].push(file);
      }
    });

    return organized;
  };

  const organizedFiles = organizeFiles();

  const renderFile = (file: FileItem, index: number) => {
    // Build consistent paths like in loadFilesFromProject
    let storePath: string;
    let fullPath: string;
    
    if (file.name === 'Move.toml') {
      storePath = 'Move.toml';
      fullPath = 'Move.toml';
    } else if (file.name === 'project.move' && (!file.path || file.path === '')) {
      // Migration: old project.move files without path
      storePath = 'sources/project.move';
      fullPath = 'sources/project.move';
    } else if (file.path && file.path !== '') {
      storePath = `${file.path}/${file.name}`;
      fullPath = `${file.path}/${file.name}`;
    } else {
      // Default to sources/ for .move files
      storePath = file.name.endsWith('.move') ? `sources/${file.name}` : file.name;
      fullPath = storePath;
    }
    
    const isActive = currentFile === storePath;
    const isEditing = editingFile === storePath;

    const handleFileClick = () => {
      // Load file content into editor
      if (file.type === 'source' || file.type === 'config') {
        // If file is not in local store, add it with actual content from DB
        if (!files[storePath]) {
          addFile(storePath, file.content || '');
        }
        
        // Small delay to ensure current file is saved before switching
        setTimeout(() => {
          setCurrentFile(storePath);
        }, 0);
      }
    };

    return (
      <div
        key={`${storePath}-${index}`}
        onClick={handleFileClick}
        className={`
          group flex items-center justify-between px-3 py-2 rounded-md transition-all
          ${isActive
            ? 'bg-gradient-to-r from-amber-600/20 to-blue-600/20 border border-amber-500/30 text-amber-300'
            : file.readOnly
            ? 'text-slate-500 hover:bg-slate-800/30 cursor-not-allowed'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 cursor-pointer'
          }
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getFileIcon(file.name, file.type)}
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(storePath);
                if (e.key === 'Escape') {
                  setEditingFile(null);
                  setEditName('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-6 text-xs bg-slate-900 border-slate-700 text-slate-200"
              autoFocus
            />
          ) : (
            <span className="text-xs truncate font-mono">{file.name}</span>
          )}
          {file.readOnly && <Lock className="w-3 h-3 text-slate-600" />}
        </div>
        
        {!isEditing && !file.readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => startRename(storePath, e)}
              className="h-5 w-5 p-0 text-slate-500 hover:text-blue-400"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            {Object.keys(files).length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteFile(storePath, e)}
                className="h-5 w-5 p-0 text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFolder = (folderName: string, files: FileItem[]) => {
    const isExpanded = expandedFolders.has(folderName);
    const folderLabel = folderName.charAt(0).toUpperCase() + folderName.slice(1);
    const isReadOnly = folderName === 'build';

    return (
      <div key={folderName} className="mb-2">
        <div
          onClick={() => toggleFolder(folderName)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-800/30 group"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-400" />
          ) : (
            <Folder className="w-4 h-4 text-blue-400" />
          )}
          <span className="text-xs font-medium text-slate-300">{folderLabel}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-700 text-slate-500">
            {files.length}
          </Badge>
          {isReadOnly && (
            <Lock className="w-3 h-3 text-slate-600" />
          )}
        </div>
        
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5 w-[calc(100%-3rem)]">
            {files.length > 0 ? (
              files.map((file, index) => renderFile(file, index))
            ) : (
              <div className="px-3 py-2 text-xs text-slate-600 italic">
                No files
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a] border-r border-slate-800/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Explorer
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={syncFromBackend}
              disabled={isSyncing}
              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
              title="Sync from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
              title="New file"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {isCreating && (
          <div className="flex items-center gap-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              placeholder="filename.move"
              className="h-7 text-xs bg-slate-900/50 border-slate-700 text-slate-200"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateFile}
              className="h-7 px-2 bg-amber-600 hover:bg-amber-700"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewFileName('');
              }}
              className="h-7 px-2"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Config Files */}
          {organizedFiles.config.length > 0 && renderFolder('config', organizedFiles.config)}
          
          {/* Source Files */}
          {renderFolder('sources', organizedFiles.sources)}
          
          {/* Build Files */}
          {organizedFiles.build.length > 0 && renderFolder('build', organizedFiles.build)}
        </div>
      </ScrollArea>
    </div>
  );
}

