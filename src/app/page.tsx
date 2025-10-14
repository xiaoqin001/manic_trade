// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import Overlay from "@/components/Overlay";
// import CenterBoard from "@/components/ChartCanvas";
// import SideReel from "@/components/SideReel";

// function useMediaQuery(query: string) {
//   const [matches, setMatches] = useState<boolean | null>(null);
//   useEffect(() => {
//     const mql = window.matchMedia(query);
//     const onChange = () => setMatches(mql.matches);
//     onChange();
//     mql.addEventListener('change', onChange);
//     return () => mql.removeEventListener('change', onChange);
//   }, [query]);
//   return matches;
// }

// export default function Page() {
//   const isMobile = useMediaQuery('(max-width: 900px)');
//   const [showOverlay, setShowOverlay] = useState(false);
//   const [pageReady, setPageReady] = useState(false);


//   // —— 手机端上划手势：向上滑超过一定阈值触发 Overlay —— //
//   const touchStartY = useRef<number | null>(null);
//   const mobileHeroRef = useRef<HTMLDivElement | null>(null);
//   useEffect(() => {
//   const imgs = [
//     "/game_demo.png",
//     "/background_mobile.png",
//     // 如果有其他关键图像，可继续添加
//   ];

//   Promise.all(
//     imgs.map(
//       (src) =>
//         new Promise((resolve) => {
//           const img = new Image();
//           img.src = src;
//           img.onload = resolve;
//           img.onerror = resolve; // 即使加载失败也继续
//         })
//     )
//   ).then(() => {
//     // 确保下一帧再触发过渡（避免layout闪烁）
//     requestAnimationFrame(() => setPageReady(true));
//   });
// }, []);

//   useEffect(() => {
//     if (!isMobile) return;
//     const el = mobileHeroRef.current;
//     if (!el) return;

//     const onTouchStart = (e: TouchEvent) => {
//       touchStartY.current = e.touches[0]?.clientY ?? null;
//     };
//     const onTouchEnd = (e: TouchEvent) => {
//       if (touchStartY.current == null) return;
//       const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
//       const dy = touchStartY.current - endY; // 上滑为正
//       if (dy > 40) { // 阈值：上滑 40px
//         setShowOverlay(true);
//       }
//       touchStartY.current = null;
//     };

//     el.addEventListener('touchstart', onTouchStart, { passive: true });
//     el.addEventListener('touchend', onTouchEnd, { passive: true });
//     return () => {
//       el.removeEventListener('touchstart', onTouchStart);
//       el.removeEventListener('touchend', onTouchEnd);
//     };
//   }, [isMobile]);

//   if (isMobile === null) return null;

//   return (
//     <main className="main">
//       <div className="container">
//         <div className="grid3">
//           {isMobile ? (
//             // ===== Mobile：去掉 SideReel，用顶部背景 + 仅左侧线图 =====
//             <div className="mobileHero" ref={mobileHeroRef}>
//               <div className="mobileChartOnlyLeft">
//                 {/* <CenterBoard bgColor="#100F17" hideRightPanel /> */}
//                 <CenterBoard bgColor="#100F17" hideRightPanel vCols={11} hCells={4} />
//               </div>
//               {!showOverlay && (
//                 <div className="swipeHint">
//                   <div className="swipeArrow" />
//                   <div>Swipe up</div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             // ===== Desktop：左右 SideReel + 中间 CenterBoard（保持不变） =====
//             <>
//               <SideReel speedSec={30} width={180} />
//               <div>
//                 <CenterBoard />
//               </div>
//               <SideReel reverse speedSec={30} width={180} />
//             </>
//           )}
//         </div>
//       </div>

//       {/* 仅在上划后显示 Overlay；桌面端继续按原来方式显示 */}
//       {(showOverlay || !isMobile) && <Overlay mode="fullscreen" />}
//     </main>
//   );
// }


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
  const [pageReady, setPageReady] = useState(false); // ✅ 新增

  // 手机端上划手势
  const touchStartY = useRef<number | null>(null);
  const mobileHeroRef = useRef<HTMLDivElement | null>(null);

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
    const imgs = [
      "/game_demo.png",
      "/background_mobile.png",
    ];

    Promise.all(
      imgs.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve;
          })
      )
    ).then(() => {
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
                <div className="mobileChartOnlyLeft">
                  <CenterBoard bgColor="#100F17" hideRightPanel vCols={11} hCells={4} />
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
