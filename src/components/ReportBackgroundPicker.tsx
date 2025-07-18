import React, { useRef } from 'react';

// Dynamically import all PNGs from the report-backgrounds folder
const backgroundModules = import.meta.glob('../assets/report-backgrounds/*.png', { eager: true, as: 'url' });
const backgrounds = Object.entries(backgroundModules).map(([path, url]) => {
  // Extract filename for label
  const name = path.split('/').pop()?.replace('.png', '').replace(/option-/, 'Option ').replace(/mybeatfi/i, 'MyBeatFi Branded').replace(/neutral/i, 'Neutral') || 'Background';
  return { name, path: url as string };
});

interface ReportBackgroundPickerProps {
  selected: string;
  onChange: (path: string) => void;
}

export function ReportBackgroundPicker({ selected, onChange }: ReportBackgroundPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to selected background when it changes
  React.useEffect(() => {
    const idx = backgrounds.findIndex(bg => bg.path === selected);
    if (idx !== -1 && itemRefs.current[idx]) {
      itemRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selected]);

  const scrollBy = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -width * 0.7 : width * 0.7, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        aria-label="Scroll left"
        onClick={() => scrollBy('left')}
        style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          background: 'rgba(30,41,59,0.7)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #0002',
        }}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          display: 'flex',
          gap: 16,
          padding: '8px 48px', // space for arrows
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
        }}
      >
        {backgrounds.map((bg, idx) => (
          <div
            key={bg.path}
            ref={el => (itemRefs.current[idx] = el)}
            onClick={() => onChange(bg.path)}
            style={{
              cursor: 'pointer',
              border: selected === bg.path ? '2px solid #fff' : '2px solid transparent',
              borderRadius: 8,
              boxShadow: selected === bg.path ? '0 0 8px #fff' : undefined,
              marginBottom: 8,
              flex: '0 0 auto',
              width: 100,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              transition: 'border 0.2s, box-shadow 0.2s',
            }}
          >
            <img src={bg.path} alt={bg.name} style={{ width: 100, height: 140, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ color: '#fff', textAlign: 'center', marginTop: 4, fontSize: 14 }}>{bg.name}</div>
          </div>
        ))}
      </div>
      <button
        aria-label="Scroll right"
        onClick={() => scrollBy('right')}
        style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
          background: 'rgba(30,41,59,0.7)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #0002',
        }}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
} 