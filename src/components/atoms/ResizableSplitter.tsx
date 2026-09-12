import React, { useCallback, useEffect, useState } from 'react';

interface ResizableSplitterProps {
  direction?: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

export const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  direction = 'horizontal',
  onResize,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const delta = direction === 'horizontal' ? e.movementX : e.movementY;
      onResize(delta);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, direction, onResize]);

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`relative flex items-center justify-center transition-colors select-none ${
        direction === 'horizontal' ? 'cursor-col-resize w-1 hover:w-1.5' : 'cursor-row-resize h-1 hover:h-1.5'
      } ${
        isDragging ? 'bg-indigo-500' : 'bg-neutral-800 hover:bg-indigo-500/60'
      } ${className}`}
    >
      <div className={`rounded-full bg-neutral-600 ${direction === 'horizontal' ? 'h-6 w-0.5' : 'w-6 h-0.5'}`} />
    </div>
  );
};
