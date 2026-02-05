import { Star, Award, Crown, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LessorStats, getStatusLabel, getStatusColor } from '@/hooks/useLessorRatings';

interface LessorStatusBadgeProps {
  status: LessorStats['lessor_status'];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const StatusIcon = ({ status, className }: { status: LessorStats['lessor_status']; className?: string }) => {
  const icons = {
    bronze: Award,
    silver: Award,
    gold: Crown,
    platinum: Gem,
  };
  const Icon = icons[status];
  return <Icon className={className} />;
};

export const LessorStatusBadge = ({ status, size = 'md', showLabel = true }: LessorStatusBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        getStatusColor(status)
      )}
    >
      <StatusIcon status={status} className={iconSizes[size]} />
      {showLabel && getStatusLabel(status)}
    </span>
  );
};
