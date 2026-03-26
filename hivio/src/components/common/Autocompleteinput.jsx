import React, { useMemo, useRef, useState, useEffect } from 'react';

export default function AutocompleteInput({
  label,
  value,
  onChange,
  options,
  placeholder = '',
  maxSuggestions = 8,
  allowCustom = true,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

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

    const starts = [];
    const contains = [];

    for (const opt of options) {
      const t = opt.toLowerCase();
      if (t.startsWith(q)) starts.push(opt);
      else if (t.includes(q)) contains.push(opt);
      if (starts.length + contains.length >= maxSuggestions) break;
    }

    return [...starts, ...contains].slice(0, maxSuggestions);
  }, [query, options, maxSuggestions]);

  function selectOption(opt) {
    onChange(opt);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
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
        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
      />

      {open && (suggestions.length > 0 || allowCustom) && (
        <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => selectOption(opt)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
            >
              {opt}
            </button>
          ))}

          {allowCustom && (
            <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-300">
              Tip: pick a suggestion to standardize, or keep typing to use a custom value.
            </div>
          )}
        </div>
      )}
    </div>
  );
}