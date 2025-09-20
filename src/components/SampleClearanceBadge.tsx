import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SampleClearanceBadgeProps {
  containsSamples: boolean;
  samplesCleared: boolean;
  className?: string;
}

export function SampleClearanceBadge({ 
  containsSamples, 
  samplesCleared,
  className = ''
}: SampleClearanceBadgeProps) {
  if (!containsSamples) {
    return null;
  }

  const getBadgeConfig = () => {
    if (samplesCleared) {
      return {
        icon: CheckCircle,
        label: 'Samples Cleared',
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        hoverColor: 'hover:bg-green-500/30',
        title: 'All samples in this track have been cleared for use'
      };
    } else {
      return {
        icon: AlertTriangle,
        label: 'Uncleared Samples',
        color: 'bg-red-500/20 text-red-300 border-red-500/30',
        hoverColor: 'hover:bg-red-500/30',
        title: 'This track contains samples that need clearance'
      };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${config.color} ${config.hoverColor} ${className}`}
      title={config.title}
    >
      <IconComponent className="w-3 h-3" />
      {config.label}
    </div>
  );
}
