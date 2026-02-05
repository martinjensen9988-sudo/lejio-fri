import { Skeleton } from "@/components/ui/skeleton";

interface VehicleCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

const VehicleCardSkeleton = ({ viewMode = 'grid' }: VehicleCardSkeletonProps) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden animate-pulse">
        <div className="flex">
          {/* Image skeleton */}
          <Skeleton className="w-72 h-52 shrink-0 rounded-none" />
          
          {/* Content skeleton */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid skeleton
  return (
    <div className="bg-card rounded-2xl border-2 border-border overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <Skeleton className="h-52 w-full rounded-none" />
      
      {/* Content skeleton */}
      <div className="p-5">
        {/* Title */}
        <div className="mb-3 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Rating placeholder */}
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        
        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        
        {/* Location */}
        <Skeleton className="h-4 w-24 mb-4" />
        
        {/* Price section */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-end justify-between mb-3">
            <div className="space-y-1">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default VehicleCardSkeleton;
