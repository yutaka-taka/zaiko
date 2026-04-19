'use client';

import { useState } from 'react';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  onClose: () => void;
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function DatePicker({ value, onChange, onClose }: Props) {
  const today = new Date();
  const init = value ? new Date(value) : today;

  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth()); // 0-11
  const [selected, setSelected] = useState<string>(value);

  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const toStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const isToday = (d: number) => {
    const t = today;
    return d === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  const handleSelect = (d: number | null) => {
    if (!d) return;
    const s = toStr(d);
    setSelected(s);
    onChange(s);
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
        {/* ハンドル */}
        <div className="w-10 h-1 bg-gray-200 rounded mx-auto mb-4" />

        <p className="text-base font-bold text-[#1a2e26] text-center mb-4">有効期限を選択</p>

        {/* 年選択チップ */}
        <div className="flex gap-2 flex-wrap justify-center mb-4">
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

        {/* 月ナビ */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-[#e0ebe6] flex items-center justify-center text-gray-500"
          >
            ‹
          </button>
          <span className="text-[15px] font-bold text-[#1a2e26]">
            {year}年 {month + 1}月
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-[#e0ebe6] flex items-center justify-center text-gray-500"
          >
            ›
          </button>
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-0.5">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
          ))}
          {cells.map((d, i) => (
            <div
              key={i}
              onClick={() => handleSelect(d)}
              className="text-center text-[13px] py-2 rounded-lg cursor-pointer"
              style={
                d && toStr(d) === selected
                  ? { background: '#1a7a5e', color: '#fff', fontWeight: 700 }
                  : d && isToday(d)
                  ? { color: '#1a7a5e', fontWeight: 700 }
                  : d
                  ? { color: '#333' }
                  : { color: 'transparent' }
              }
            >
              {d ?? ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
