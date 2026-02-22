import { useState, useEffect, useRef } from 'react';
import { PREDEFINED_VIBES } from '../types/book';

interface TagsInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  usedTags?: string[];
  placeholder?: string;
}

export function TagsInput({ 
  selectedTags, 
  onTagsChange, 
  usedTags = [],
  placeholder = 'Type to add vibes...' 
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine predefined and used tags, remove duplicates and already selected tags
  const allSuggestions = [
    ...PREDEFINED_VIBES,
    ...usedTags.filter(tag => !PREDEFINED_VIBES.includes(tag as any))
  ].filter(tag => !selectedTags.includes(tag));

  // Filter suggestions based on input
  const filteredSuggestions = inputValue.trim()
    ? allSuggestions.filter(tag =>
        tag.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 10)
    : allSuggestions.slice(0, 10);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onTagsChange([...selectedTags, trimmed]);
      setInputValue('');
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="tag-suggestion-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className="tags-input-container">
      <div className="tags-input-wrapper">
        <div className="tags-badges-container">
          {selectedTags.map((tag, index) => (
            <span key={index} className="tag-badge-input">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="tag-remove-btn"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="tags-input-field"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="tags-suggestions-dropdown">
          {filteredSuggestions.map((tag, index) => (
            <button
              key={tag}
              type="button"
              className={`tag-suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => addTag(tag)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {highlightMatch(tag, inputValue)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
