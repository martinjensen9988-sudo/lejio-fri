import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileComponent?: React.ReactNode;
}

/**
 * A wrapper that shows a table on desktop and an alternative component on mobile
 */
export const ResponsiveTable = ({ 
  children, 
  className, 
  mobileComponent 
}: ResponsiveTableProps) => {
  const isMobile = useIsMobile();

  if (isMobile && mobileComponent) {
    return <>{mobileComponent}</>;
  }

  return (
    <div className={cn("w-full overflow-auto", className)}>
      {children}
    </div>
  );
};

interface ResponsiveCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyState?: React.ReactNode;
}

/**
 * A mobile-friendly card list for displaying data
 */
export function ResponsiveCardList<T>({ 
  items, 
  renderCard, 
  className,
  emptyState 
}: ResponsiveCardListProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => renderCard(item, index))}
    </div>
  );
}
