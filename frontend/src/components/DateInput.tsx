"use client";

import React, { useState, useEffect } from 'react';

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * A custom date input component that allows easy manual entry in DD/MM/YYYY format.
 * Internally handles the conversion to YYYY-MM-DD for API compatibility.
 */
export default function DateInput({ 
  value, 
  onChange, 
  label, 
  required, 
  className = "", 
  disabled = false,
  id
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Update display value when prop value changes (e.g., from API or parent reset)
  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        // Ensure we don't overwrite if the user is currently typing
        const expectedDisplay = `${d}/${m}/${y}`;
        if (displayValue.replace(/\//g, '') !== `${d}${m}${y}`) {
           setDisplayValue(expectedDisplay);
        }
      }
    } else if (!value) {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Remove all non-digits
    let digits = rawValue.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.substring(0, 8);

    // Format as DD/MM/YYYY
    let formatted = "";
    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
      if (digits.length > 2) {
        formatted += "/" + digits.substring(2, 4);
        if (digits.length > 4) {
          formatted += "/" + digits.substring(4, 8);
        }
      }
    }

    setDisplayValue(formatted);

    // If we have a full date (8 digits), propagate back to parent as YYYY-MM-DD
    if (digits.length === 8) {
      const day = digits.substring(0, 2);
      const month = digits.substring(2, 4);
      const year = digits.substring(4, 8);
      
      // Basic validation: month 1-12, day 1-31
      const mNum = parseInt(month);
      const dNum = parseInt(day);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        onChange(`${year}-${month}-${day}`);
      }
    } else if (digits.length === 0) {
      onChange("");
    }
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative group">
        <input
          id={id}
          type="text"
          placeholder="DD/MM/YYYY"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          autoComplete="off"
          className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium transition-all duration-200 
                   focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 
                   disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                   placeholder:text-slate-400 group-hover:border-slate-300"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-slate-400 font-medium uppercase tracking-wider px-1">Format: Day/Month/Year</p>
    </div>
  );
}
