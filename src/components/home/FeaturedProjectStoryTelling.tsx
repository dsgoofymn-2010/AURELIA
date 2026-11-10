// FeaturedProjectStoryTelling.tsx
// Carousel component showing a left‑hand media area (video / 3‑D model placeholder)
// and a right‑hand text area with heading, sub‑heading and paragraph placeholders.
// Clicking the media area reveals the text with a smooth fade‑in animation.

import React, { useState } from 'react';
import './FeaturedProjectStoryTelling.css';

export interface SlideItem {
    id: string | number;
    /** Placeholder image / video URL (will be rendered in a <video> or <img>) */
    media?: string;
    /** Alt text for the media placeholder */
    mediaAlt?: string;
    /** Heading text */
    heading?: string;
    /** Sub‑heading text */
    subheading?: string;
    /** Paragraph lines – up to four */
    paragraphs?: string[];
}

/**
 * Four default slides matching the description in the request.
 * Replace the `media` URLs with the real 3‑D model exporter or video files.
 */
const DEFAULT_SLIDES: SlideItem[] = [
    {
        id: 1,
        media: '', // empty = placeholder box
        heading: 'Immersive Exploration',
        subheading: 'Step inside a virtual world',
        paragraphs: [
            'Our cutting‑edge 3‑D engine brings every detail to life.',
            'Navigate through complex environments with ease.',
            'Experience fluid motion and realistic lighting.',
        ],
    },
    {
        id: 2,
        media: '',
        heading: 'Live Data Visualisation',
        subheading: 'Realtime insights on screen',
        paragraphs: [
            'Stream data directly into a 3‑D representation.',
            'Watch metrics evolve as you interact.',
            'Make informed decisions faster.',
            'All powered by WebGL for smooth performance.',
        ],
    },
    {
        id: 3,
        media: '',
        heading: 'Interactive Storytelling',
        subheading: 'Narratives that respond to you',
        paragraphs: [
            'Blend video and 3‑D scenes for immersive stories.',
            'Trigger animations by clicking on hotspots.',
            'Create memorable experiences that adapt.',
        ],
    },
    {
        id: 4,
        media: '',
        heading: 'Future‑Ready UI',
        subheading: 'Designs that scale with technology',
        paragraphs: [
            'Modular components for rapid iteration.',
            'Responsive layouts for any device.',
            'Built with accessibility in mind.',
        ],
    },
];

export const FeaturedProjectStoryTelling: React.FC = () => {
    const slides = DEFAULT_SLIDES;
    const [activeIdx, setActiveIdx] = useState(0);
    const [revealed, setRevealed] = useState<Set<number>>(new Set());

    // Helper to animate text character‑by‑character with flip effect
    const renderAnimated = (text: string, baseClass: string) =>
        text.split('').map((ch, i) => (
            <span
                key={i}
                className={`char ${baseClass}`}
                style={{ animationDelay: `${i * 0.05}s` }}
            >
                {ch}
            </span>
        ));
    const handleMediaClick = (idx: number) => {
        setRevealed((prev) => new Set(prev).add(idx));
    };

    // Manual navigation handlers (no auto‑play)
    const goPrev = () => {
        setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
    };
    const goNext = () => {
        setActiveIdx((prev) => (prev + 1) % slides.length);
    };

    const trackStyle = {
        transform: `translateX(-${activeIdx * 100}%)`,
    } as React.CSSProperties;

    return (
        <section className="fsst-carousel-wrapper">
            {/* Navigation arrows */}
            <button className="fsst-nav prev" onClick={goPrev} aria-label="Previous slide">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#e3e3e3"><path d="M14,18L8,12l6-6l1.4,1.4L10.8,12l4.6,4.6L14,18Z" /></svg>
            </button>
            <button className="fsst-nav next" onClick={goNext} aria-label="Next slide">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#e3e3e3"><path d="M12.6,12L8,7.4L9.4,6l6,6l-6,6L8,16.6L12.6,12Z" /></svg>
            </button>

            <div className="fsst-carousel-track" style={trackStyle}>
                {slides.map((slide, idx) => (
                    <div key={slide.id} className="fsst-slide">
                        {/* Left side – media placeholder */}
                        <div
                            className="fsst-media"
                            onClick={() => handleMediaClick(idx)}
                            role="button"
                            tabIndex={0}
                        >
                            {/* If a real media URL is supplied we render a video, otherwise a box */}
                            {slide.media ? (
                                <video
                                    src={slide.media}
                                    muted
                                    loop
                                    autoPlay
                                    className="fsst-video"
                                    aria-label={slide.mediaAlt ?? 'Project video'}
                                />
                            ) : (
                                <div className="fsst-media-placeholder" aria-hidden="true" />
                            )}
                        </div>

                        {/* Right side – textual information */}
                        <div className={`fsst-text ${revealed.has(idx) ? 'visible' : ''}`}>
                            {revealed.has(idx) ? (
                                <>
                                    <h3 className="fsst-heading">
                                        {renderAnimated(slide.heading || '', 'heading-char')}
                                    </h3>
                                    <h4 className="fsst-subheading">
                                        {renderAnimated(slide.subheading || '', 'subheading-char')}
                                    </h4>
                                    <div className="fsst-paragraphs">
                                        {slide.paragraphs?.map((p, i) => (
                                            <p key={i} className="fsst-paragraph">
                                                {renderAnimated(p, 'para-char')}
                                            </p>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="fsst-loading">
                                    <div className="line line-short" />
                                    <div className="line line-medium" />
                                    <div className="line line-long" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeaturedProjectStoryTelling;

