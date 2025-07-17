import React from 'react';

const backgrounds = [
  { name: 'MyBeatFi Branded', path: '/report-backgrounds/option-mybeatfi.png' },
  { name: 'Neutral', path: '/report-backgrounds/option-neutral.png' },
  // Add more as needed, e.g. { name: 'Option 1', path: '/report-backgrounds/option-1.png' }
];

interface ReportBackgroundPickerProps {
  selected: string;
  onChange: (path: string) => void;
}

export function ReportBackgroundPicker({ selected, onChange }: ReportBackgroundPickerProps) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {backgrounds.map(bg => (
        <div
          key={bg.path}
          onClick={() => onChange(bg.path)}
          style={{
            cursor: 'pointer',
            border: selected === bg.path ? '2px solid #fff' : '2px solid transparent',
            borderRadius: 8,
            boxShadow: selected === bg.path ? '0 0 8px #fff' : undefined,
          }}
        >
          <img src={bg.path} alt={bg.name} style={{ width: 100, height: 140, objectFit: 'cover', borderRadius: 8 }} />
          <div style={{ color: '#fff', textAlign: 'center', marginTop: 4 }}>{bg.name}</div>
        </div>
      ))}
    </div>
  );
} 