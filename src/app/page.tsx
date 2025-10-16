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
  const [showOverlay, setShowOverlay] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);

  const touchStartY = useRef<number | null>(null);
  const mobileHeroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = mobileHeroRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current == null) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
      const dy = touchStartY.current - endY;
      if (dy > 40) setShowOverlay(true);
      touchStartY.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile]);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/game_demo.mp4";
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata"; // 新增
    video.load();

    // 视频加载完 metadata 即可显示
    video.addEventListener("loadeddata", () => {
      requestAnimationFrame(() => setPageReady(true));
    });
    video.addEventListener("error", () => {
      // 即使加载失败也不要卡死
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
                  preload="metadata"
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
                {!showOverlay && (
                  <div className="swipeHint">
                    <div className="swipeArrow" />
                    <div>Swipe up</div>
                  </div>
                )}
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

        {(showOverlay || !isMobile) && <Overlay mode="fullscreen" />}
      </main>
    </>
  );
}
