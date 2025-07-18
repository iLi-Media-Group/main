import React from 'react';

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
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      {backgrounds.map(bg => (
        <div
          key={bg.path}
          onClick={() => onChange(bg.path)}
          style={{
            cursor: 'pointer',
            border: selected === bg.path ? '2px solid #fff' : '2px solid transparent',
            borderRadius: 8,
            boxShadow: selected === bg.path ? '0 0 8px #fff' : undefined,
            marginBottom: 8,
          }}
        >
          <img src={bg.path} alt={bg.name} style={{ width: 100, height: 140, objectFit: 'cover', borderRadius: 8 }} />
          <div style={{ color: '#fff', textAlign: 'center', marginTop: 4 }}>{bg.name}</div>
        </div>
      ))}
    </div>
  );
} 