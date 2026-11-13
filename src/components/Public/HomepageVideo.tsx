"use client";
import { useEffect, useRef } from "react";

export default function HomepageVideo({ videoId }: { videoId: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const element = video.current || frame.current;
    if (!element) return;
    const pause = () => {
      if (video.current) video.current.pause();
      if (frame.current) frame.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        "https://www.youtube-nocookie.com",
      );
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) pause();
    }, { threshold: [0, 0.5] });
    const onVisibilityChange = () => { if (document.hidden) pause(); };
    observer.observe(element);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      pause();
    };
  }, [videoId]);

  return <div className="homepage-video">
    {videoId
      ? <iframe ref={frame} title="CA Autobody workshop video" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&playsinline=1`} allow="encrypted-media; picture-in-picture" allowFullScreen />
      : <video ref={video} src="/images/videocompressed.mp4" poster="/images/Chelsea-Auto-Body-009.webp" controls playsInline preload="metadata" aria-label="CA Autobody workshop video" />}
  </div>;
}
