'use client';

import { useEffect, useRef, useState } from 'react';
import Overlay from "@/components/Overlay";
import CenterBoard from "@/components/ChartCanvas";
import SideReel from "@/components/SideReel";

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

export default function Page() {
  const isMobile = useMediaQuery('(max-width: 900px)');
  // const [showOverlay, setShowOverlay] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);

  // const touchStartY = useRef<number | null>(null);
  const mobileHeroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMobile) return;
    const videoEl = mobileVideoRef.current;
    if (!videoEl) return;

    videoEl.muted = true;
    videoEl.playsInline = true;
    // @ts-expect-error:  Safari only property, not in standard HTMLVideoElement
    videoEl.webkitPlaysInline = true;
    videoEl.loop = true;
    videoEl.preload = "auto";
    videoEl.removeAttribute("controls");

    const attemptPlay = () => {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          videoEl.muted = true;
          requestAnimationFrame(() => videoEl.play().catch(() => { }));
        });
      }
    };

    setTimeout(attemptPlay, 300);
    const onVisibility = () => {
      if (document.visibilityState === "visible") attemptPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isMobile]);

  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/game_demo.mp4";
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata"; // 新增
    video.load();
    video.addEventListener("loadeddata", () => {
      requestAnimationFrame(() => setPageReady(true));
    });
    video.addEventListener("error", () => {
      requestAnimationFrame(() => setPageReady(true));
    });
  }, []);

  if (isMobile === null) return null;

  return (
    <>
      <main className={`main pageFade ${pageReady ? "visible" : ""}`}>
        <div className="container">
          <div className="grid3">
            {isMobile ? (
              <div className="mobileHero" ref={mobileHeroRef}>
                <video
                  ref={mobileVideoRef}
                  className="mobileBgVideo"
                  src="/game_demo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  webkit-playsinline="true"
                  preload="auto"
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  onLoadedData={() => setPageReady(true)}
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
                {/* {!showOverlay && (
                  <div className="swipeHint">
                    <div className="swipeArrow" />
                    <div>Swipe up</div>
                  </div>
                )} */}
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
        <Overlay mode="fullscreen" />
      </main>
    </>
  );
}
