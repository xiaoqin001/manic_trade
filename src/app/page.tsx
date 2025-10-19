'use client';

import { useEffect, useRef, useState } from 'react';
import Overlay from "@/components/Overlay";
import CenterBoard from "@/components/ChartCanvas";
import SideReel from "@/components/SideReel";
import Image from "next/image";
import hideIcon from "/public/hide.png";
import showIcon from "/public/show.png";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function useStableMobileVideoAutoplay(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    // @ts-expect-error: Safari-specific
    video.webkitPlaysInline = true;
    video.loop = true;
    video.preload = "metadata";
    video.removeAttribute("controls");

    let visible = false;
    let inViewport = false;
    let destroyed = false;
    let userPaused = false;
    let retry = 0;
    const maxRetry = 6;

    const canPlay = () => video.readyState >= 2;

    const playAttempt = () => {
      if (destroyed || !visible || !inViewport || userPaused || !canPlay()) return;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          if (retry < maxRetry && !destroyed && visible && inViewport && !userPaused) {
            const delay = Math.min(1600, 200 * Math.pow(2, retry++));
            setTimeout(playAttempt, delay);
          }
        });
      }
    };

    const onUserPause = () => { userPaused = true; };
    const onUserPlay = () => { userPaused = false; };

    const onReady = () => { retry = 0; playAttempt(); };
    const onStalledOrWaiting = () => { retry = Math.max(1, retry); playAttempt(); };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) playAttempt();
    };

    const io = new IntersectionObserver((ents) => {
      for (const e of ents) {
        if (e.target === video) {
          inViewport = e.isIntersecting && e.intersectionRatio >= 0.25;
          if (inViewport) playAttempt();
        }
      }
    }, { threshold: [0, 0.25, 0.5] });
    io.observe(video);

    video.addEventListener("pause", onUserPause);
    video.addEventListener("play", onUserPlay);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("canplaythrough", onReady);
    video.addEventListener("stalled", onStalledOrWaiting);
    video.addEventListener("waiting", onStalledOrWaiting);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("orientationchange", onVisibility);
    window.addEventListener("resize", onVisibility);

    visible = document.visibilityState === "visible";
    if (canPlay()) playAttempt();

    return () => {
      destroyed = true;
      io.disconnect();
      video.removeEventListener("pause", onUserPause);
      video.removeEventListener("play", onUserPlay);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("stalled", onStalledOrWaiting);
      video.removeEventListener("waiting", onStalledOrWaiting);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("orientationchange", onVisibility);
      window.removeEventListener("resize", onVisibility);
    };
  }, [videoRef, enabled]);
}


export default function Page() {
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [pageReady, setPageReady] = useState(false);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);

  // const mobileHeroRef = useRef<HTMLDivElement | null>(null);

  useStableMobileVideoAutoplay(mobileVideoRef, !!isMobile);

  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 1200);
    return () => clearTimeout(t);
  }, []);


  if (isMobile === null) return null;

  return (
    <>
      {isMobile && (
        <button
          className="overlayToggleBtn"
          onClick={() => setOverlayVisible((v) => !v)}
        >
          <Image
            src={overlayVisible ? hideIcon : showIcon}
            alt={overlayVisible ? "Hide Overlay" : "Show Overlay"}
            className="overlayToggleIcon"
            width={65}
            height={65}
            priority
          />
        </button>
      )}
      <main className={`main pageFade ${pageReady ? "visible" : ""}`}>
        <div className="container">
          <div className="grid3">

            {isMobile ? (
              <div className="mobileHero">
                <video
                  ref={mobileVideoRef}
                  className="mobileBgVideo"
                  // 关键：metadata，交给 hook 来调度 play()
                  preload="metadata"
                  autoPlay // 仍然保留，满足支持场景
                  loop
                  muted
                  playsInline
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore: Safari-specific attribute
                  webkit-playsinline="true"
                  disableRemotePlayback
                  controlsList="nodownload nofullscreen noremoteplayback"
                  onLoadedData={() => setPageReady(true)}
                  src="/game_demo.mp4"
                />
                <div className="mobileChartOnlyLeft">
                  <CenterBoard
                    bgColor="#100F17"
                    hideRightPanel={true}
                    vCols={11}
                    hCells={4}
                    externalVideoRef={mobileVideoRef}
                  />
                </div>
              </div>
            ) : (
              <>
                <SideReel speedSec={30} width={180} />
                <div>
                  <CenterBoard />
                </div>
                <SideReel reverse speedSec={30} width={180} />
              </>
            )}
          </div>
        </div>
        {overlayVisible && <Overlay mode="fullscreen" />}
      </main>
    </>
  );
}
