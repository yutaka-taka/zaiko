'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onResult: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);

  const cleanup = async () => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        async (code) => {
          await cleanup();
          onResult(code);
        },
        undefined,
      )
      .catch(() => {
        onClose();
      });

    timerRef.current = setTimeout(async () => {
      await cleanup();
      onClose();
    }, 30000);

    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-white font-bold text-sm">バーコードをスキャン</span>
        <button
          onClick={async () => { await cleanup(); onClose(); }}
          className="text-white/70 text-sm px-3 py-1 rounded-lg border border-white/20"
        >
          キャンセル
        </button>
      </div>
      <div id="qr-reader" className="w-full flex-1" />
      <p className="text-white/50 text-xs text-center pb-4">
        30秒以内に読み取れない場合は自動的に戻ります
      </p>
    </div>
  );
}
