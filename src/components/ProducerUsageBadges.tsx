import React from 'react';
import { Music, Layers, Zap } from 'lucide-react';

interface ProducerUsageBadgesProps {
  usesLoops?: boolean;
  usesSamples?: boolean;
  usesSplice?: boolean;
  className?: string;
}

export function ProducerUsageBadges({ 
  usesLoops = false, 
  usesSamples = false, 
  usesSplice = false,
  className = ''
}: ProducerUsageBadgesProps) {
  const badges = [];

  if (usesLoops) {
    badges.push({
      label: 'Loops',
      icon: Music,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      hoverColor: 'hover:bg-blue-500/30'
    });
  }

  if (usesSamples) {
    badges.push({
      label: 'Samples',
      icon: Layers,
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      hoverColor: 'hover:bg-purple-500/30'
    });
  }

  if (usesSplice) {
    badges.push({
      label: 'Splice',
      icon: Zap,
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      hoverColor: 'hover:bg-orange-500/30'
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
            title={`Uses ${badge.label}`}
          >
            <IconComponent className="w-3 h-3" />
            {badge.label}
          </div>
        );
      })}
    </div>
  );
}
