import React, { useState } from 'react';
import { AlertCircle, Info, Bold, Italic, Underline, List, ListOrdered, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const RichTextEditor = ({ 
  value, 
  onChange, 
  error, 
  helpText,
  placeholder = 'Enter description...',
  disabled = false
}) => {
  // Use a simpler approach with a textarea and formatting buttons
  // that insert HTML tags at the cursor position
  const [text, setText] = useState(value || '');
  const textareaRef = React.useRef(null);
  
  // Update the parent component when text changes
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    onChange(newText);
  };
  
  // Check if selected text already has a specific formatting tag
  const hasFormatting = (selectedText, openTag, closeTag) => {
    // Simple check if the text starts with the opening tag and ends with the closing tag
    return selectedText.startsWith(openTag) && selectedText.endsWith(closeTag);
  };

  // Toggle formatting tags at cursor position
  const toggleFormat = (openTag, closeTag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);
    
    let newText;
    let newCursorPos;
    
    // Check if the selected text already has this formatting
    if (hasFormatting(selectedText, openTag, closeTag)) {
      // Remove the formatting
      const innerText = selectedText.substring(openTag.length, selectedText.length - closeTag.length);
      newText = beforeText + innerText + afterText;
      newCursorPos = [start, start + innerText.length];
    } else {
      // Add the formatting
      newText = beforeText + openTag + selectedText + closeTag + afterText;
      newCursorPos = [start + openTag.length, end + openTag.length];
    }
    
    setText(newText);
    onChange(newText);
    
    // Set focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos[0], newCursorPos[1]);
    }, 0);
  };
  
  // Format buttons handlers
  const toggleBold = () => toggleFormat('<strong>', '</strong>');
  const toggleItalic = () => toggleFormat('<em>', '</em>');
  const toggleUnderline = () => toggleFormat('<u>', '</u>');
  const toggleBulletList = () => toggleFormat('<ul>\n<li>', '</li>\n</ul>');
  const toggleNumberedList = () => toggleFormat('<ol>\n<li>', '</li>\n</ol>');
  const toggleListItem = () => toggleFormat('<li>', '</li>');
  const toggleParagraph = () => toggleFormat('<p>', '</p>');
  
  return (
    <div className="space-y-1">
      <div 
        className={`border rounded-lg ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${
          disabled ? 'bg-gray-100' : 'bg-white'
        }`}
      >
        {/* Formatting toolbar */}
        {!disabled && (
          <div className="flex flex-wrap gap-2 p-2 border-b">
            <button 
              type="button" 
              onClick={toggleBold}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="Bold (toggle)"
            >
              <Bold size={16} />
            </button>
            <button 
              type="button" 
              onClick={toggleItalic}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="Italic (toggle)"
            >
              <Italic size={16} />
            </button>
            <button 
              type="button" 
              onClick={toggleUnderline}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="Underline (toggle)"
            >
              <Underline size={16} />
            </button>
            <button 
              type="button" 
              onClick={toggleBulletList}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="Bullet List (toggle)"
            >
              <List size={16} />
            </button>
            <button 
              type="button" 
              onClick={toggleNumberedList}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="Numbered List (toggle)"
            >
              <ListOrdered size={16} />
            </button>
            <button 
              type="button" 
              onClick={toggleParagraph}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="Paragraph (toggle)"
            >
              <span className="text-xs font-medium">P</span>
            </button>
            <button 
              type="button" 
              onClick={toggleListItem}
              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
              title="List Item (toggle)"
            >
              <span className="text-xs font-medium">LI</span>
            </button>
          </div>
        )}
        
        {/* Text area for editing HTML */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[200px] border-none focus-visible:ring-0 resize-none"
          style={{ direction: 'ltr' }}
        />
      </div>
      
      {/* Preview section */}
      <div className="mt-2 border rounded p-3">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Preview:</h3>
        <div 
          className="prose prose-sm max-w-none" 
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
      
      {error && (
        <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
      
      {!error && helpText && (
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <Info className="h-3 w-3" />
          <span>{helpText}</span>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
