import React from 'react';
import { Music, Layers, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrackClearanceBadgesProps {
  containsLoops: boolean;
  containsSamples: boolean;
  containsSpliceLoops: boolean;
  samplesCleared: boolean;
  className?: string;
}

export function TrackClearanceBadges({
  containsLoops,
  containsSamples,
  containsSpliceLoops,
  samplesCleared,
  className = ''
}: TrackClearanceBadgesProps) {
  const badges = [];

  // Add loop badge
  if (containsLoops) {
    badges.push({
      label: 'Loops',
      icon: Music,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      hoverColor: 'hover:bg-blue-500/30',
      title: 'This track contains loops that may need clearance'
    });
  }

  // Add sample badge
  if (containsSamples) {
    const isCleared = samplesCleared;
    badges.push({
      label: isCleared ? 'Samples Cleared' : 'Uncleared Samples',
      icon: isCleared ? CheckCircle : AlertTriangle,
      color: isCleared 
        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
        : 'bg-red-500/20 text-red-300 border-red-500/30',
      hoverColor: isCleared 
        ? 'hover:bg-green-500/30' 
        : 'hover:bg-red-500/30',
      title: isCleared 
        ? 'All samples in this track have been cleared for use'
        : 'This track contains samples that need clearance'
    });
  }

  // Add Splice loops badge
  if (containsSpliceLoops) {
    badges.push({
      label: 'Splice Loops',
      icon: Zap,
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      hoverColor: 'hover:bg-orange-500/30',
      title: 'This track contains Splice loops that may need clearance'
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map((badge, index) => {
        const IconComponent = badge.icon;
        return (
          <div 
            key={index} 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${badge.color} ${badge.hoverColor}`} 
            title={badge.title}
          >
            <IconComponent className="w-3 h-3" />
            {badge.label}
          </div>
        );
      })}
    </div>
  );
}
