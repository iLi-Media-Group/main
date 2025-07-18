import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';

interface CoverImage {
  name: string;
  url: string;
  path: string;
}

interface ReportBackgroundPickerProps {
  selected: string;
  onChange: (url: string) => void;
}

export function ReportBackgroundPicker({ selected, onChange }: ReportBackgroundPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
  const [loading, setLoading] = useState(false);

  // List all images in the 'report-covers' bucket
  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('report-covers').list('', { limit: 100 });
    if (error) {
      setLoading(false);
      return;
    }
    const images = (data || [])
      .filter((f: any) => f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg'))
      .map((f: any) => {
        const { publicUrl } = supabase.storage.from('report-covers').getPublicUrl(f.name).data;
        return { name: f.name, url: publicUrl, path: f.name };
      });
    setCoverImages(images);
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Only PNG and JPG files are allowed.');
      return;
    }
    setLoading(true);
    try {
      await uploadFile(file, 'report-covers');
      await fetchImages();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Only PNG and JPG files are allowed.');
      return;
    }
    setLoading(true);
    try {
      await uploadFile(file, 'report-covers');
      await fetchImages();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (img: CoverImage) => {
    if (!window.confirm('Are you sure you want to delete this cover page?')) return;
    setLoading(true);
    const { error } = await supabase.storage.from('report-covers').remove([img.path]);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      await fetchImages();
    }
    setLoading(false);
  };

  return (
    <div className="mb-6">
      <div
        className="mb-4 p-2 border-2 border-dashed border-blue-400 rounded-lg text-center cursor-pointer bg-white/5 hover:bg-blue-500/10 transition-colors w-full"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{ minHeight: 40 }}
      >
        <input
          type="file"
          accept="image/png,image/jpeg"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <p className="text-blue-300 text-sm">Drag & drop a PNG or JPG here, or click to upload</p>
      </div>
      <div className="flex gap-4 overflow-x-auto py-2 w-full" style={{ maxWidth: 1200 }}>
        {coverImages.map(img => (
          <div key={img.url} className="relative group flex-shrink-0">
            <button
              className={`rounded-lg border-2 ${selected === img.url ? 'border-blue-500' : 'border-transparent'} transition-all focus:outline-none`}
              onClick={() => onChange(img.url)}
              type="button"
            >
              <img src={img.url} alt={img.name} className="w-32 h-28 object-cover rounded-lg" />
              <div className="text-xs text-center text-white mt-1 w-32 truncate">{img.name}</div>
            </button>
            <button
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity md:opacity-100"
              title="Delete cover page"
              onClick={e => {
                e.stopPropagation();
                handleDelete(img);
              }}
              type="button"
              style={{ zIndex: 10 }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M9 6v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6m-6 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
        ))}
        {loading && <div className="text-white text-sm flex items-center">Loading...</div>}
      </div>
    </div>
  );
} 