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
    <div style={{ position: 'relative' }} ref={containerRef}>
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
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border)',
          color: 'var(--text-1)',
          borderRadius: 14,
          padding: '13px 16px',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          fontFamily: "'DM Sans', sans-serif",
          boxSizing: 'border-box',
        }}
        onFocus={e => {
          setOpen(true);
          e.target.style.borderColor = 'var(--brand)';
          e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      />

      {open && (suggestions.length > 0 || allowCustom) && (
        <div style={{
          position: 'absolute',
          zIndex: 20,
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          overflow: 'hidden',
        }}>
          {suggestions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => selectOption(opt)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '11px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-1)',
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {opt}
            </button>
          ))}

          {allowCustom && (
            <div style={{
              borderTop: '1px solid var(--border)',
              padding: '9px 16px',
              fontSize: 11,
              color: 'var(--text-3)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              If School or Major is not listed, enter a custom value.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
