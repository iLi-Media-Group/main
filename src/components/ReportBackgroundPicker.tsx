import React, { useRef } from 'react';

// Dynamically import all PNGs from the report-backgrounds folder
const backgroundModules = import.meta.glob('../assets/report-backgrounds/*.png', { eager: true, as: 'url' });
const jpgModules = import.meta.glob('../assets/report-backgrounds/*.jpg', { eager: true, as: 'url' });
const backgrounds = [
  ...Object.entries(backgroundModules),
  ...Object.entries(jpgModules),
].map(([path, url]) => {
  const name = path.split('/').pop()?.replace('.png', '').replace('.jpg', '').replace(/option-/, 'Option ').replace(/mybeatfi/i, 'MyBeatFi Branded').replace(/neutral/i, 'Neutral') || 'Cover Page';
  return { name, path: url as string };
});

interface ReportBackgroundPickerProps {
  selected: string;
  onChange: (path: string) => void;
}

export function ReportBackgroundPicker({ selected, onChange }: ReportBackgroundPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Only PNG and JPG files are allowed.');
      return;
    }
    // Save to src/assets/report-backgrounds/ (requires backend or dev server support)
    // For now, show a message
    alert('Please manually add the file to src/assets/report-backgrounds/. Automatic upload requires backend support.');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Only PNG and JPG files are allowed.');
      return;
    }
    alert('Please manually add the file to src/assets/report-backgrounds/. Automatic upload requires backend support.');
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Report Cover Pages</h3>
      <div
        className="mb-4 p-4 border-2 border-dashed border-blue-400 rounded-lg text-center cursor-pointer bg-white/5 hover:bg-blue-500/10 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        <input
          type="file"
          accept="image/png,image/jpeg"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <p className="text-blue-300">Drag & drop a PNG or JPG here, or click to upload</p>
      </div>
      <div className="flex gap-4 overflow-x-auto py-2 w-full max-w-full">
        {backgrounds.map(bg => (
          <div key={bg.path} className="relative group flex-shrink-0">
            <button
              className={`rounded-lg border-2 ${selected === bg.path ? 'border-blue-500' : 'border-transparent'} transition-all focus:outline-none`}
              onClick={() => onChange(bg.path)}
              type="button"
            >
              <img src={bg.path} alt={bg.name} className="w-40 h-56 object-cover rounded-lg" />
              <div className="text-xs text-center text-white mt-1 w-40 truncate">{bg.name}</div>
            </button>
            {/* Delete button, visible on hover/focus or always on mobile */}
            <button
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity md:opacity-100"
              title="Delete cover page"
              onClick={e => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this cover page? You must manually remove the file from src/assets/report-backgrounds/.')) {
                  alert('Please manually delete the file from src/assets/report-backgrounds/. Automatic deletion requires backend support.');
                }
              }}
              type="button"
              style={{ zIndex: 10 }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M9 6v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6m-6 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 