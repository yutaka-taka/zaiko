'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh">
      <header
        className="px-6 py-5 text-center"
        style={{ background: 'linear-gradient(135deg, #1a7a5e 0%, #2da87d 100%)' }}
      >
        <h1 className="text-white text-lg font-bold tracking-wide">備蓄品の在庫管理</h1>
        <p className="text-white/70 text-xs mt-1">Emergency Stock Manager</p>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mt-2 mb-4"
          style={{
            background: 'linear-gradient(135deg, #1a7a5e, #2da87d)',
            boxShadow: '0 8px 24px rgba(26,122,94,0.3)',
          }}
        >
          ⛑️
        </div>
        <p className="text-xl font-extrabold text-[#1a2e26] mb-2">備蓄品管理</p>
        <p className="text-xs text-gray-400 mb-10">備蓄品の登録・在庫確認ができます</p>

        <Link href="/register" className="w-full mb-4">
          <div
            className="w-full flex items-center gap-4 px-5 py-[18px] rounded-2xl text-white cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #1a7a5e, #2da87d)',
              boxShadow: '0 8px 24px rgba(26,122,94,0.35)',
            }}
          >
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              📦
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-bold">備蓄品登録</span>
              <span className="block text-xs text-white/70 mt-0.5">商品を新しく登録する</span>
            </span>
            <span className="text-white/50 text-xl">›</span>
          </div>
        </Link>

        <Link href="/inventory" className="w-full">
          <div
            className="w-full flex items-center gap-4 px-5 py-[18px] rounded-2xl bg-white text-[#1a2e26] cursor-pointer active:scale-[0.98] transition-transform"
            style={{ border: '1.5px solid #e0ebe6', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
          >
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: '#edf7f2' }}
            >
              📋
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-bold">備蓄品在庫一覧</span>
              <span className="block text-xs text-gray-400 mt-0.5">登録済みの在庫を確認する</span>
            </span>
            <span className="text-gray-300 text-xl">›</span>
          </div>
        </Link>
      </main>
    </div>
  );
}
