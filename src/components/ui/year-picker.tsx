import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface YearPickerProps {
  years: number[];
  value: number | null;
  onChange: (year: number) => void;
  className?: string;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

export function YearPicker({ years, value, onChange, className }: YearPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (value) {
      const index = years.indexOf(value);
      return index >= 0 ? index : Math.floor(years.length / 2);
    }
    return Math.floor(years.length / 2);
  });

  useEffect(() => {
    if (containerRef.current) {
      const scrollPosition = selectedIndex * ITEM_HEIGHT;
      containerRef.current.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(newIndex, years.length - 1));
      
      if (clampedIndex !== selectedIndex) {
        setSelectedIndex(clampedIndex);
      }
    }
  };

  const handleScrollEnd = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(newIndex, years.length - 1));
      
      // Snap to the nearest item
      containerRef.current.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });
      
      setSelectedIndex(clampedIndex);
      onChange(years[clampedIndex]);
    }
  };

  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "smooth",
      });
    }
    onChange(years[index]);
  };

  // Calculate padding to center the items
  const paddingHeight = (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;

  return (
    <div className={cn("relative", className)}>
      {/* Highlight band for selected item */}
      <div 
        className="absolute left-0 right-0 bg-muted/80 rounded-lg pointer-events-none z-0"
        style={{
          top: paddingHeight,
          height: ITEM_HEIGHT,
        }}
      />
      
      {/* Gradient overlays for fade effect */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="overflow-y-auto scrollbar-hide relative z-0"
        style={{
          height: VISIBLE_ITEMS * ITEM_HEIGHT,
          scrollSnapType: "y mandatory",
        }}
        onScroll={handleScroll}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
      >
        {/* Top padding */}
        <div style={{ height: paddingHeight }} />
        
        {/* Year items */}
        {years.map((year, index) => {
          const distance = Math.abs(index - selectedIndex);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;
          const scale = distance === 0 ? 1 : distance === 1 ? 0.95 : 0.9;
          
          return (
            <button
              key={year}
              onClick={() => handleItemClick(index)}
              className={cn(
                "w-full flex items-center justify-center transition-all duration-150",
                "text-foreground font-medium",
                distance === 0 ? "text-2xl" : distance === 1 ? "text-xl" : "text-lg"
              )}
              style={{
                height: ITEM_HEIGHT,
                opacity,
                transform: `scale(${scale})`,
                scrollSnapAlign: "center",
              }}
            >
              {year}
            </button>
          );
        })}
        
        {/* Bottom padding */}
        <div style={{ height: paddingHeight }} />
      </div>
    </div>
  );
}
