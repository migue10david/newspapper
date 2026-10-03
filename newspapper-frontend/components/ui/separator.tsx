'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return <SeparatorPrimitive.Root className={cn('shrink-0 bg-border', orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full', className)} decorative={decorative} orientation={orientation} {...props} />;
}
