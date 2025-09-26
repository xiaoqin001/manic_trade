"use client";
import { useMemo } from "react";

type Props = {
  reverse?: boolean;
  speedSec?: number;  // 动画一轮时间
  width?: number;     // 列宽（像素）
};

/**
 * 循环滚动列（使用 public/reels/r1.png ... r12.png）
 * 不依赖任何样式库，只用全局 CSS 类。
 */
export default function SideReel({ reverse, speedSec = 20, width = 220 }: Props) {
  const imgs = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `/reels/r${i + 1}.png`),
    []
  );
  const list = [...imgs, ...imgs]; // 加倍以实现无缝滚动

  return (
    <aside className="side hide-md" style={{ width }}>
      <div
        className="reelTrack"
        style={{
          animationDuration: `${speedSec}s`,
          animationDirection: reverse ? "reverse" as const : "normal"
        }}
      >
        {list.map((src, i) => (
          <div key={i} className="reelItem">
            <div className="reelCard">
              {/* 用原生 <img>，避免 Next Image 的域名/尺寸限制 */}
              <img className="reelImg" src={src} alt={`reel ${i}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="sideMask" />
    </aside>
  );
}
