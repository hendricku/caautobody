"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function FloatingControls({ playing, muted, onPlay, onMute, ready = true }: { playing: boolean; muted: boolean; onPlay: () => void; onMute: () => void; ready?: boolean }) {
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1020px)");
    const syncTarget = () => setPortalTarget(mobile.matches ? document.getElementById("homepage-audio-slot") || document.body : document.body);
    syncTarget();
    if (mobile.addEventListener) mobile.addEventListener("change", syncTarget);
    else mobile.addListener?.(syncTarget);
    return () => {
      if (mobile.removeEventListener) mobile.removeEventListener("change", syncTarget);
      else mobile.removeListener?.(syncTarget);
    };
  }, []);
  if (!portalTarget) return null;
  return createPortal(<div className="homepage-video-controls" onMouseEnter={() => { if (window.matchMedia("(hover: hover)").matches) setOpen(true); }} onMouseLeave={() => setOpen(false)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
    <button className="homepage-video-controls__trigger" type="button" aria-label="Workshop video controls" aria-expanded={open} aria-controls="homepage-audio-menu" onClick={() => setOpen((value) => !value)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4Z" />{muted ? <path d="m17 9 4 6m0-6-4 6" /> : <><path d="M17 9a4 4 0 0 1 0 6" /><path d="M19.5 6a8 8 0 0 1 0 12" /></>}</svg>
    </button>
    <div id="homepage-audio-menu" className="homepage-video-controls__menu" role="group" aria-label="Workshop video controls" hidden={!open}>
      <span>{ready ? "Workshop video" : "Loading video"}</span>
      <button type="button" onClick={onPlay} disabled={!ready}>{playing ? "Pause" : "Play"}</button>
      <button type="button" onClick={onMute} disabled={!ready}>{muted ? "Turn sound on" : "Mute"}</button>
      <button type="button" className="homepage-video-controls__close" aria-label="Close video controls" onClick={() => setOpen(false)}>&times;</button>
    </div>
  </div>, portalTarget);
}

function LocalHomepageVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const attempted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let active = true;
    const observer = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting && entry.intersectionRatio >= .5;
      if (!inView || attempted.current || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      attempted.current = true;
      void element.play().catch(async () => {
        if (!active) return;
        element.muted = true;
        setMuted(true);
        await element.play().catch(() => {});
      });
    }, { threshold: [0, .5] });
    observer.observe(element);
    return () => { active = false; observer.disconnect(); element.pause(); };
  }, []);
  return <div className="homepage-video"><video ref={video} src="/images/videocompressed.mp4" poster="/images/Chelsea-Auto-Body-009.webp" controls playsInline loop preload="metadata"
    onPlay={() => { attempted.current = true; setPlaying(true); }} onPause={() => setPlaying(false)}
    onVolumeChange={(event) => setMuted(event.currentTarget.muted)} aria-label="CA Autobody workshop video" />
    {muted ? <span className="homepage-video__sound-note">Use the video controls to turn sound on</span> : null}
    <FloatingControls playing={playing} muted={muted} onPlay={() => { const element = video.current; if (element) { if (element.paused) void element.play().catch(() => {}); else element.pause(); } }} onMute={() => { if (video.current) video.current.muted = !video.current.muted; }} />
  </div>;
}

export default function HomepageVideo({ videoId }: { videoId: string }) {
  return videoId ? <YouTubeHomepageVideo videoId={videoId} /> : <LocalHomepageVideo />;
}

function YouTubeHomepageVideo({ videoId }: { videoId: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const visibleRef = useRef(false);
  const ready = useRef(false);
  const attempted = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [origin, setOrigin] = useState("");
  const target = "https://www.youtube-nocookie.com";
  const command = (name: string) => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: name, args: [] }), target);

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    const element = frame.current;
    if (!element || !origin) return;
    const send = (name: string, args: unknown[] = []) => element.contentWindow?.postMessage(JSON.stringify({ event: "command", func: name, args }), target);
    const start = () => {
      if (!ready.current || attempted.current || !visibleRef.current || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      attempted.current = true;
      send("playVideo");
    };
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting && entry.intersectionRatio >= .5;
      start();
    }, { threshold: [0, .5] });
    const message = (event: MessageEvent) => {
      if (event.origin !== target || event.source !== element.contentWindow) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.event === "onReady") { ready.current = true; setPlayerReady(true); send("addEventListener", ["onStateChange"]); start(); }
        const state = data?.event === "onStateChange" ? data.info : data?.info?.playerState;
        if (state === 1) { attempted.current = true; setStarted(true); setPlaying(true); }
        if (state === 0 || state === 2) setPlaying(false);
      } catch { /* Ignore unrelated player messages. */ }
    };
    observer.observe(element);
    window.addEventListener("message", message);
    return () => { observer.disconnect(); window.removeEventListener("message", message); ready.current = false; };
  }, [origin, videoId]);

  const toggleSound = () => {
    command(sound ? "mute" : "unMute");
    if (!sound && !started) command("playVideo");
    setSound(!sound);
  };
  return <div className="homepage-video">
    {origin ? <iframe ref={frame} title="CA Autobody workshop video" src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&mute=1&playsinline=1&loop=1&playlist=${encodeURIComponent(videoId)}&origin=${encodeURIComponent(origin)}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "homepage-video" }), target)} /> : null}
    <button type="button" onClick={toggleSound} aria-pressed={sound}>{sound ? "Mute video" : "Turn sound on"}</button>
    <FloatingControls playing={playing} muted={!sound} ready={playerReady} onPlay={() => { attempted.current = true; command(playing ? "pauseVideo" : "playVideo"); }} onMute={toggleSound} />
  </div>;
}
