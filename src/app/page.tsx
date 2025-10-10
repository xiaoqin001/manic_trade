// 'use client';

// import { useEffect, useState } from 'react';
// import Overlay from "@/components/Overlay";
// import CenterBoard from "@/components/ChartCanvas";
// import SideReel from "@/components/SideReel";

// // 简单的媒体查询 hook，避免 SSR 水合不一致
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
//   if (isMobile === null) return null; // 首次挂载前不渲染，避免水合差异

//   return (
//     <main className="main">
//       <div className="container">
//         <div className="grid3">
//           {isMobile ? (
//             // ===== Mobile：仅两列 SideReel，充满屏幕宽度 =====
//             <>
//               {/* <SideReel speedSec={22} width="100%" />
//               <SideReel reverse speedSec={26} width="100%" /> */}
//               <SideReel pxPerSec={180} width="100%" />
//               <SideReel reverse pxPerSec={180} width="100%" />
//             </>
//           ) : (
//             // ===== Desktop：左右 SideReel + 中间 CenterBoard =====
//             <>
//               {/* <SideReel speedSec={22} width={180} /> */}
//               <SideReel pxPerSec={180} width={180} />
//               <div>
//                 <CenterBoard />
//               </div>
//               {/* <SideReel reverse speedSec={26} width={180} /> */}
//               <SideReel reverse pxPerSec={180} width={180} />
//             </>
//           )}
//         </div>
//       </div>

//       <Overlay mode="fullscreen" />
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

  // —— 手机端上划手势：向上滑超过一定阈值触发 Overlay —— //
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
      const dy = touchStartY.current - endY; // 上滑为正
      if (dy > 40) { // 阈值：上滑 40px
        setShowOverlay(true);
      }
      touchStartY.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile]);

  if (isMobile === null) return null;

  return (
    <main className="main">
      <div className="container">
        <div className="grid3">
          {isMobile ? (
            // ===== Mobile：去掉 SideReel，用顶部背景 + 仅左侧线图 =====
            <div className="mobileHero" ref={mobileHeroRef}>
              <div className="mobileChartOnlyLeft">
                {/* <CenterBoard bgColor="#100F17" hideRightPanel /> */}
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
            // ===== Desktop：左右 SideReel + 中间 CenterBoard（保持不变） =====
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

      {/* 仅在上划后显示 Overlay；桌面端继续按原来方式显示 */}
      {(showOverlay || !isMobile) && <Overlay mode="fullscreen" />}
    </main>
  );
}
