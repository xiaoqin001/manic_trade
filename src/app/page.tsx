'use client';

import { useEffect, useState } from 'react';
import Overlay from "@/components/Overlay";
import CenterBoard from "@/components/ChartCanvas";
import SideReel from "@/components/SideReel";

// 简单的媒体查询 hook，避免 SSR 水合不一致
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
  if (isMobile === null) return null; // 首次挂载前不渲染，避免水合差异

  return (
    <main className="main">
      <div className="container">
        <div className="grid3">
          {isMobile ? (
            // ===== Mobile：仅两列 SideReel，充满屏幕宽度 =====
            <>
              {/* <SideReel speedSec={22} width="100%" />
              <SideReel reverse speedSec={26} width="100%" /> */}
              <SideReel pxPerSec={180} width="100%" />
              <SideReel reverse pxPerSec={180} width="100%" />
            </>
          ) : (
            // ===== Desktop：左右 SideReel + 中间 CenterBoard =====
            <>
              {/* <SideReel speedSec={22} width={180} /> */}
              <SideReel pxPerSec={180} width={180} />
              <div>
                <CenterBoard />
              </div>
              {/* <SideReel reverse speedSec={26} width={180} /> */}
              <SideReel reverse pxPerSec={180} width={180} />
            </>
          )}
        </div>
      </div>

      <Overlay mode="fullscreen" />
    </main>
  );
}
