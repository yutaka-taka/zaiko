'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onResult: (date: string) => void;
  onClose: () => void;
}

export default function ExpiryScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onCloseRef = useRef(onClose);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError('カメラを起動できません');
      }
    };

    start();
    timer = setTimeout(() => {
      stop();
      onCloseRef.current();
    }, 30000);

    return () => {
      clearTimeout(timer);
      stop();
    };
  }, []);

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = async () => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);
    setError('');

    const video = videoRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // ガイド枠（幅80%・高さ28%・中央）に対応するピクセル領域を切り抜く
    const cropX = Math.floor(vw * 0.1);
    const cropY = Math.floor(vh * 0.36);
    const cropW = Math.floor(vw * 0.8);
    const cropH = Math.floor(vh * 0.28);

    // OCR精度向上のため最低1200px幅に拡大
    const scale = Math.max(1, 1200 / cropW);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(cropW * scale);
    canvas.height = Math.floor(cropH * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) { setCapturing(false); return; }
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];

    try {
      const res = await fetch('/api/read-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) {
        setError('有効期限が読み取れませんでした　枠を合わせて再度撮影してください');
        setCapturing(false);
        return;
      }

      const data = await res.json();
      stop();
      onResult(data.date);
    } catch {
      setError('エラーが発生しました');
      setCapturing(false);
    }
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button onClick={handleClose} className="text-white text-sm px-2 py-1">✕ 閉じる</button>
        <span className="text-white text-sm font-bold">有効期限を読み取り</span>
        <div className="w-16" />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="border-2 border-white rounded-lg"
            style={{ width: '80%', height: '28%' }}
          />
        </div>
        <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs">
          有効期限の数字を枠いっぱいに合わせて撮影
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center py-2 px-4 flex-shrink-0">{error}</p>
      )}

      <div className="flex-shrink-0 flex justify-center py-6">
        <button
          onClick={capture}
          disabled={capturing}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.25)' }}
        >
          {capturing ? (
            <span className="text-white text-[10px] font-bold">読取中</span>
          ) : (
            <span className="w-11 h-11 rounded-full bg-white block" />
          )}
        </button>
      </div>
    </div>
  );
}
