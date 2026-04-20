import React, { useMemo, useRef, useState, useEffect } from 'react';

export default function AutocompleteInput({
  label,
  value,
  onChange,
  options,
  placeholder = '',
  maxSuggestions = 20,
  allowCustom = true,
  required = false,
  abbreviations = {},
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return options.slice(0, maxSuggestions);
    const abbrevMatch = abbreviations[q];
    const starts = [];
    const contains = [];
    for (const opt of options) {
      const t = opt.toLowerCase();
      if (abbrevMatch && opt === abbrevMatch) starts.unshift(opt);
      else if (t.startsWith(q)) starts.push(opt);
      else if (t.includes(q)) contains.push(opt);
      if (starts.length + contains.length >= maxSuggestions) break;
    }
    return [...starts, ...contains].slice(0, maxSuggestions);
  }, [query, options, maxSuggestions, abbreviations]);

  function selectOption(opt) {
    onChange(opt);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">
        {label}{required ? ' *' : ''}
      </label>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full text-sm text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-hivio-border dark:border-hivio-border-dark rounded-md px-3 py-2.5 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out"
      />

      {open && (suggestions.length > 0 || allowCustom) && (
        <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-hivio-surface dark:bg-hivio-surface-dark border border-hivio-border dark:border-hivio-border-dark rounded-lg shadow-hivio-md overflow-y-auto max-h-48 scrollbar-hide">
          {suggestions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => selectOption(opt)}
              className="block w-full text-left px-4 py-2.5 text-sm text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
            >
              {opt}
            </button>
          ))}

          {allowCustom && (
            <div className="border-t border-hivio-border dark:border-hivio-border-dark px-4 py-2.5 text-xs text-hivio-text-muted dark:text-hivio-text-muted-dark">
              If School or Major is not listed, enter a custom value.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
