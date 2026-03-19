"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, X, Check } from "lucide-react";
import { CATEGORIES } from "@/lib/types";

interface DropdownOption {
  value: string;
  label: string;
  extra?: string;
}

function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((o) => o.value === value);

  const filtered = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setQuery("");
      setOpen(false);
    },
    [onChange]
  );

  // Position the portal dropdown below the trigger
  useLayoutEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open]);

  // Keyboard nav
  const [highlightIdx, setHighlightIdx] = useState(-1);
  useEffect(() => {
    setHighlightIdx(-1);
  }, [query, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filtered.length) {
        handleSelect(filtered[highlightIdx].value);
      }
    }
  }

  const dropdownContent = open ? (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
      }}
      className="bg-white rounded-xl border border-bark/8 shadow-lg shadow-bark/8 overflow-hidden animate-fade-in"
    >
      <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
        {/* "All" option */}
        <button
          className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors ${
            !value
              ? "bg-terracotta/5 text-terracotta font-medium"
              : "text-bark hover:bg-cream/80"
          }`}
          onMouseEnter={() => setHighlightIdx(-1)}
          onClick={() => handleSelect("")}
        >
          <span className="flex-1">{placeholder}</span>
          {!value && <Check className="h-3.5 w-3.5 text-terracotta" />}
        </button>

        {filtered.length === 0 && (
          <div className="px-3.5 py-3 text-sm text-warm-gray/60 text-center">
            Tidak ditemukan
          </div>
        )}

        {filtered.map((option, idx) => (
          <button
            key={option.value}
            className={`w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors ${
              value === option.value
                ? "bg-terracotta/5 text-terracotta font-medium"
                : idx === highlightIdx
                ? "bg-cream/80 text-bark"
                : "text-bark hover:bg-cream/80"
            }`}
            onMouseEnter={() => setHighlightIdx(idx)}
            onClick={() => handleSelect(option.value)}
          >
            {option.extra && (
              <span className="shrink-0 text-xs">{option.extra}</span>
            )}
            <span className="flex-1 truncate">{option.label}</span>
            {value === option.value && (
              <Check className="h-3.5 w-3.5 shrink-0 text-terracotta" />
            )}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        className={`flex items-center gap-1 bg-cream/60 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
          open ? "ring-2 ring-terracotta/20" : ""
        }`}
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            className="flex-1 bg-transparent text-sm text-bark font-medium outline-none placeholder:text-warm-gray/60 min-w-0"
            autoComplete="off"
          />
        ) : (
          <span
            className={`flex-1 text-sm font-medium truncate ${
              value ? "text-bark" : "text-warm-gray/70"
            }`}
          >
            {selectedOption
              ? `${selectedOption.extra ? selectedOption.extra + " " : ""}${selectedOption.label}`
              : placeholder}
          </span>
        )}

        {value && !open ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="shrink-0 p-0.5 rounded-full hover:bg-bark/10 transition-colors"
          >
            <X className="h-3 w-3 text-warm-gray" />
          </button>
        ) : (
          <ChevronDown
            className={`shrink-0 h-3.5 w-3.5 text-warm-gray transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {/* Portal dropdown so it's never clipped by overflow:hidden ancestors */}
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </div>
  );
}

interface HeroSearchBarProps {
  cities: string[];
}

export function HeroSearchBar({ cities }: HeroSearchBarProps) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const categoryOptions: DropdownOption[] = CATEGORIES.map((cat) => ({
    value: cat.value,
    label: cat.label,
    extra: cat.emoji,
  }));

  const cityOptions: DropdownOption[] = cities.map((c) => ({
    value: c,
    label: c,
  }));

  function handleSearch() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    router.push(`/providers${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-bark/8 shadow-lg shadow-bark/5 p-2 flex flex-col sm:flex-row gap-2">
        <SearchableDropdown
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder="Semua Kategori"
        />

        <SearchableDropdown
          options={cityOptions}
          value={city}
          onChange={setCity}
          placeholder="Semua Kota"
        />

        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-terracotta to-terracotta-light text-white font-semibold px-5 py-2.5 text-sm transition-all duration-300 hover:shadow-md hover:shadow-terracotta/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>Cari</span>
        </button>
      </div>
    </div>
  );
}
