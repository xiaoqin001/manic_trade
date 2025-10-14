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


// "use client";
// import { useMemo, useEffect, useState } from "react";

// type Props = {
//   reverse?: boolean;
//   speedSec?: number;
//   width?: number | string;
// };

// export default function SideReel({ reverse, speedSec = 20, width = 220 }: Props) {
//   const imgs = useMemo(
//     () => Array.from({ length: 12 }, (_, i) => `/reels/r${i + 1}.png`),
//     []
//   );
//   const list = [...imgs, ...imgs];
//   const [animClass, setAnimClass] = useState("paused"); // 默认暂停

//   useEffect(() => {
//     // ✅ 延迟 0.8s 后强制重启动画
//     const timer = setTimeout(() => {
//       setAnimClass("animate-" + Date.now()); // 不断变化的类名 -> 触发重渲染 & 动画重启
//     }, 800);

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <aside className="side" style={{ width }}>
//       <div
//         key={animClass} // ✅ 每次类名变动强制 React 重新渲染 DOM
//         className="reelTrack"
//         style={{
//           animation: `reelMove ${speedSec}s linear infinite`,
//           animationDirection: reverse ? "reverse" : "normal",
//           willChange: "transform",
//           transform: "translateZ(0)",
//         }}
//       >
//         {list.map((src, i) => (
//           <div key={i} className="reelItem">
//             <div className="reelCard">
//               <img className="reelImg" src={src} alt={`reel ${i}`} />
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="sideMask" />
//     </aside>
//   );
// }
