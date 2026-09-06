"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { reviewVideos } from "./review-stories-data";

export default function ReviewStories() {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  return (
    <>
      <section className="home-story-highlights" aria-labelledby="story-reviews-title">
        <div className="home-story-highlights__heading">
          <div>
            <p className="home-story-highlights__eyebrow">Customer stories</p>
            <h2 id="story-reviews-title">Review highlights.</h2>
            <p>Tap a story to watch real customer review videos.</p>
          </div>
        </div>
        <div className="home-story-highlights__row" aria-label="Review story highlights">
          {reviewVideos.map((story, index) => (
            <button
              key={story.src}
              type="button"
              className="home-story-highlight"
              onClick={() => setActiveStoryIndex(index)}
              aria-label={`Open customer review story ${index + 1}`}
              aria-haspopup="dialog"
            >
              <span className="home-story-highlight__ring">
                <span className="home-story-highlight__inner">
                  <Image src={story.poster} alt="" fill sizes="80px" unoptimized />
                </span>
              </span>
              <span className="home-story-highlight__label">Review {index + 1}</span>
            </button>
          ))}
        </div>
      </section>
      {activeStoryIndex !== null && createPortal(
        <StoryViewer initialIndex={activeStoryIndex} onClose={() => setActiveStoryIndex(null)} />,
        document.body,
      )}
    </>
  );
}

function StoryViewer({ initialIndex, onClose }: { initialIndex: number; onClose: () => void }) {
  const [activeStoryIndex, setActiveStoryIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const activeStory = reviewVideos[activeStoryIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;
    let cancelled = false;
    void video.play().catch(() => {
      if (!cancelled) setIsPaused(true);
    });
    return () => { cancelled = true; };
  }, [activeStoryIndex]);

  function changeStory(offset: number) {
    setActiveStoryIndex((index) => (index + offset + reviewVideos.length) % reviewVideos.length);
    setIsPaused(false);
    setProgress(0);
    setHasError(false);
  }

  function togglePlayback() {
    const video = mainVideoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setIsPaused(true));
    } else {
      video.pause();
    }
  }

  return (
    <dialog ref={dialogRef} className="story-viewer" aria-label="Customer review stories" onCancel={onClose}>
      <button type="button" className="story-viewer__backdrop" onClick={onClose} aria-label="Close story viewer" tabIndex={-1} />
      <div className="story-viewer__shell">
        <button type="button" className="story-viewer__close" onClick={onClose} aria-label="Close" autoFocus>✕</button>
        <div className="story-viewer__main">
          <div className="story-viewer__progress" aria-label={`Story ${activeStoryIndex + 1} of ${reviewVideos.length}`}>
            {reviewVideos.map((story, index) => (
              <span key={story.src} className={index === activeStoryIndex ? "is-active" : index < activeStoryIndex ? "is-complete" : ""}>
                <span style={{ width: `${index < activeStoryIndex ? 100 : index === activeStoryIndex ? progress : 0}%` }} />
              </span>
            ))}
          </div>
          <div className="story-viewer__topbar">
            <div className="story-viewer__identity">
              <span className="story-viewer__avatar">
                <Image src="/logo.webp" alt="Nasty Burger House" fill sizes="40px" />
              </span>
              <div><strong>nastyburgerhouse</strong><span>Customer reviews</span></div>
            </div>
            <div className="story-viewer__actions">
              <button type="button" onClick={() => setIsMuted((value) => !value)} aria-label={isMuted ? "Unmute story" : "Mute story"}>
                {isMuted ? "🔇" : "🔊"}
              </button>
              <button type="button" onClick={togglePlayback} aria-label={isPaused ? "Play story" : "Pause story"}>
                {isPaused ? "▶" : "❚❚"}
              </button>
            </div>
          </div>
          <div className="story-viewer__stage">
            <button type="button" className="story-viewer__nav story-viewer__nav--prev" onClick={() => changeStory(-1)} aria-label="Previous story">‹</button>
            <video
              key={activeStory.src}
              ref={mainVideoRef}
              className="story-viewer__video"
              src={activeStory.src}
              poster={activeStory.poster}
              playsInline
              autoPlay
              controls
              muted={isMuted}
              aria-label={`Customer review video ${activeStoryIndex + 1}`}
              onEnded={() => changeStory(1)}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                setProgress(Number.isFinite(video.duration) && video.duration > 0 ? Math.min(100, video.currentTime / video.duration * 100) : 0);
              }}
              onError={() => { setHasError(true); setIsPaused(true); }}
            />
            {hasError && <p className="story-viewer__error" role="status">This video couldn’t load. Try the next story.</p>}
            <button type="button" className="story-viewer__nav story-viewer__nav--next" onClick={() => changeStory(1)} aria-label="Next story">›</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
