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

// page.tsx 片段（替换你现有的 mobile autoplay/useEffect 部分）
function useStableMobileVideoAutoplay(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    // —— 基本属性（先就位）——
    video.muted = true;
    video.playsInline = true;
    // @ts-expect-error: Safari-specific
    video.webkitPlaysInline = true;
    video.loop = true;
    video.preload = "metadata";
    video.removeAttribute("controls");
    // React 属性里同时设定会更稳：disableRemotePlayback
    // controlsList 已在 JSX 中设置

    let visible = false;
    let inViewport = false;
    let destroyed = false;
    let userPaused = false; // 防止用户点暂停时我们强行拉起来
    let retry = 0;
    const maxRetry = 6;

    const canPlay = () => video.readyState >= 2; // HAVE_CURRENT_DATA+

    const playAttempt = () => {
      if (destroyed || !visible || !inViewport || userPaused || !canPlay()) return;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // 指数退避重试
          if (retry < maxRetry && !destroyed && visible && inViewport && !userPaused) {
            const delay = Math.min(1600, 200 * Math.pow(2, retry++));
            setTimeout(playAttempt, delay);
          }
        });
      }
    };

    // 监听「用户显式暂停」
    const onUserPause = () => { userPaused = true; };
    const onUserPlay = () => { userPaused = false; };

    // 监听可播放/卡顿状态
    const onReady = () => { retry = 0; playAttempt(); };
    const onStalledOrWaiting = () => { retry = Math.max(1, retry); playAttempt(); };

    // 可见性
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) playAttempt();
    };

    // 进入/离开视口
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

    // 初始化一次
    visible = document.visibilityState === "visible";
    // 若 metadata 尚未就绪，等 onReady，再 playAttempt
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

  // const mobileHeroRef = useRef<HTMLDivElement | null>(null);

  useStableMobileVideoAutoplay(mobileVideoRef, !!isMobile);

  // useEffect(() => {
  //   if (!isMobile) return;
  //   const videoEl = mobileVideoRef.current;
  //   if (!videoEl) return;

  //   videoEl.muted = true;
  //   videoEl.playsInline = true;
  //   // @ts-expect-error:  Safari only property, not in standard HTMLVideoElement
  //   videoEl.webkitPlaysInline = true;
  //   videoEl.loop = true;
  //   videoEl.preload = "auto";
  //   videoEl.removeAttribute("controls");

  //   const attemptPlay = () => {
  //     const playPromise = videoEl.play();
  //     if (playPromise !== undefined) {
  //       playPromise.catch(() => {
  //         videoEl.muted = true;
  //         requestAnimationFrame(() => videoEl.play().catch(() => { }));
  //       });
  //     }
  //   };

  //   setTimeout(attemptPlay, 300);
  //   const onVisibility = () => {
  //     if (document.visibilityState === "visible") attemptPlay();
  //   };
  //   document.addEventListener("visibilitychange", onVisibility);
  //   return () => document.removeEventListener("visibilitychange", onVisibility);
  // }, [isMobile]);

  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // useEffect(() => {
  //   const video = document.createElement("video");
  //   video.src = "/game_demo.mp4";
  //   video.muted = true;
  //   video.playsInline = true;
  //   video.preload = "metadata"; // 新增
  //   video.load();
  //   video.addEventListener("loadeddata", () => {
  //     requestAnimationFrame(() => setPageReady(true));
  //   });
  //   video.addEventListener("error", () => {
  //     requestAnimationFrame(() => setPageReady(true));
  //   });
  // }, []);

  if (isMobile === null) return null;

  return (
    <>
      <main className={`main pageFade ${pageReady ? "visible" : ""}`}>
        <div className="container">
          <div className="grid3">
            {/* {isMobile ? (
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
              </div> */}
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
        <Overlay mode="fullscreen" />
      </main>
    </>
  );
}
