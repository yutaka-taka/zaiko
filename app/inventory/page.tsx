'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type SortKey = 'name' | 'expires_at';

interface Item {
  id: number;
  name: string;
  expires_at: string;
}

const formatDate = (s: string) => {
  if (!s) return '';
  const [y, m] = s.split('-');
  return `${y}/${m}`;
};

const dateColor = (s: string) => {
  if (!s) return '#555';
  const today = new Date();
  const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const in3months = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const thresholdYM = `${in3months.getFullYear()}-${String(in3months.getMonth() + 1).padStart(2, '0')}`;
  if (s <= currentYM) return '#c0392b';
  if (s < thresholdYM) return '#e06b2a';
  return '#555';
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('name');
  const [selected, setSelected] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [noSelAlert, setNoSelAlert] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/items');
    const data: Item[] = await res.json();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...items].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'ja');
    return a.expires_at.localeCompare(b.expires_at);
  });

  const filtered = appliedQuery
    ? sorted.filter(i => i.name.includes(appliedQuery))
    : sorted;

  const handleSearch = () => {
    setAppliedQuery(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedQuery('');
  };

  const handleDelete = () => {
    if (selected === null) { setNoSelAlert(true); return; }
    const item = items.find(i => i.id === selected) ?? null;
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/items/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    setSelected(null);
    await load();
  };

  return (
    <div className="flex flex-col h-dvh bg-[#f7f9f8]">
      {/* ヘッダー */}
      <header
        className="px-4 py-5 flex items-center relative flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #1a7a5e 0%, #2da87d 100%)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="text-white/85 text-sm flex items-center gap-1 absolute left-4"
        >
          <span className="text-xl leading-none">‹</span>戻る
        </button>
        <h1 className="text-white text-lg font-bold tracking-wide w-full text-center">備蓄品在庫一覧</h1>
      </header>

      {/* 並べ替えバー（固定） */}
      <div className="flex gap-2 px-4 pt-3 pb-2 bg-[#f7f9f8] flex-shrink-0">
        {(['name', 'expires_at'] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className="flex-1 py-2 rounded-xl text-[13px] font-semibold border-[1.5px] transition-colors"
            style={
              sort === key
                ? { background: '#1a7a5e', borderColor: '#1a7a5e', color: '#fff', boxShadow: '0 3px 10px rgba(26,122,94,0.25)' }
                : { background: '#fff', borderColor: '#e0ebe6', color: '#777' }
            }
          >
            {key === 'name' ? '商品名順' : '有効期限順'}
          </button>
        ))}
      </div>

      {/* 検索バー */}
      <div className="flex gap-2 px-4 pb-2 bg-[#f7f9f8] flex-shrink-0 items-center">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="商品名で検索"
          className="flex-1 px-3 py-2 border-[1.5px] border-[#e0ebe6] rounded-xl text-[13px] outline-none focus:border-[#2da87d] bg-white"
          style={{ color: '#1a2e26' }}
        />
        <button
          onClick={handleSearch}
          className="w-9 h-9 flex items-center justify-center rounded-xl border-[1.5px] border-[#e0ebe6] bg-white flex-shrink-0 text-[#1a7a5e] text-lg"
        >
          🔍
        </button>
        <button
          onClick={handleClear}
          className="px-3 h-9 flex items-center justify-center rounded-xl border-[1.5px] border-[#e0ebe6] bg-white flex-shrink-0 text-[13px] font-semibold text-gray-500"
        >
          解除
        </button>
      </div>

      {/* テーブルヘッダー（固定） */}
      <div
        className="grid px-4 py-2.5 flex-shrink-0"
        style={{
          gridTemplateColumns: '28px 1fr 88px',
          gap: '8px',
          background: '#edf4f0',
          borderBottom: '1px solid #dce8e0',
        }}
      >
        <span />
        <span className="text-[12px] font-bold text-gray-500 text-center">商品名</span>
        <span className="text-[12px] font-bold text-gray-500 text-center">有効期限</span>
      </div>

      {/* スクロールリスト */}
      <div className="flex-1 overflow-y-auto py-1.5" style={{ scrollbarWidth: 'none' }}>
        {filtered.map(item => (
          <div
            key={item.id}
            onClick={() => setSelected(selected === item.id ? null : item.id)}
            className="mx-3 my-1 rounded-xl px-3 py-3 cursor-pointer"
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 88px',
              gap: '8px',
              alignItems: 'start',
              background: selected === item.id ? '#edf7f2' : '#fff',
              border: selected === item.id ? '1.5px solid #2da87d' : '1.5px solid transparent',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            {/* チェックボックス */}
            <div
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
              style={
                selected === item.id
                  ? { background: '#1a7a5e', borderColor: '#1a7a5e', color: '#fff' }
                  : { borderColor: '#ccc' }
              }
            >
              {selected === item.id && '✓'}
            </div>
            {/* 商品名 */}
            <div
              className="text-[14px] font-semibold leading-snug"
              style={{ color: '#1a2e26', wordBreak: 'break-all' }}
            >
              {item.name}
            </div>
            {/* 有効期限 */}
            <div
              className="text-[13px] text-right font-medium"
              style={{ color: dateColor(item.expires_at) }}
            >
              {formatDate(item.expires_at)}
            </div>
          </div>
        ))}
        {loading ? (
          <p className="text-center text-gray-400 text-sm mt-12">読み込み中…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-12">
            {appliedQuery ? '該当する商品がありません' : '登録された商品がありません'}
          </p>
        ) : null}
      </div>

      {/* フッター（固定） */}
      <div
        className="flex-shrink-0 px-4 py-3.5 bg-white"
        style={{ borderTop: '1px solid #eee' }}
      >
        <button
          onClick={handleDelete}
          className="w-full py-3.5 rounded-xl font-bold text-[15px]"
          style={{
            background: '#fff',
            border: '1.5px solid #e8a0a0',
            color: '#c0392b',
          }}
        >
          削除
        </button>
      </div>

      {/* 未選択アラート */}
      {noSelAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl text-center">
            <p className="text-[15px] font-bold text-[#1a2e26] mb-6">選択されていません</p>
            <button
              onClick={() => setNoSelAlert(false)}
              className="w-full py-3 rounded-xl text-white font-bold"
              style={{ background: 'linear-gradient(135deg, #1a7a5e, #2da87d)' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
            <p className="text-[15px] font-bold text-[#1a2e26] text-center mb-1">以下の商品を削除しますか？</p>
            <div className="bg-[#f7f9f8] rounded-xl p-4 my-4 space-y-2">
              <div className="text-sm">
                <span className="text-gray-500 mr-2">商品名</span>
                <span className="font-semibold text-[#1a2e26] break-all">{deleteTarget.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">有効期限</span>
                <span className="font-semibold text-[#1a2e26]">{formatDate(deleteTarget.expires_at)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                autoFocus
                onClick={() => { setDeleteTarget(null); setSelected(null); }}
                className="flex-1 py-3 border-[1.5px] border-[#e0ebe6] rounded-xl text-gray-500 font-semibold"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl text-white font-bold"
                style={{ background: '#c0392b' }}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
