"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  reverse?: boolean;
  /** 像素速度(px/s)，越大越快 */
  pxPerSec?: number;
  /** 列宽（可以是 number 像素或 '100%'）*/
  width?: number | string;
};

type ReelStyle = CSSProperties & { "--travel"?: string };


export default function SideReel({ reverse, pxPerSec = 40, width = 220 }: Props) {
  const imgs = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `/reels/r${i + 1}.png`),
    []
  );
  const list = [...imgs, ...imgs];

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [travel, setTravel] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const recalc = () => {
    const track = trackRef.current;
    if (!track) return;
    // 用真实内容高度的一半作为一次滚动位移（像素）
    const half = track.scrollHeight / 2;
    const t = Math.max(1, Math.round(half));
    const d = Math.max(1, t / pxPerSec);
    setTravel(t);
    setDuration(d);
  };

  // 图片加载完成后再计算，避免高度为 0
  useEffect(() => {
    const el = trackRef.current;
    const imgsEl = Array.from(el?.querySelectorAll("img") ?? []);
    let left = imgsEl.length;

    const done = () => {
      left -= 1;
      if (left <= 0) recalc();
    };

    if (left === 0) recalc();
    imgsEl.forEach((img) => {
      if (img.complete) {
        done();
      } else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });

    // 尺寸变化时重算
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pxPerSec]);

  const animationDirection: CSSProperties["animationDirection"] =
    reverse ? "reverse" : "normal";

  const reelStyle: ReelStyle = {
    "--travel": `${travel}px`,
    animationDuration: `${duration}s`,
    animationDirection, // 已用精确类型
  };

  return (
    <aside
      className="side"
      style={{
        width,
        minWidth: typeof width === "number" ? `${width}px` : width, // 防止被 Grid 压缩
      }}
    >
      <div
        ref={trackRef}
        className="reelTrack"
        style={reelStyle}
      >
        {list.map((src, i) => (
          <div key={i} className="reelItem">
            <div className="reelCard">
              <img
                className="reelImg"
                src={src}
                alt={`reel ${i}`}
                loading="eager"
                decoding="async"
                // 关键：只按宽度缩放，高度自适应，绝不强制比例或固定高
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="sideMask" />
    </aside>
  );
}
