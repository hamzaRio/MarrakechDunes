import React from 'react';

interface SearchHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  searchTerm,
  className = '',
  highlightClassName = 'bg-yellow-200 font-semibold',
  caseSensitive = false
}) => {
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = regex.test(part);
        return isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

// Advanced search highlighting with multiple terms
interface MultiSearchHighlightProps {
  text: string;
  searchTerms: string[];
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
}

export const MultiSearchHighlight: React.FC<MultiSearchHighlightProps> = ({
  text,
  searchTerms,
  className = '',
  highlightClassName = 'bg-yellow-200 font-semibold',
  caseSensitive = false
}) => {
  if (!searchTerms.length || !searchTerms.some(term => term.trim())) {
    return <span className={className}>{text}</span>;
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const escapedTerms = searchTerms
    .filter(term => term.trim())
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  const regex = new RegExp(`(${escapedTerms.join('|')})`, flags);
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = regex.test(part);
        return isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

// Search result component with highlighting
interface SearchResultProps {
  title: string;
  description?: string;
  searchTerm: string;
  onClick?: () => void;
  className?: string;
}

export const SearchResult: React.FC<SearchResultProps> = ({
  title,
  description,
  searchTerm,
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${className}`}
    >
      <h3 className="font-medium text-gray-800 mb-1">
        <SearchHighlight text={title} searchTerm={searchTerm} />
      </h3>
      {description && (
        <p className="text-sm text-gray-600">
          <SearchHighlight text={description} searchTerm={searchTerm} />
        </p>
      )}
    </div>
  );
};

// Search input with highlighting preview
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  previewText?: string;
  showPreview?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  previewText,
  showPreview = false
}) => {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
      {showPreview && previewText && value && (
        <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
          Preview: <SearchHighlight text={previewText} searchTerm={value} />
        </div>
      )}
    </div>
  );
};

// Hook for search highlighting
export const useSearchHighlight = (searchTerm: string) => {
  const highlightText = React.useCallback((
    text: string,
    options: {
      className?: string;
      highlightClassName?: string;
      caseSensitive?: boolean;
    } = {}
  ) => {
    return (
      <SearchHighlight
        text={text}
        searchTerm={searchTerm}
        {...options}
      />
    );
  }, [searchTerm]);

  const highlightMultiple = React.useCallback((
    text: string,
    terms: string[],
    options: {
      className?: string;
      highlightClassName?: string;
      caseSensitive?: boolean;
    } = {}
  ) => {
    return (
      <MultiSearchHighlight
        text={text}
        searchTerms={[...terms, searchTerm].filter(Boolean)}
        {...options}
      />
    );
  }, [searchTerm]);

  return {
    highlightText,
    highlightMultiple,
    searchTerm
  };
};
