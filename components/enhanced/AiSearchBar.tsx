import React, { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon,
  CommandLineIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../utils/cn';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'command' | 'location' | 'vehicle' | 'recent';
  icon?: React.ReactNode;
  description?: string;
}

interface AiSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  isLoading?: boolean;
  className?: string;
}

export const AiSearchBar: React.FC<AiSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  onFocus,
  onBlur,
  placeholder = "Ask AI about traffic, search locations, or give commands...",
  suggestions = [],
  recentSearches = [],
  isLoading = false,
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    onFocus?.();
  };

  const handleBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => {
      setIsFocused(false);
      onBlur?.();
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSearch = () => {
    if (value.trim()) {
      onSearch(value.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const defaultSuggestions: SearchSuggestion[] = [
    {
      id: 'find-congestion',
      text: 'Find most congested junction',
      type: 'command',
      icon: <CommandLineIcon className="w-4 h-4" />,
      description: 'AI will identify the busiest intersection'
    },
    {
      id: 'show-incidents',
      text: 'Show all high priority incidents',
      type: 'command',
      icon: <CommandLineIcon className="w-4 h-4" />,
      description: 'Display critical traffic incidents'
    },
    {
      id: 'police-units',
      text: 'Find all police units',
      type: 'command',
      icon: <CommandLineIcon className="w-4 h-4" />,
      description: 'Locate emergency response vehicles'
    }
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className={cn(
        "relative transition-all duration-300",
        isFocused ? "scale-105" : "scale-100"
      )}>
        <Card
          variant="cyber"
          padding="none"
          className={cn(
            "transition-all duration-300 border",
            isFocused 
              ? "border-cyan-400/60 shadow-neon" 
              : "border-cyan-400/20 hover:border-cyan-400/40"
          )}
        >
          <div className="flex items-center px-4 py-3">
            {/* AI Icon */}
            <div className={cn(
              "flex-shrink-0 mr-3 transition-all duration-300",
              isFocused ? "text-cyan-400" : "text-muted"
            )}>
              <SparklesIcon className={cn(
                "w-5 h-5",
                isLoading && "animate-spin"
              )} />
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none font-mono text-sm"
            />

            {/* Clear Button */}
            {value && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="flex-shrink-0 ml-2 w-6 h-6 hover:bg-danger/20 hover:text-danger"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            )}

            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearch}
              disabled={!value.trim() || isLoading}
              className={cn(
                "flex-shrink-0 ml-2 w-8 h-8 transition-all duration-300",
                value.trim() 
                  ? "text-cyan-400 hover:bg-cyan-400/20" 
                  : "text-muted"
              )}
            >
              <MagnifyingGlassIcon className={cn(
                "w-4 h-4",
                isLoading && "animate-pulse"
              )} />
            </Button>
          </div>

          {/* Loading Bar */}
          {isLoading && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-data-flow" />
          )}
        </Card>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (isFocused || value) && (
        <Card
          variant="cyber"
          padding="sm"
          className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto border border-cyan-400/30 shadow-2xl animate-fade-in"
        >
          {/* AI Commands */}
          {displaySuggestions.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2 px-2">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-tech font-medium text-cyan-400 uppercase tracking-wider">
                  AI Commands
                </span>
              </div>
              <div className="space-y-1">
                {displaySuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-400/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-cyan-400 group-hover:text-cyan-300">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground group-hover:text-cyan-400">
                          {suggestion.text}
                        </div>
                        {suggestion.description && (
                          <div className="text-xs text-muted mt-0.5">
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2">
                <ClockIcon className="w-4 h-4 text-muted" />
                <span className="text-xs font-tech font-medium text-muted uppercase tracking-wider">
                  Recent
                </span>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick({ 
                      id: `recent-${index}`, 
                      text: search, 
                      type: 'recent' 
                    })}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surfaceHighlight transition-colors"
                  >
                    <div className="text-sm text-muted hover:text-foreground">
                      {search}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No suggestions */}
          {displaySuggestions.length === 0 && recentSearches.length === 0 && (
            <div className="text-center py-4 text-muted">
              <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start typing to see AI suggestions</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};