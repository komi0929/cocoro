/**
 * cocoro - PhotoUploader
 * Upload photo for poster furniture
 */

import { useCallback } from 'react';

interface PhotoUploaderProps {
  onUpload: (dataUrl: string) => void;
  onClose: () => void;
}

export function PhotoUploader({ onUpload, onClose }: PhotoUploaderProps) {
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpload(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  return (
    <div className="photo-uploader-overlay" onClick={onClose}>
      <div className="photo-uploader-card" onClick={e => e.stopPropagation()}>
        <h3>{'\u{1F5BC}\uFE0F \u30DD\u30B9\u30BF\u30FC\u753B\u50CF'}</h3>
        <p>{'\u597D\u304D\u306A\u753B\u50CF\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9'}</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="photo-uploader-input"
        />
        <button className="btn btn-ghost" onClick={onClose}>
          {'\u30AD\u30E3\u30F3\u30BB\u30EB'}
        </button>
      </div>
    </div>
  );
}
