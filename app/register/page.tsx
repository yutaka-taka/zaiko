'use client';

import { useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';

const BarcodeScanner = lazy(() => import('@/components/BarcodeScanner'));
const DatePicker = lazy(() => import('@/components/DatePicker'));

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPast, setConfirmPast] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const displayDate = (s: string) => {
    if (!s) return '';
    const [y, m] = s.split('-');
    return `${y}/${m}`;
  };

  const handleScanResult = async (code: string) => {
    setScanning(false);
    try {
      const res = await fetch(`/api/barcode/${code}`);
      const data = await res.json();
      setName(data.name.slice(0, 30));
    } catch {
      setName('不明');
    }
  };

  const isBeforeCurrentMonth = (s: string) => {
    if (!s) return false;
    const today = new Date();
    const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return s < currentYM;
  };

  const doRegister = async () => {
    setLoading(true);
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, expires_at: expiresAt }),
      });
      setName('');
      setExpiresAt('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (!name.trim() || !expiresAt) return;
    if (isBeforeCurrentMonth(expiresAt)) {
      setConfirmPast(true);
    } else {
      doRegister();
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-[#f7f9f8]">
      {/* ヘッダー */}
      <header
        className="px-4 py-5 flex items-center relative"
        style={{ background: 'linear-gradient(135deg, #1a7a5e 0%, #2da87d 100%)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="text-white/85 text-sm flex items-center gap-1 absolute left-4"
        >
          <span className="text-xl leading-none">‹</span>戻る
        </button>
        <h1 className="text-white text-lg font-bold tracking-wide w-full text-center">備蓄品登録</h1>
      </header>

      <main className="flex-1 flex flex-col gap-4 px-5 py-5">
        {/* スキャンカード */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <button
            onClick={() => setScanning(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-[14px] text-white font-bold text-[15px]"
            style={{
              background: 'linear-gradient(135deg, #1a7a5e, #2da87d)',
              boxShadow: '0 6px 20px rgba(26,122,94,0.3)',
            }}
          >
            <span className="text-xl">📷</span>
            <span>
              商品スキャン<br />
              <span className="text-xs font-normal text-white/80">（バーコード読み取り）</span>
            </span>
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-2">
            バーコードを読み取ると商品名が自動入力されます<br />
            （30秒タイムアウト）
          </p>
        </div>

        {/* 入力カード */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          {/* 商品名 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500">商品名</span>
              <span className="bg-[#e8f5f0] text-[#1a7a5e] text-[10px] px-1.5 py-0.5 rounded">必須</span>
              <span className="ml-auto text-[11px] text-gray-300">{name.length} / 30</span>
            </div>
            <textarea
              value={name}
              onChange={e => setName(e.target.value.slice(0, 30))}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="商品名を入力（最大30文字）"
              rows={nameFocused ? 3 : 1}
              className="w-full px-3.5 py-3 border-[1.5px] border-[#e8eee9] rounded-xl text-[15px] outline-none focus:border-[#2da87d] resize-none overflow-hidden"
              style={{
                color: '#1a2e26',
                transition: 'height 0.2s ease',
                lineHeight: '1.5',
              }}
            />
          </div>

          {/* 有効期限 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500">有効期限</span>
              <span className="bg-[#e8f5f0] text-[#1a7a5e] text-[10px] px-1.5 py-0.5 rounded">必須</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={displayDate(expiresAt)}
                readOnly
                placeholder="YYYY/MM"
                onClick={() => setShowCal(true)}
                className="flex-1 px-3.5 py-3 border-[1.5px] border-[#e8eee9] rounded-xl text-[15px] outline-none cursor-pointer focus:border-[#2da87d]"
                style={{ color: expiresAt ? '#1a2e26' : '#bbb' }}
              />
              <button
                onClick={() => setShowCal(true)}
                className="w-11 h-11 border-[1.5px] border-[#e8eee9] rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              >
                📅
              </button>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-[15px] border-[1.5px] border-[#e0ebe6] rounded-xl bg-white text-gray-500 font-semibold text-[15px]"
          >
            戻る
          </button>
          <button
            onClick={handleRegister}
            disabled={!name.trim() || !expiresAt || loading}
            className="flex-[2] py-[15px] rounded-xl text-white font-bold text-[15px] disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #1a7a5e, #2da87d)',
              boxShadow: '0 4px 14px rgba(26,122,94,0.3)',
            }}
          >
            {loading ? '登録中…' : '登録する'}
          </button>
        </div>
      </main>

      {/* バーコードスキャナー */}
      <Suspense fallback={null}>
        {scanning && (
          <BarcodeScanner
            onResult={handleScanResult}
            onClose={() => setScanning(false)}
          />
        )}
      </Suspense>

      {/* カレンダー */}
      <Suspense fallback={null}>
        {showCal && (
          <DatePicker
            value={expiresAt}
            onChange={setExpiresAt}
            onClose={() => setShowCal(false)}
          />
        )}
      </Suspense>

      {/* 過去日付確認ダイアログ */}
      {confirmPast && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-8"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
            <p className="text-[15px] font-bold text-[#1a2e26] text-center mb-6">
              有効期限が先月以前ですがよいですか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPast(false)}
                className="flex-1 py-3 border-[1.5px] border-[#e0ebe6] rounded-xl text-gray-500 font-semibold"
              >
                いいえ
              </button>
              <button
                onClick={() => { setConfirmPast(false); doRegister(); }}
                className="flex-1 py-3 rounded-xl text-white font-bold"
                style={{ background: 'linear-gradient(135deg, #1a7a5e, #2da87d)' }}
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
