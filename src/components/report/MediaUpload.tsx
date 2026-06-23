import { useCallback, useRef, useState } from 'react';
import { Upload, X, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { createPreviewUrl, revokePreviewUrl } from '../../services/uploadService';
import { isFileSizeOk, isAllowedFileType } from '../../utils/validators';
import { MAX_UPLOAD_FILES } from '../../utils/constants';

export interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video';
}

interface MediaUploadProps {
  previews: FilePreview[];
  onChange: (previews: FilePreview[]) => void;
  onFirstImage?: (file: File) => void;
}

export default function MediaUpload({ previews, onChange, onFirstImage }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: File[]) => {
    const remaining = MAX_UPLOAD_FILES - previews.length;
    const valid = files
      .slice(0, remaining)
      .filter((f) => isAllowedFileType(f) && isFileSizeOk(f));

    const newPreviews: FilePreview[] = valid.map((f) => ({
      file: f,
      url:  createPreviewUrl(f),
      type: f.type.startsWith('video') ? 'video' : 'image',
    }));

    if (newPreviews.length) {
      if (previews.length === 0 && onFirstImage) onFirstImage(valid[0]);
      onChange([...previews, ...newPreviews]);
    }
  }, [previews, onChange, onFirstImage]);

  const remove = useCallback((index: number) => {
    revokePreviewUrl(previews[index].url);
    onChange(previews.filter((_, i) => i !== index));
  }, [previews, onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          dragOver
            ? 'border-[#1A6B3C] bg-[#E8F5EE]'
            : 'border-[#E5E5E0] hover:border-[#1A6B3C] hover:bg-[#F7F7F5]',
        )}
        role="button"
        aria-label="Upload photos or videos"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <Upload size={24} className="mx-auto text-[#6F6F6F] mb-2" />
        <p className="text-sm font-medium text-[#0D0D0B]">Drag photos/videos here, or tap to upload</p>
        <p className="text-xs text-[#6F6F6F] mt-1">JPG, PNG, MP4 · up to 50 MB · max {MAX_UPLOAD_FILES} files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          aria-hidden
        />
      </div>

      {/* Previews grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((p, i) => (
            <div key={p.url} className="relative group rounded-xl overflow-hidden aspect-square bg-[#F7F7F5]">
              {p.type === 'image' ? (
                <img src={p.url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0D0D0B]">
                  <Play size={28} className="text-white" />
                </div>
              )}
              <button
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                aria-label={`Remove file ${i + 1}`}
              >
                <X size={12} className="text-[#DC2626]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
