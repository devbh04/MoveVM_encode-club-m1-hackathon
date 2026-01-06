import React, { useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useBuilderStore } from '../store/builderStore';
import { useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../lib/config';

interface CodeEditorProps {
  onCodeChange?: (code: string) => void;
}

export default function CodeEditor({ onCodeChange }: CodeEditorProps) {
  const { code, setCode, currentFile, files, updateFile } = useBuilderStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFileRef = useRef<string>(currentFile);
  const isLoadingFileRef = useRef(false);

  // Sync code with current file
  useEffect(() => {
    // If file changed, load its content
    if (previousFileRef.current !== currentFile) {
      // First, ensure any pending save is cleared
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Save the previous file's content before switching
      // IMPORTANT: Use files[prevFile] not code, as code might already be updated
      const prevFile = previousFileRef.current;
      if (prevFile && prevFile !== 'Move.toml' && files[prevFile] !== undefined) {
        const prevContent = files[prevFile]; // Use content from store, not code state
        if (prevContent) {
          // Immediately save previous file content to backend
          saveToBackend(prevFile, prevContent);
        }
      }
      
      // Now load the new file
      isLoadingFileRef.current = true;
      const fileContent = files[currentFile] || '';
      setCode(fileContent);
      previousFileRef.current = currentFile;
      
      // Reset loading flag after a short delay
      setTimeout(() => {
        isLoadingFileRef.current = false;
      }, 100);
    }
  }, [currentFile, files, setCode]);

  // Update file when code changes (but not when switching files)
  useEffect(() => {
    // Skip if we're loading a file
    if (isLoadingFileRef.current) {
      return;
    }
    
    // Don't save Move.toml - it's read-only from backend
    if (currentFile === 'Move.toml') {
      return;
    }
    
    if (currentFile && files[currentFile] !== code) {
      updateFile(currentFile, code);
      if (onCodeChange) {
        onCodeChange(code);
      }
      
      // Auto-save to backend after 1 second of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveToBackend(currentFile, code);
      }, 1000);
    }
  }, [code, currentFile, files, updateFile, onCodeChange]);
  
  const saveToBackend = async (fileName: string, content: string) => {
    if (!projectId) return;
    
    try {
      // Determine file type and path
      let fileType = 'source';
      let filePath = 'sources';
      let actualFileName = fileName;
      
      if (fileName === 'Move.toml') {
        fileType = 'config';
        filePath = '';
      } else if (fileName.includes('/')) {
        filePath = fileName.split('/').slice(0, -1).join('/');
        actualFileName = fileName.split('/').pop() || fileName;
      }
      
      await fetch(getApiUrl(`projects/${projectId}/files`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: actualFileName,
          content,
          path: filePath,
          type: fileType
        })
      });
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs text-slate-400 font-mono">{currentFile}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="h-7 px-3 text-xs text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            className="w-12 bg-slate-900/50 border-r border-slate-800/50 text-right py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="px-2 space-y-0">
              {lines.map((line) => (
                <div
                  key={line}
                  className="text-xs text-slate-600 font-mono leading-6 select-none"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Code Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              onScroll={handleScroll}
              readOnly={currentFile === 'Move.toml'}
              className={`absolute inset-0 w-full h-full p-4 bg-transparent text-slate-200 font-mono text-sm leading-6 resize-none focus:outline-none caret-amber-400 ${
                currentFile === 'Move.toml' ? 'cursor-not-allowed opacity-80' : ''
              }`}
              style={{
                tabSize: 2,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              }}
              spellCheck={false}
              placeholder="// Start writing your Move contract..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

