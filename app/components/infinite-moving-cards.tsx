"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type InfiniteMovingCardsProps<T> = {
  items: T[];
  label?: string;
  renderItem: (item: T, index: number) => ReactNode;
};

/** Adapted from the supplied moving-card snippet using native CSS animation. */
export default function InfiniteMovingCards<T extends { id: string }>({
  items,
  label = "Customer reviews",
  renderItem,
}: InfiniteMovingCardsProps<T>) {
  const firstGroup = useRef<HTMLUListElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const canLoop = items.length > 1;

  useEffect(() => {
    const group = firstGroup.current;
    if (!group) return;
    const viewport = track.current?.parentElement;
    const measure = () => {
      track.current?.style.setProperty("--review-viewport", `${viewport?.clientWidth ?? 0}px`);
      // Including the trailing gap makes both groups identical for a seamless loop.
      track.current?.style.setProperty("--review-duration", `${group.getBoundingClientRect().width / 26}s`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    if (viewport) observer.observe(viewport);
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="home-review-marquee" data-loop={canLoop} data-paused={paused}>
      <div className="home-review-marquee__viewport" tabIndex={canLoop ? 0 : undefined} role="region" aria-label={label}>
        <div className="home-review-marquee__track" ref={track}>
          <ul className="home-review-marquee__group" ref={firstGroup}>
            {items.map((item, index) => <li key={item.id}>{renderItem(item, index)}</li>)}
          </ul>
          {canLoop && (
            <ul className="home-review-marquee__group home-review-marquee__copy" aria-hidden="true" inert>
              {items.map((item, index) => <li key={item.id}>{renderItem(item, index)}</li>)}
            </ul>
          )}
        </div>
      </div>
      {canLoop && (
        <div className="home-review-marquee__controls">
          <span className="home-review-marquee__swipe">Swipe to read more <span aria-hidden="true">↔</span></span>
          <button className="home-review-marquee__pause" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
            {paused ? "Resume scrolling" : "Pause scrolling"}
          </button>
        </div>
      )}
    </div>
  );
}
