'use client';

import { useState } from 'react';

interface Props {
  value: string; // YYYY-MM
  onChange: (v: string) => void;
  onClose: () => void;
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function DatePicker({ value, onChange, onClose }: Props) {
  const today = new Date();
  const initYear = value ? parseInt(value.slice(0, 4)) : today.getFullYear();
  const initMonth = value ? parseInt(value.slice(5, 7)) - 1 : today.getMonth();

  const [year, setYear] = useState(initYear);
  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const toStr = (m: number) =>
    `${year}-${String(m + 1).padStart(2, '0')}`;

  const handleSelect = (m: number) => {
    onChange(toStr(m));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-3xl p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded mx-auto mb-4" />
        <p className="text-base font-bold text-[#1a2e26] text-center mb-4">有効期限を選択</p>

        {/* 年選択チップ */}
        <div className="flex gap-2 flex-wrap justify-center mb-5">
          {yearOptions.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className="px-3 py-1 rounded-full text-sm font-semibold border transition-colors"
              style={
                y === year
                  ? { background: '#1a7a5e', borderColor: '#1a7a5e', color: '#fff' }
                  : { background: '#fff', borderColor: '#e0ebe6', color: '#777' }
              }
            >
              {y}
            </button>
          ))}
        </div>

        {/* 月選択グリッド */}
        <div className="grid grid-cols-4 gap-2">
          {MONTHS.map((label, m) => {
            const s = toStr(m);
            const isSelected = s === value;
            const isCurrentMonth = year === today.getFullYear() && m === today.getMonth();
            return (
              <button
                key={m}
                onClick={() => handleSelect(m)}
                className="py-3 rounded-xl text-[14px] font-semibold border transition-colors"
                style={
                  isSelected
                    ? { background: '#1a7a5e', borderColor: '#1a7a5e', color: '#fff' }
                    : isCurrentMonth
                    ? { background: '#fff', borderColor: '#2da87d', color: '#1a7a5e' }
                    : { background: '#fff', borderColor: '#e0ebe6', color: '#333' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="h-5" />
      </div>
    </div>
  );
}
