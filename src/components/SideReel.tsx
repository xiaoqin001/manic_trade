"use client";
import { useMemo } from "react";

type Props = {
  reverse?: boolean;
  speedSec?: number;          // 动画一轮时间
  width?: number | string;    // 列宽（像素或百分比）
};

export default function SideReel({ reverse, speedSec = 20, width = 220 }: Props) {
  const imgs = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `/reels/r${i + 1}.png`),
    []
  );
  const list = [...imgs, ...imgs]; // 加倍以实现无缝滚动

  return (
    <aside className="side" style={{ width }}>
      <div
        className="reelTrack"
        style={{
          animationDuration: `${speedSec}s`,
          animationDirection: (reverse ? "reverse" : "normal") as "reverse" | "normal",
        }}
      >
        {list.map((src, i) => (
          <div key={i} className="reelItem">
            <div className="reelCard">
              <img className="reelImg" src={src} alt={`reel ${i}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="sideMask" />
    </aside>
  );
}
