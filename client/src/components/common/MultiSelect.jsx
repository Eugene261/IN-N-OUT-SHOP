import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/badge';

function MultiSelect({ name, options = [], value = [], onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get label for an option ID
  const getLabelById = (id) => {
    const option = options.find(opt => opt.id === id);
    return option ? option.label : id;
  };

  // Toggle selection of an option
  const toggleOption = (optionId) => {
    const updatedItems = safeValue.includes(optionId)
      ? safeValue.filter(id => id !== optionId)
      : [...safeValue, optionId];
    
    onChange({
      target: { 
        name,
        value: updatedItems 
      }
    });
  };

  // Remove a selected item
  const removeItem = (optionId, e) => {
    e.stopPropagation();
    const updatedItems = safeValue.filter(id => id !== optionId);
    onChange({
      target: { 
        name,
        value: updatedItems 
      }
    });
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger button */}
      <div
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent/10'
        }`}
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
          {safeValue.length > 0 ? (
            safeValue.map((item) => (
              <Badge 
                key={item} 
                variant="secondary" 
                className="mr-1 mb-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) removeItem(item, e);
                }}
              >
                {getLabelById(item)}
                {!disabled && <span className="ml-1">×</span>}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div 
          ref={dropdownRef}
          className="absolute z-[9999] mt-1 w-full bg-popover rounded-md border shadow-lg"
          style={{
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden'
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              type="text"
              className="w-full p-2 text-sm border rounded bg-popover"
              placeholder={`Search ${name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </div>
          
          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-center text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center px-3 py-2 cursor-pointer ${
                    safeValue.includes(option.id) 
                      ? 'bg-accent/20' 
                      : 'hover:bg-accent/10'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleOption(option.id);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className={`flex items-center justify-center w-4 h-4 mr-2 border rounded ${
                    safeValue.includes(option.id) 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-input'
                  }`}>
                    {safeValue.includes(option.id) && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelect;