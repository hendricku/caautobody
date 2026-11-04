"use client";
import { useEffect, useRef, useState } from "react";

function LocalHomepageVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const visible = useRef(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let active = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const play = async () => {
      if (document.hidden || !visible.current || reducedMotion.matches) return;
      try { await element.play(); }
      catch {
        if (!active || document.hidden || !visible.current) return;
        element.muted = true;
        setMuted(true);
        await element.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting && entry.intersectionRatio >= .5;
      if (visible.current) void play(); else element.pause();
    }, { threshold: [.0, .5] });
    const visibility = () => { if (document.hidden) element.pause(); else void play(); };
    observer.observe(element);
    document.addEventListener("visibilitychange", visibility);
    return () => { active = false; observer.disconnect(); document.removeEventListener("visibilitychange", visibility); element.pause(); };
  }, []);
  return <div className="homepage-video"><video ref={video} src="/images/videocompressed.mp4" poster="/images/Chelsea-Auto-Body-009.webp" controls playsInline preload="metadata" onVolumeChange={(event) => setMuted(event.currentTarget.muted)} aria-label="CA Autobody workshop video" />{muted ? <span className="homepage-video__sound-note">Use the video controls to turn sound on</span> : null}</div>;
}

export default function HomepageVideo({ videoId }: { videoId: string }) {
  return videoId ? <YouTubeHomepageVideo videoId={videoId} /> : <LocalHomepageVideo />;
}

function YouTubeHomepageVideo({ videoId }: { videoId: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const visible = useRef(false);
  const ready = useRef(false);
  const [sound, setSound] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    const element = frame.current;
    if (!element || !origin) return;
    const target = "https://www.youtube-nocookie.com";
    const command = (name: string) => element.contentWindow?.postMessage(JSON.stringify({ event: "command", func: name, args: [] }), target);
    const autoplayAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting && entry.intersectionRatio >= .5;
      if (ready.current) command(visible.current && autoplayAllowed && !document.hidden ? "playVideo" : "pauseVideo");
    }, { threshold: .5 });
    const visibility = () => { if (ready.current) command(!document.hidden && visible.current && autoplayAllowed ? "playVideo" : "pauseVideo"); };
    const message = (event: MessageEvent) => {
      if (event.origin !== target || event.source !== element.contentWindow) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.event === "onReady") { ready.current = true; command(visible.current && autoplayAllowed && !document.hidden ? "playVideo" : "pauseVideo"); }
      } catch { /* Ignore unrelated player messages. */ }
    };
    observer.observe(element);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("message", message);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("message", message); ready.current = false; };
  }, [origin, videoId]);

  const toggleSound = () => {
    const player = frame.current?.contentWindow;
    const target = "https://www.youtube-nocookie.com";
    player?.postMessage(JSON.stringify({ event: "command", func: sound ? "mute" : "unMute", args: [] }), target);
    player?.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), target);
    setSound(!sound);
  };
  return <div className="homepage-video">
    {origin ? <iframe ref={frame} title="CA Autobody workshop video" src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&mute=1&playsinline=1&origin=${encodeURIComponent(origin)}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "homepage-video" }), "https://www.youtube-nocookie.com")} /> : null}
    <button type="button" onClick={toggleSound} aria-pressed={sound}>{sound ? "Mute video" : "Turn sound on"}</button>
  </div>;
}
