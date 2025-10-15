// "use client";
// import { useMemo } from "react";

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

//   return (
//     <aside className="side" style={{ width }}>
//       <div
//         className="reelTrack"
//         style={{
//           animationDuration: `${speedSec}s`,
//           animationDirection: (reverse ? "reverse" : "normal") as "reverse" | "normal",
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

"use client";
import { useMemo, useEffect, useState } from "react";

type Props = {
  reverse?: boolean;
  speedSec?: number;
  width?: number | string;
};

export default function SideReel({ reverse, speedSec = 20, width = 220 }: Props) {
  const imgs = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `/reels/r${i + 1}.png`),
    []
  );
  const list = [...imgs, ...imgs];
  const [animClass, setAnimClass] = useState("paused"); // 默认暂停

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimClass("animate-" + Date.now());
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <aside className="side" style={{ width }}>
      <div
        key={animClass}
        className="reelTrack"
        style={{
          animation: `reel-scroll ${speedSec}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
          willChange: "transform",
          transform: "translateZ(0)",
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
