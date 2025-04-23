
import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className, 
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer rounded-md",
            className
          )}
        />
      ))}
    </>
  );
};

export default SkeletonLoader;
