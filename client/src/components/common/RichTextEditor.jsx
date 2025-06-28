import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Info, Bold, Italic, Underline, List, ListOrdered, Type, RotateCcw } from 'lucide-react';

const RichTextEditor = ({ 
  value, 
  onChange, 
  error, 
  helpText,
  placeholder = 'Start typing your product description...',
  disabled = false
}) => {
  const editorRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  
  // Add CSS for rich text formatting
  useEffect(() => {
    // Create or update the style element for rich text editor
    let styleElement = document.getElementById('rich-text-editor-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'rich-text-editor-styles';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      .rich-text-editor p {
        margin: 0 0 1em 0 !important;
        line-height: 1.6 !important;
      }
      
      .rich-text-editor p:last-child {
        margin-bottom: 0 !important;
      }
      
      .rich-text-editor ul,
      .rich-text-editor ol {
        margin: 0.75em 0 !important;
        padding-left: 1.5em !important;
      }
      
      .rich-text-editor li {
        margin: 0.25em 0 !important;
        line-height: 1.5 !important;
      }
      
      .rich-text-editor strong {
        font-weight: 600 !important;
      }
      
      .rich-text-editor em {
        font-style: italic !important;
      }
      
      .rich-text-editor u {
        text-decoration: underline !important;
      }
      
      .rich-text-editor br {
        line-height: 1.5 !important;
      }
      
      .rich-text-editor:focus {
        outline: none !important;
      }
      
      .rich-text-editor:empty:before {
        content: attr(data-placeholder);
        color: #9CA3AF;
        pointer-events: none;
      }
    `;
    
    return () => {
      // Cleanup function - remove styles when component unmounts
      const styleEl = document.getElementById('rich-text-editor-styles');
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, []);
  
  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Handle key presses for better UX
  const handleKeyDown = (e) => {
    // Handle Enter key for proper paragraph breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertParagraph();
    }
    
    // Handle Shift+Enter for line breaks
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      insertLineBreak();
    }
    
    // Handle Tab for indenting list items
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        outdentListItem();
      } else {
        indentListItem();
      }
    }
  };

  // Insert a new paragraph with proper spacing
  const insertParagraph = () => {
    try {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // Check if we're in a list item
      let currentNode = range.startContainer;
      let inListItem = false;
      
      while (currentNode && currentNode !== editorRef.current) {
        if (currentNode.nodeName === 'LI') {
          inListItem = true;
          break;
        }
        currentNode = currentNode.parentNode;
      }
      
      if (inListItem) {
        // If in a list, create a new list item
        execCommand('insertHTML', '</li><li>');
      } else {
        // Create new paragraph with proper spacing
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        
        range.deleteContents();
        range.insertNode(p);
        
        // Move cursor to new paragraph
        range.setStart(p, 0);
        range.setEnd(p, 0);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      handleInput();
    } catch (e) {
      // Fallback to inserting paragraph with HTML
      execCommand('insertHTML', '</p><p><br>');
    }
  };

  // Insert a line break
  const insertLineBreak = () => {
    execCommand('insertHTML', '<br>');
  };

  // Execute formatting command
  const execCommand = (command, value = null) => {
    try {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleInput();
    } catch (e) {
      console.warn('execCommand failed:', e);
    }
  };

  // Toggle bold
  const toggleBold = () => {
    execCommand('bold');
  };

  // Toggle italic
  const toggleItalic = () => {
    execCommand('italic');
  };

  // Toggle underline
  const toggleUnderline = () => {
    execCommand('underline');
  };

  // Toggle bullet list
  const toggleBulletList = () => {
    execCommand('insertUnorderedList');
  };

  // Toggle numbered list
  const toggleNumberedList = () => {
    execCommand('insertOrderedList');
  };

  // Indent list item
  const indentListItem = () => {
    execCommand('indent');
  };

  // Outdent list item
  const outdentListItem = () => {
    execCommand('outdent');
  };

  // Format as paragraph
  const formatParagraph = () => {
    execCommand('formatBlock', 'p');
  };

  // Clear all formatting
  const clearFormatting = () => {
    execCommand('removeFormat');
  };

  // Get current selection and check active states
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  // Update active states when selection changes
  const updateActiveStates = () => {
    try {
      if (document.queryCommandSupported) {
        setActiveStates({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline')
        });
      }
    } catch (e) {
      // Silently handle errors
    }
  };

  // Handle selection change
  const handleSelectionChange = () => {
    updateActiveStates();
  };

  // Add event listeners
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Convert HTML to plain text for character count
  const getTextContent = () => {
    if (editorRef.current) {
      return editorRef.current.textContent || '';
    }
    return '';
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1 p-3 bg-gray-50 border rounded-lg shadow-sm">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleBold}
              className={`p-2 rounded transition-colors ${
                activeStates.bold 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold size={16} />
            </button>
            
            <button
              type="button"
              onClick={toggleItalic}
              className={`p-2 rounded transition-colors ${
                activeStates.italic 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic size={16} />
            </button>
            
            <button
              type="button"
              onClick={toggleUnderline}
              className={`p-2 rounded transition-colors ${
                activeStates.underline 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleBulletList}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Bullet List"
            >
              <List size={16} />
            </button>
            
            <button
              type="button"
              onClick={toggleNumberedList}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={formatParagraph}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Format as Paragraph"
            >
              <Type size={16} />
            </button>
            
            <button
              type="button"
              onClick={clearFormatting}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Clear Formatting"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div 
        className={`border rounded-lg relative overflow-hidden ${
          error ? 'border-red-500' : isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
      >
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          className={`rich-text-editor min-h-[200px] p-4 outline-none leading-relaxed ${
            disabled ? 'cursor-not-allowed text-gray-500' : 'cursor-text'
          }`}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.6'
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
        
        {/* Placeholder */}
        {(!value || value.trim() === '') && !disabled && (
          <div 
            className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none"
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* Character count and help */}
      <div className="flex justify-between items-start text-xs text-gray-500">
        <div className="bg-gray-50 px-2 py-1 rounded">
          {getTextContent().length} characters
        </div>
        <div className="text-right space-y-1">
          <div className="font-medium">💡 Tips:</div>
          <div>• Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> for new paragraph with spacing</div>
          <div>• Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Shift+Enter</kbd> for line break</div>
          <div>• Use <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Tab</kbd> to indent in lists</div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-500 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Help text */}
      {!error && helpText && (
        <div className="text-xs text-gray-600 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>{helpText}</span>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
