"use client";

import { animate, type AnimationPlaybackControls, type Easing } from "motion";
import { useEffect } from "react";
import { cssMotionRecipes, cssMotionSelectors, cssMotionPseudoSelectors, pseudoMotionProperties } from "../lib/motion-css-recipes";

const recipes: Record<string, readonly { offset: number; values: Readonly<Record<string, string>> }[]> = cssMotionRecipes;
const prefixes = ["", "::before", "::after"] as const;
type Surface = typeof prefixes[number];
type ElementWithStyle = HTMLElement | SVGElement;
type Playback = { controls: AnimationPlaybackControls; restore: () => void; property?: string; duration?: number };
type Snapshot = { values: Record<string, string>; properties: string[] };
type RecordState = { element: ElementWithStyle; surface: Surface; snapshot: Snapshot; transition: Playback[]; loop?: Playback; loopName?: string };

function seconds(value: string) {
  return Number.parseFloat(value) / (value.trim().endsWith("ms") ? 1000 : 1) || 0;
}

function easing(value: string): Easing {
  const bezier = value.match(/^cubic-bezier\(([^)]+)\)$/);
  if (bezier) return bezier[1].split(",").map(Number) as [number, number, number, number];
  const names: Record<string, Easing> = { ease: [0.25, 0.1, 0.25, 1], "ease-in": "easeIn", "ease-out": "easeOut", "ease-in-out": "easeInOut", linear: "linear" };
  return names[value] ?? "easeInOut";
}

function outputProperty(property: string, surface: Surface) {
  return surface ? `--nbh-${surface.slice(2)}-${property}` : `--nbh-live-${property}`;
}

function saveStyles(element: ElementWithStyle, properties: string[]) {
  const original = properties.map(property => [property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
  return () => original.forEach(([property, value, priority]) => {
    if (value) element.style.setProperty(property, value, priority);
    else element.style.removeProperty(property);
  });
}

const playbackVersions = new WeakMap<ElementWithStyle, Map<string, symbol>>();

function play(element: ElementWithStyle, surface: Surface, frames: Record<string, string[]>, options: Parameters<typeof animate>[2]): Playback {
  const outputs = Object.keys(frames).map(property => outputProperty(property, surface));
  const properties = [...outputs, ...(surface ? [] : Object.keys(frames))];
  const restoreStyles = saveStyles(element, properties);
  const versions = playbackVersions.get(element) ?? new Map<string, symbol>();
  playbackVersions.set(element, versions);
  const version = Symbol();
  properties.forEach(property => versions.set(property, version));
  const restore = () => {
    restoreStyles();
    // Motion may have a style render queued for the current frame. Restore again
    // after it, unless a replacement animation now owns these properties.
    requestAnimationFrame(() => {
      if (properties.every(property => versions.get(property) === version)) restoreStyles();
    });
  };
  const keyframes: Record<string, string[]> = {};
  Object.entries(frames).forEach(([property, values]) => {
    const output = outputProperty(property, surface);
    element.style.setProperty(output, values[0]);
    if (!surface) element.style.setProperty(property, `var(${output})`, "important");
    keyframes[output] = values;
  });
  return { restore, controls: animate(element, keyframes, options) };
}

// Let the browser resolve CSS variables, calc() delays and shorthand timing.
// These temporary declarations are removed before any visual changes are made.
function timing(element: ElementWithStyle, surface: Surface, kind: "transition" | "animation") {
  const computed = getComputedStyle(element, surface || null);
  const metadata = computed.getPropertyValue(`--nbh-motion-${kind}`).trim();
  if (!metadata || metadata === "none") return null;
  const fields = kind === "transition"
    ? ["transition", "transition-duration", "transition-delay", "transition-property", "transition-timing-function"]
    : ["animation", "animation-duration"];
  const restore = saveStyles(element, fields);
  for (const field of fields) {
    const value = computed.getPropertyValue(`--nbh-motion-${field}`).trim();
    if (value && value !== "not-set") element.style.setProperty(field, value);
  }
  const parsed = getComputedStyle(element);
  const result = kind === "transition" ? {
    properties: parsed.transitionProperty.split(",").map(v => v.trim()),
    durations: parsed.transitionDuration.split(",").map(seconds),
    delays: parsed.transitionDelay.split(",").map(seconds),
    easings: parsed.transitionTimingFunction.split(/,(?![^()]*\))/).map(v => easing(v.trim())),
    name: "", repeat: 0, alternate: false,
  } : {
    properties: [], durations: [seconds(parsed.animationDuration)], delays: [seconds(parsed.animationDelay)],
    easings: [easing(parsed.animationTimingFunction)], name: parsed.animationName,
    repeat: parsed.animationIterationCount === "infinite" ? Infinity : Math.max(0, Number(parsed.animationIterationCount) - 1),
    alternate: parsed.animationDirection === "alternate",
  };
  restore();
  return result;
}

function snapshot(element: ElementWithStyle, surface: Surface, properties: string[]): Snapshot {
  const style = getComputedStyle(element, surface || null);
  return { properties, values: Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)])) };
}

export default function SiteMotion() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 680px)");
    const states = new Map<ElementWithStyle, RecordState[]>();
    let frame = 0;
    let refreshAll = false;
    let discoveryDirty = true;
    const pending = new Set<RecordState>();
    const stop = (playback: Playback) => { playback.controls.stop(); playback.restore(); };

    const startLoop = (state: RecordState) => {
      const config = timing(state.element, state.surface, "animation");
      const name = config?.name === "nasty-toast-enter" && mobile.matches ? "nasty-toast-enter-mobile" : config?.name;
      if (state.loopName === name) return;
      if (state.loop) stop(state.loop);
      state.loop = undefined;
      state.loopName = name;
      if (!config || !name || reduced.matches) return;
      const frames = recipes[name];
      if (!frames) return;
      const properties = [...new Set(frames.flatMap(frame => Object.keys(frame.values)))];
      const initial = getComputedStyle(state.element, state.surface || null);
      const complete = frames[0].offset > 0 ? [{ offset: 0, values: Object.fromEntries(properties.map(p => [p,
        name === "accountSkeletonSweep" ? "translateX(-100%)" : name === "nasty-loading-spin" || name === "nasty-loading-spin-reverse" ? "rotate(0deg)" : initial.getPropertyValue(p)])) }, ...frames] : frames;
      const keyframes = Object.fromEntries(properties.map(property => [property, complete.map(frame => frame.values[property] ?? initial.getPropertyValue(property))]));
      let duration = config.durations[0];
      if (name === "nasty-toast-progress") duration = seconds(getComputedStyle(state.element).getPropertyValue("--nasty-toast-duration")) || 3.8;
      state.loop = play(state.element, state.surface, keyframes, { duration, delay: config.delays[0], ease: config.easings[0], times: complete.map(frame => frame.offset), repeat: config.repeat, repeatType: config.alternate ? "reverse" : "loop" });
    };

    const discover = () => {
      const candidates = new Set<ElementWithStyle>();
      for (const selector of [...cssMotionSelectors, '[class*="--nbh-motion-transition"]']) {
        // Some legacy selectors contain state-only :not() expressions.
        try { document.querySelectorAll<ElementWithStyle>(selector).forEach(element => candidates.add(element)); } catch { /* An inactive selector needs no animation. */ }
      }
      candidates.forEach(element => {
        // A sibling's effect can run while React is still hydrating this tree.
        // Only mutate a client boundary after its own mount effect has run.
        const boundary = element.closest("[data-nbh-motion-boundary]");
        if (boundary && boundary.getAttribute("data-nbh-hydrated") !== "true") return;
        if (states.has(element)) return;
        const surfaces: RecordState[] = [];
        for (const surface of prefixes) {
          if (surface && !cssMotionPseudoSelectors[surface.slice(2) as "before" | "after"].some(selector => {
            try { return element.matches(selector); } catch { return false; }
          })) continue;
          const config = timing(element, surface, "transition");
          const properties = config?.properties.includes("all") ? pseudoMotionProperties : config?.properties.filter(p => p !== "none") ?? [];
          const state: RecordState = { element, surface, snapshot: snapshot(element, surface, properties), transition: [] };
          surfaces.push(state);
          startLoop(state);
        }
        states.set(element, surfaces);
      });
    };

    const update = (state: RecordState) => {
      const { element, surface } = state;
      const current = snapshot(element, surface, state.snapshot.properties);
      const interrupted = state.transition;
      interrupted.forEach(stop);
      state.transition = [];
      const config = timing(element, surface, "transition");
      const properties = config?.properties.includes("all") ? pseudoMotionProperties : config?.properties.filter(p => p !== "none") ?? [];
      const target = snapshot(element, surface, properties);
      if (config && !reduced.matches) properties.forEach((property, index) => {
        const previous = state.snapshot.values[property];
        const next = target.values[property];
        if (!previous || !next || (previous === next && current.values[property] === next)) return;
        const earlier = interrupted.find(playback => playback.property === property);
        const duration = previous === next && earlier
          ? Math.max(0, (earlier.duration ?? 0) - earlier.controls.time)
          : config.durations[index % config.durations.length];
        const delay = config.delays[index % config.delays.length];
        if (duration === 0 && delay === 0) return;
        state.transition.push({ ...play(element, surface, { [property]: [earlier ? current.values[property] || previous : previous, next] }, { duration, delay, ease: config.easings[index % config.easings.length] }), property, duration });
      });
      state.snapshot = target;
      startLoop(state);
    };

    const flush = () => {
      frame = 0;
      if (discoveryDirty) discover();
      discoveryDirty = false;
      states.forEach((surfaces, element) => {
        if (!element.isConnected) {
          surfaces.forEach(state => { state.transition.forEach(stop); if (state.loop) stop(state.loop); });
          states.delete(element);
        } else if (refreshAll) surfaces.forEach(state => pending.add(state));
      });
      refreshAll = false;
      pending.forEach(update);
      pending.clear();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(flush); };
    const onState = (event: Event) => {
      const target = event.target;
      const related = (event as MouseEvent).relatedTarget;
      if (!(target instanceof Element)) return;
      states.forEach((surfaces, element) => {
        if ((element.contains(target) || target.contains(element)) && !(related instanceof Node && element.contains(related) && element.contains(target))) surfaces.forEach(state => pending.add(state));
      });
      schedule();
    };
    const onPreference = () => {
      states.forEach(surfaces => surfaces.forEach(state => {
        state.loopName = undefined;
        if (state.loop) stop(state.loop);
        state.loop = undefined;
      }));
      refreshAll = true;
      discoveryDirty = true;
      schedule();
    };
    const observer = new MutationObserver(records => {
      discoveryDirty = true;
      records.forEach(record => {
        if (!(record.target instanceof Element)) return;
        const target = record.target;
        states.forEach((surfaces, element) => {
          if (target.contains(element) || element.contains(target)) surfaces.forEach(state => pending.add(state));
        });
      });
      schedule();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "hidden", "aria-expanded", "disabled", "data-state", "data-nbh-hydrated"] });
    const events = ["pointerover", "pointerout", "pointerdown", "pointerup", "focusin", "focusout", "keydown", "keyup"];
    events.forEach(event => document.addEventListener(event, onState, true));
    reduced.addEventListener("change", onPreference);
    mobile.addEventListener("change", onPreference);
    window.addEventListener("resize", onPreference);
    discover();
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      events.forEach(event => document.removeEventListener(event, onState, true));
      reduced.removeEventListener("change", onPreference);
      mobile.removeEventListener("change", onPreference);
      window.removeEventListener("resize", onPreference);
      states.forEach(surfaces => surfaces.forEach(state => { state.transition.forEach(stop); if (state.loop) stop(state.loop); }));
    };
  }, []);
  return null;
}
