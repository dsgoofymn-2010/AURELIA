import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AwardsAndAchvements.css';

export interface AwardItem {
  id: string | number;
  title?: string;
  description?: string;
  image?: string;
  alt?: string;
  [key: string]: unknown;
}

export interface AwardsAndAchvementsProps {
  items?: AwardItem[];
  /** Duration in ms that each card stays centered before advancing (default: 3000ms) */
  interval?: number;
  /** Whether the arch rotates automatically (default: true) */
  autoPlay?: boolean;
  /** Pause auto-rotation when hovering over the arch (default: true) */
  pauseOnHover?: boolean;
  /** Optional custom section title */
  title?: string;
  /** Optional custom section subtitle */
  subtitle?: string;
  /** Optional custom badge text */
  badgeText?: string;
  /** Additional custom class */
  className?: string;
  /** Callback fired when a card is clicked */
  onCardClick?: (item: AwardItem, index: number) => void;
  /** Callback fired when the active center card changes */
  onCardChange?: (item: AwardItem, index: number) => void;
}

// Default items matching the exact titles & descriptions shown in the showcase video
const DEFAULT_ITEMS: AwardItem[] = [
  {
    id: '1',
    title: 'Coral fold',
    description: 'A bold change of direction',
  },
  {
    id: '2',
    title: 'Golden Loop',
    description: 'Harmonic curvature & balance',
  },
  {
    id: '3',
    title: 'Cyber Step',
    description: 'Architectural precision in code',
  },
  {
    id: '4',
    title: 'Neon Horizon',
    description: 'Pushing the limits of modern interfaces',
  },
  {
    id: '5',
    title: 'Prism Wave',
    description: 'Refracting ideas into dynamic systems',
  },
  {
    id: '6',
    title: 'Obsidian Flow',
    description: 'Seamless motion through minimal design',
  },
  {
    id: '7',
    title: 'Solar Zenith',
    description: 'Illuminating breakthrough experiences',
  },
  {
    id: '8',
    title: 'Quantum Shift',
    description: 'Harmonizing interaction and performance',
  },
];

export const AwardsAndAchvements: React.FC<AwardsAndAchvementsProps> = ({
  items = DEFAULT_ITEMS,
  interval = 3000,
  autoPlay = true,
  pauseOnHover = true,
  title = 'Awards & Achievements',
  subtitle = 'A timeline of accolades, industry recognitions, and creative milestones.',
  badgeText = 'RECOGNITION & HONORS',
  className = '',
  onCardClick,
  onCardChange,
}) => {
  const safeItems = items.length > 0 ? items : DEFAULT_ITEMS;
  const totalCount = safeItems.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [stageWidth, setStageWidth] = useState<number>(1200);

  const stageRef = useRef<HTMLDivElement>(null);
  const lastReportedIndex = useRef<number | null>(null);

  // Measure stage width for responsive card spread
  useEffect(() => {
    const updateWidth = () => {
      if (stageRef.current) {
        setStageWidth(stageRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Fire onCardChange when activeIndex changes
  useEffect(() => {
    if (lastReportedIndex.current !== activeIndex) {
      lastReportedIndex.current = activeIndex;
      onCardChange?.(safeItems[activeIndex], activeIndex);
    }
  }, [activeIndex, onCardChange, safeItems]);

  // Automatic 3-second rotation timer
  useEffect(() => {
    if (!autoPlay || (pauseOnHover && isHovered)) return;

    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % totalCount);
    }, interval);

    return () => clearTimeout(timer);
  }, [activeIndex, autoPlay, pauseOnHover, isHovered, totalCount, interval]);

  // Clicking any card brings it directly into the center
  const handleCardClick = useCallback(
    (item: AwardItem, index: number) => {
      setActiveIndex(index);
      onCardClick?.(item, index);
    },
    [onCardClick]
  );

  const handleImageLoad = (key: string) => {
    setLoadedImages((prev) => ({ ...prev, [key]: true }));
  };

  // Compute responsive horizontal spacing between cards
  const stepX = Math.min(245, Math.max(140, stageWidth * 0.22));

  // Active item for the bottom title/desc
  const activeItem = safeItems[activeIndex] || safeItems[0];

  return (
    <section
      className={`awards-section-wrapper ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Header Badge & Titles (Exact from video) */}
      <div className="awards-header">
        <div className="awards-badge">
          <svg
            className="awards-badge-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
          <span>{badgeText}</span>
        </div>
        <h2 className="awards-heading">{title}</h2>
        <p className="awards-subheading">{subtitle}</p>
      </div>

      {/* Orbit Reel Stage */}
      <div className="orbit-stage" ref={stageRef}>
        <div className="orbit-ambient-glow" />

        {safeItems.map((item, index) => {
          // Calculate shortest signed offset from activeIndex
          let diff = index - activeIndex;
          while (diff > totalCount / 2) diff -= totalCount;
          while (diff < -totalCount / 2) diff += totalCount;

          const isActive = diff === 0;
          const absDiff = Math.abs(diff);

          // Position, tilt, scale and opacity for each slot
          let posX: number;
          let posY: number;
          let rot: number;
          let scale: number;
          let opacity: number;
          let zIndex: number;
          let pointerEvents: 'auto' | 'none' = 'auto';

          if (diff === 0) {
            // Center active card
            posX = 0;
            posY = 24;
            rot = 0;
            scale = 1.05;
            opacity = 1;
            zIndex = 30;
          } else if (absDiff === 1) {
            // Inner left / right
            const sign = diff > 0 ? 1 : -1;
            posX = sign * stepX;
            posY = 54;
            rot = sign * 14;
            scale = 0.92;
            opacity = 0.65;
            zIndex = 20;
          } else if (absDiff === 2) {
            // Far left / right
            const sign = diff > 0 ? 1 : -1;
            posX = sign * stepX * 1.94;
            posY = 114;
            rot = sign * 26;
            scale = 0.82;
            opacity = 0.40;
            zIndex = 10;
          } else {
            // Hidden overflow cards outside visible 5-card arch
            const sign = diff > 0 ? 1 : -1;
            posX = sign * stepX * 2.8;
            posY = 220;
            rot = sign * 40;
            scale = 0.7;
            opacity = 0;
            zIndex = 0;
            pointerEvents = 'none';
          }

          const imageKey = `award-${item.id}`;
          const isLoaded = Boolean(loadedImages[imageKey]);

          return (
            <div
              key={item.id}
              className="orbit-card-wrapper"
              style={{
                transform: `translate3d(calc(-50% + ${posX}px), ${posY}px, 0) rotate(${rot}deg) scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents,
              }}
            >
              <div
                className={`orbit-card ${isActive ? 'is-active' : ''}`}
                onClick={() => handleCardClick(item, index)}
                role="button"
                tabIndex={opacity > 0 ? 0 : -1}
                aria-label={item.title || `Award ${index + 1}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(item, index);
                  }
                }}
              >
                {item.image ? (
                  <>
                    <img
                      src={item.image}
                      alt={item.title || item.alt || ''}
                      className={`orbit-card-image ${isLoaded ? 'is-loaded' : ''}`}
                      onLoad={() => handleImageLoad(imageKey)}
                    />
                    {!isLoaded && <SkeletonContent />}
                  </>
                ) : (
                  <SkeletonContent />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Card Title & Subtitle (Below center card, exact from video) */}
      <div className="orbit-active-info" key={activeItem.id}>
        <h3 className="orbit-active-title">{activeItem.title}</h3>
        {activeItem.description && (
          <p className="orbit-active-desc">{activeItem.description}</p>
        )}
      </div>
    </section>
  );
};

// Skeleton content inside the card matching the exact video layout
const SkeletonContent: React.FC = () => {
  return (
    <div className="orbit-skeleton-body" aria-hidden="true">
      <div className="orbit-skeleton-shimmer" />
      <div className="orbit-skeleton-icon-box">
        <svg
          className="orbit-skeleton-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="3" />
          <circle cx="8.5" cy="8.5" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
      <span className="orbit-skeleton-label">IMAGE</span>
    </div>
  );
};

export const AwardsAndAchievements = AwardsAndAchvements;
export const OrbitReel = AwardsAndAchvements;
export default AwardsAndAchvements;
