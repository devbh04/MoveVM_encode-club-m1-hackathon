import React, { useEffect, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useBuilderStore } from '../store/builderStore';
import { useEditorStore } from '../store/editorStore';
import { useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../lib/config';
import {
  getAutocompleteSuggestions,
  type AutocompleteSuggestion,
} from '../lib/moveLanguage';

interface CodeEditorProps {
  onCodeChange?: (code: string) => void;
}

export default function CodeEditor({ onCodeChange }: CodeEditorProps) {
  const { code, setCode, currentFile, files, updateFile } = useBuilderStore();
  const {
    intellisenseEnabled,
    showAutocomplete,
    setShowAutocomplete,
    autocompletePosition,
    setAutocompletePosition,
    setCursorPosition,
  } = useEditorStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFileRef = useRef<string>(currentFile);
  const isLoadingFileRef = useRef(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current file is a Move file
  const isMoveFile = currentFile.endsWith('.move');

  // Sync code with current file
  useEffect(() => {
    if (previousFileRef.current !== currentFile) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const prevFile = previousFileRef.current;
      if (prevFile && prevFile !== 'Move.toml' && files[prevFile] !== undefined) {
        const prevContent = files[prevFile];
        if (prevContent) {
          saveToBackend(prevFile, prevContent);
        }
      }

      isLoadingFileRef.current = true;
      const fileContent = files[currentFile] || '';
      setCode(fileContent);
      previousFileRef.current = currentFile;

      setTimeout(() => {
        isLoadingFileRef.current = false;
      }, 100);
    }
  }, [currentFile, files, setCode]);

  // Update file when code changes
  useEffect(() => {
    if (isLoadingFileRef.current) {
      return;
    }

    if (currentFile === 'Move.toml') {
      return;
    }

    if (currentFile && files[currentFile] !== code) {
      updateFile(currentFile, code);
      if (onCodeChange) {
        onCodeChange(code);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveToBackend(currentFile, code);
      }, 1000);
    }
  }, [code, currentFile, files, updateFile, onCodeChange]);

  // Update syntax highlighting
  useEffect(() => {
    if (!isMoveFile || !highlightRef.current) return;

    const lines = code.split('\n');

    const highlightedLines = lines.map((line) => {
      if (!line.trim()) return '<div class="leading-6">&nbsp;</div>';

      // Use a token-based approach to avoid HTML escaping issues
      const tokens: Array<{ text: string; className?: string }> = [];
      let pos = 0;

      // Helper to escape HTML
      const escapeHtml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      // Helper to add token
      const addToken = (text: string, className?: string) => {
        if (text) {
          tokens.push({ text: escapeHtml(text), className });
        }
      };

      // Process line token by token
      while (pos < line.length) {
        const remainingText = line.substring(pos);

        // Check for attributes (#[view], #[test], etc.)
        const attributeMatch = remainingText.match(/^(#\[[^\]]*\])/);
        if (attributeMatch) {
          addToken(attributeMatch[1], 'text-teal-400 font-semibold');
          pos += attributeMatch[1].length;
          continue;
        }

        // Check for doc comments (///)
        const docCommentMatch = remainingText.match(/^(\/\/\/.*)/);
        if (docCommentMatch) {
          addToken(docCommentMatch[1], 'text-gray-400 italic');
          pos += docCommentMatch[1].length;
          continue;
        }

        // Check for regular comments (//)
        const commentMatch = remainingText.match(/^(\/\/[^\/].*)/);
        if (commentMatch) {
          addToken(commentMatch[1], 'text-gray-500 italic');
          pos += commentMatch[1].length;
          continue;
        }

        // Check for byte strings (b"...")
        const byteStringMatch = remainingText.match(/^(b"([^"]*)")/);
        if (byteStringMatch) {
          addToken(byteStringMatch[1], 'text-green-300');
          pos += byteStringMatch[1].length;
          continue;
        }

        // Check for strings
        const stringMatch = remainingText.match(/^("([^"]*)")/);
        if (stringMatch) {
          addToken(stringMatch[1], 'text-green-400');
          pos += stringMatch[1].length;
          continue;
        }

        // Check for hex addresses (@0x1, 0x...)
        const addressMatch = remainingText.match(/^(@?0x[0-9a-fA-F]+)/);
        if (addressMatch) {
          addToken(addressMatch[1], 'text-yellow-300');
          pos += addressMatch[1].length;
          continue;
        }

        // Check for numbers (including type suffixes like 100u64)
        const numberMatch = remainingText.match(/^(\d+(?:u8|u16|u32|u64|u128|u256|i8|i16|i32|i64|i128|i256)?)/);
        if (numberMatch) {
          addToken(numberMatch[1], 'text-yellow-400');
          pos += numberMatch[1].length;
          continue;
        }

        // Check for module paths (std::signer, error::not_found, aptos_framework::coin, etc.)
        const modulePathMatch = remainingText.match(/^([a-zA-Z_][a-zA-Z0-9_]*(::[a-zA-Z_][a-zA-Z0-9_]*)+)/);
        if (modulePathMatch) {
          const match = modulePathMatch[1];
          // Check if it's a standard library or framework module
          if (match.startsWith('std::') || match.startsWith('aptos_std::') || match.startsWith('aptos_framework::')) {
            addToken(match, 'text-pink-400');
          } else if (match.includes('::')) {
            // Function calls or other module paths
            addToken(match, 'text-cyan-400');
          } else {
            addToken(match, 'text-pink-400');
          }
          pos += match.length;
          continue;
        }

        // Check for built-in functions and macros
        const builtinFunctions = [
          'assert!', 'move_to', 'move_from', 'borrow_global', 'borrow_global_mut', 'exists',
          'freeze', 'copy', 'move'
        ];
        let builtinMatched = false;
        for (const func of builtinFunctions) {
          const escaped = func.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const funcMatch = remainingText.match(new RegExp(`^(${escaped})\\b`));
          if (funcMatch) {
            addToken(funcMatch[1], 'text-cyan-300 font-semibold');
            pos += funcMatch[1].length;
            builtinMatched = true;
            break;
          }
        }
        if (builtinMatched) continue;

        // Check for visibility modifiers
        const visibilityMatch = remainingText.match(/^(public\((?:friend|package|script)\))/);
        if (visibilityMatch) {
          addToken(visibilityMatch[1], 'text-yellow-400 font-semibold');
          pos += visibilityMatch[1].length;
          continue;
        }

        // Check for keywords
        const keywords = [
          'acquires', 'module', 'use', 'struct', 'fun', 'entry', 'public', 'private', 'const', 'native',
          'has', 'key', 'store', 'copy', 'drop', 'phantom', 'friend', 'script', 'enum', 'match',
          'if', 'else', 'while', 'loop', 'return', 'abort', 'break', 'continue',
          'let', 'mut', 'move', 'true', 'false', 'as', 'spec', 'test', 'test_only'
        ];
        let keywordMatched = false;
        for (const keyword of keywords) {
          const keywordMatch = remainingText.match(new RegExp(`^\\b(${keyword})\\b`));
          if (keywordMatch) {
            addToken(keywordMatch[1], 'text-yellow-400');
            pos += keywordMatch[1].length;
            keywordMatched = true;
            break;
          }
        }
        if (keywordMatched) continue;

        // Check for types (including Move 2.0 signed integers)
        const types = [
          'u8', 'u16', 'u32', 'u64', 'u128', 'u256',
          'i8', 'i16', 'i32', 'i64', 'i128', 'i256',
          'bool', 'address', 'vector', 'signer', 'String'
        ];
        let typeMatched = false;
        for (const type of types) {
          const typeMatch = remainingText.match(new RegExp(`^\\b(${type})\\b`));
          if (typeMatch) {
            addToken(typeMatch[1], 'text-blue-400');
            pos += typeMatch[1].length;
            typeMatched = true;
            break;
          }
        }
        if (typeMatched) continue;

        // Check for generic type parameters in angle brackets
        const genericMatch = remainingText.match(/^(<[^>]+>)/);
        if (genericMatch && pos > 0) {
          addToken(genericMatch[1], 'text-blue-300');
          pos += genericMatch[1].length;
          continue;
        }

        // Check for operators
        const operatorMatch = remainingText.match(/^(::|&mut|&|->|=>|&&|\|\||==|!=|<=|>=|<|>|\+|\-|\*|\/|%|!)/);
        if (operatorMatch) {
          addToken(operatorMatch[1], 'text-orange-400');
          pos += operatorMatch[1].length;
          continue;
        }

        // Default: add single character
        addToken(remainingText[0]);
        pos += 1;
      }

      // Build the highlighted line
      const highlightedLine = tokens.map(token => {
        if (token.className) {
          return `<span class="${token.className}">${token.text}</span>`;
        }
        return token.text;
      }).join('');

      return `<div class="leading-6">${highlightedLine || '&nbsp;'}</div>`;
    });

    highlightRef.current.innerHTML = highlightedLines.join('');
  }, [code, isMoveFile]);

  const saveToBackend = async (fileName: string, content: string) => {
    if (!projectId) return;

    try {
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
          type: fileType,
        }),
      });
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);

    // Update cursor position
    const textarea = e.target;
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    setCursorPosition({ line, column });

    // Show autocomplete if enabled and typing
    if (intellisenseEnabled && isMoveFile) {
      // Clear previous timeout
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }

      const currentLine = lines[lines.length - 1];
      const lastChar = currentLine[currentLine.length - 1];

      // Trigger autocomplete on certain characters or after a delay
      if (lastChar && /[a-zA-Z_0-9:]/.test(lastChar)) {
        // Small delay to avoid showing autocomplete on every keystroke
        autocompleteTimeoutRef.current = setTimeout(() => {
          const currentSelection = textareaRef.current?.selectionStart;
          const suggestions = getAutocompleteSuggestions(newCode, line, column);
          if (suggestions.length > 0 && textareaRef.current && textareaRef.current.selectionStart === currentSelection) {
            setSuggestions(suggestions);
            setShowAutocomplete(true);
            setAutocompletePosition({ line, column });
            setSelectedSuggestionIndex(0);
          } else {
            setShowAutocomplete(false);
          }
        }, 300);
      } else {
        setShowAutocomplete(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle autocomplete navigation
    if (showAutocomplete && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        return;
      }
    }

    // Handle tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertSuggestion = (suggestion: AutocompleteSuggestion) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const lines = code.substring(0, start).split('\n');
    const currentLine = lines[lines.length - 1];

    // Find the word being typed
    const wordMatch = currentLine.match(/\w+$/);
    const wordStart = wordMatch
      ? start - wordMatch[0].length
      : start;

    const insertText = suggestion.insertText || suggestion.label;
    const newCode =
      code.substring(0, wordStart) + insertText + code.substring(start);

    setCode(newCode);
    setShowAutocomplete(false);

    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = wordStart + insertText.length;
      textarea.focus();
    }, 0);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      lineNumbersRef.current.scrollTop = scrollTop;
      if (highlightRef.current) {
        highlightRef.current.scrollTop = scrollTop;
      }
    }
  };

  // Sync scroll positions
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScrollSync = () => {
      handleScroll();
    };

    textarea.addEventListener('scroll', handleScrollSync);
    return () => textarea.removeEventListener('scroll', handleScrollSync);
  }, [code]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Calculate autocomplete position
  const getAutocompleteStyle = () => {
    if (!autocompletePosition || !textareaRef.current || !showAutocomplete) return { display: 'none' };

    try {
      const textarea = textareaRef.current;
      const textBeforeCursor = code.substring(0, textarea.selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];

      // Create a temporary span to measure text width
      const measureSpan = document.createElement('span');
      measureSpan.style.visibility = 'hidden';
      measureSpan.style.position = 'absolute';
      measureSpan.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
      measureSpan.style.fontSize = '14px';
      measureSpan.style.whiteSpace = 'pre';
      measureSpan.textContent = currentLine;
      document.body.appendChild(measureSpan);

      const left = measureSpan.offsetWidth + 16 + 48; // 48 for line numbers, 16 for padding
      const lineHeight = 24;
      const headerHeight = 40;
      const top = (autocompletePosition.line - 1) * lineHeight + headerHeight + textarea.scrollTop;

      document.body.removeChild(measureSpan);

      return {
        position: 'absolute' as const,
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 1000,
      };
    } catch (e) {
      return { display: 'none' };
    }
  };

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
          {isMoveFile && (
            <span className="text-xs text-yellow-400/70 px-2 py-0.5 bg-yellow-400/10 rounded">
              Move
            </span>
          )}
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
            className="w-12 bg-slate-900/50 border-r border-slate-800/50 text-right py-4 overflow-y-auto no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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

          {/* Code Editor with Syntax Highlighting */}
          <div className="flex-1 relative">
            {/* Syntax Highlighted Overlay */}
            {isMoveFile && (
              <div
                ref={highlightRef}
                className="absolute inset-0 p-4 pointer-events-none overflow-hidden text-slate-200 font-mono text-sm leading-6 whitespace-pre-wrap"
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                  tabSize: 2,
                  zIndex: 1,
                  overflowY: 'auto',
                }}
              />
            )}

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onFocus={(e) => {
                // Ensure cursor is visible and working on focus
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.caretColor = '#facc15';
                // Force cursor to be visible and positioned correctly
                requestAnimationFrame(() => {
                  if (document.activeElement === textarea) {
                    const pos = textarea.selectionStart;
                    textarea.setSelectionRange(pos, pos);
                  }
                });
              }}
              onMouseDown={(e) => {
                // Ensure cursor works on click - don't prevent default
                const textarea = e.target as HTMLTextAreaElement;
                // Let the browser handle the click naturally
                requestAnimationFrame(() => {
                  textarea.focus();
                });
              }}
              onClick={(e) => {
                // Ensure cursor position is maintained on click
                const textarea = e.target as HTMLTextAreaElement;
                requestAnimationFrame(() => {
                  if (document.activeElement === textarea) {
                    const pos = textarea.selectionStart;
                    textarea.setSelectionRange(pos, pos);
                  }
                });
              }}
              onSelect={(e) => {
                // Maintain selection
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.caretColor = '#facc15';
              }}
              readOnly={currentFile === 'Move.toml'}
              className={`absolute inset-0 w-full h-full p-4 bg-transparent font-mono text-sm leading-6 resize-none focus:outline-none ${currentFile === 'Move.toml'
                  ? 'cursor-not-allowed opacity-80 text-slate-200'
                  : isMoveFile
                    ? 'text-slate-200/10'
                    : 'text-slate-200'
                }`}
              style={{
                tabSize: 2,
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                caretColor: '#facc15',
                color: isMoveFile ? 'rgba(226, 232, 240, 0.1)' : 'rgb(226 232 240)',
                zIndex: 10,
                WebkitTextFillColor: isMoveFile ? 'rgba(226, 232, 240, 0.1)' : 'rgb(226 232 240)',
              }}
              spellCheck={false}
              placeholder={isMoveFile ? undefined : "// Start writing your Move contract..."}
            />

            {/* Autocomplete Dropdown */}
            {showAutocomplete &&
              intellisenseEnabled &&
              isMoveFile &&
              suggestions.length > 0 && (
                <div
                  ref={autocompleteRef}
                  style={getAutocompleteStyle()}
                  className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl max-h-72 overflow-y-auto min-w-70 scrollbar-thin scrollbar-thumb-slate-700"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.label}-${index}`}
                      onClick={() => insertSuggestion(suggestion)}
                      className={`px-3 py-2 cursor-pointer flex items-center gap-2 border-b border-slate-800/50 last:border-b-0 ${index === selectedSuggestionIndex
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'text-slate-300 hover:bg-slate-800/50'
                        }`}
                    >
                      <span className="text-xs w-5 shrink-0">
                        {suggestion.kind === 'keyword' && '🔑'}
                        {suggestion.kind === 'type' && '📦'}
                        {suggestion.kind === 'function' && '⚙️'}
                        {suggestion.kind === 'module' && '📚'}
                        {suggestion.kind === 'struct' && '🏗️'}
                        {suggestion.kind === 'variable' && '📝'}
                        {suggestion.kind === 'attribute' && '🏷️'}
                        {suggestion.kind === 'snippet' && '✨'}
                      </span>
                      <span className="flex-1 font-mono text-sm truncate">
                        {suggestion.label}
                      </span>
                      {suggestion.detail && (
                        <span className="text-xs text-slate-500 truncate max-w-25">
                          {suggestion.detail}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

