// "use client";
// import React from "react";
// import { Montserrat } from "next/font/google";


// type OverlayProps = {
//   mode?: "fullscreen" | "hero";
// };

// const montserrat = Montserrat({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"], // 按需选择
// });

// export default function Overlay({ mode = "hero" }: OverlayProps) {
//   const isFull = mode === "fullscreen";

//   return (
//     <section
//       className={`overlay ${isFull ? "fixed inset-0 z-[999]" : "relative"}`}
//       style={{
//         display: "flex",
//         flexDirection: "column",   // 上下布局
//         alignItems: "center",      // 居中对齐
//         justifyContent: "flex-start", // 顶部对齐
//         minHeight: isFull ? "100vh" : "80vh",
//         paddingTop: "80px",        // 控制整体距离顶部的位置
//       }}
//     >
//       {/* 背景 */}
//       {isFull && (
//         <div
//           className="overlayBg"
//           style={{
//             position: "absolute",
//             inset: 0,
//             background: `url("/background.png") center/cover no-repeat`,
//             pointerEvents: "none",
//           }}
//         />
//       )}

//       {/* 左上角品牌 Logo */}
//       <img
//         src="/logo.png"
//         alt="Logo"
//         style={{
//           position: "absolute",
//           top: 40,
//           left: 40,
//           height: 40,
//           width: "auto",
//           objectFit: "contain",
//           userSelect: "none",
//         }}
//       />

//       {/* 右上角 Twitter 图标 */}
//       <a
//         href="https://twitter.com/"
//         target="_blank"
//         rel="noopener noreferrer"
//         aria-label="Twitter"
//         style={{
//           position: "absolute",
//           top: 47,
//           right: 45,
//           display: "inline-flex",
//           alignItems: "center",
//           justifyContent: "center",
//           width: 25,
//           height: 25,
//         }}
//       >
//         <img
//           src="/twitter.png"
//           alt="Twitter"
//           style={{ width: 30, height: 30, objectFit: "contain" }}
//         />
//       </a>

//       {/* 中间内容 */}
//       <div
//         className="overlayInner"
//         style={{
//           position: "relative",
//           zIndex: 10,
//           textAlign: "center",
//           width: "100%",
//           maxWidth: "800px",
//           padding: "0 16px",
//         }}
//       >
//         <img
//           src="/logo.png"
//           alt="Logo"
//           className="heroLogo"
//           style={{
//             margin: "50px auto 80px",
//             height: "158px",
//             width: '400px'
//           }}
//         />

//         <h1
//           className={`heroTitle ${montserrat.className}`}
//           style={{
//             color: "#FFF",
//             textAlign: "center",
//             fontSize: "36px",
//             fontStyle: "normal",
//             fontWeight: 400,
//             lineHeight: "100%", // 32px
//             letterSpacing: "2px",
//             alignSelf: "stretch",
//             marginBottom: "48px",
//           }}
//         >
//           Hyper Casual Decentralized Exchange
//         </h1>

//         <div
//           className="heroBtns"
//           style={{ display: "flex", gap: "16px", justifyContent: "center" }}
//         >
//           <a
//             href="#"
//             className="btnPrimary"
//             style={{
//               display: "flex",
//               width: "225px",
//               height: "48px",
//               padding: "12px 28px",
//               justifyContent: "center",
//               alignItems: "center",
//               gap: "10px",
//               borderRadius: "12px",
//               border: "1px solid #FFF",
//               background: "#FFF",
//               boxShadow: "0 0 12px 0 rgba(255, 255, 255, 0.24)",
//               color: "#000",
//               fontWeight: 600,
//               fontSize: "20px",
//               textDecoration: "none",
//               transition: "all 0.2s ease",
//             }}
//           >
//             Join Waitlist
//           </a>
//           <a
//             href="#"
//             className="btnPrimary"
//             style={{
//               display: "flex",
//               width: "225px",
//               height: "48px",
//               padding: "12px 28px",
//               justifyContent: "center",
//               alignItems: "center",
//               gap: "10px",
//               borderRadius: "12px",
//               border: "1px solid #FFF",
//               background: "rgba(0, 0, 0, 0.40)",
//               boxShadow: "0 0 12px 0 rgba(255, 255, 255, 0.24)",
//               color: "#FFF",
//               fontWeight: 600,
//               fontSize: "20px",
//               textDecoration: "none",
//               transition: "all 0.2s ease",
//             }}
//           >
//             Read Docs
//           </a>
//         </div>
//       </div>

//       {/* 底部 slogan + copyright */}
//       <div
//         className="overlayFooter"
//         style={{
//           position: "absolute",
//           bottom: 24,
//           left: "50%",
//           transform: "translateX(-50%)",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           gap: "21px",
//           zIndex: 10,
//         }}
//       >
//         <img
//           src="/slogan.png"
//           alt="Slogan"
//           style={{ width: "240px", objectFit: "contain" }}
//         />
//         <img
//           src="/copyright.png"
//           alt="Copyright"
//           style={{ width: "160px", objectFit: "contain" }}
//         />
//       </div>
//     </section>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";
import CenterBoard from "@/components/ChartCanvas";

/** 媒体查询 hook：避免 SSR 水合不一致，仅客户端决定是否为 mobile */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

type OverlayProps = {
  mode?: "fullscreen" | "hero";
};

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Overlay({ mode = "hero" }: OverlayProps) {
  const isFull = mode === "fullscreen";
  const isMobile = useMediaQuery("(max-width: 900px)");

  // SSR 安全：首次挂载前不渲染，避免水合差异
  if (isMobile === null) return null;

  return (
    <section
      className={`overlay ${isFull ? "fixed inset-0 z-[999]" : "relative"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: isFull ? "100vh" : "80vh",
        paddingTop: "80px",
      }}
    >
      {/* 背景（保持不变） */}
      {isFull && (
        <div
          className="overlayBg"
          style={{
            position: "absolute",
            inset: 0,
            background: `url("/background.png") center/cover no-repeat`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 左上角品牌 Logo —— 仅 Web 端显示；Mobile 端移除 */}
      {!isMobile && (
        <div>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              height: 40,
              width: "auto",
              objectFit: "contain",
              userSelect: "none",
            }}
          />


          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            style={{
              position: "absolute",
              top: 47,
              right: 45,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 25,
              height: 25,
            }}
          >
            <img
              src="/twitter.png"
              alt="Twitter"
              style={{ width: 30, height: 30, objectFit: "contain" }}
            />
          </a>

          <div
            className="overlayInner"
            style={{
              position: "relative",
              zIndex: 10,
              textAlign: "center",
              width: "100%",
              maxWidth: "800px",
              padding: "0 16px",
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="heroLogo"
              style={{
                margin: "50px auto 80px",
                height: "158px",
                width: "400px",
              }}
            />

            <h1
              className={`heroTitle ${montserrat.className}`}
              style={{
                color: "#FFF",
                textAlign: "center",
                fontSize: "36px",
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "100%",
                letterSpacing: "2px",
                alignSelf: "stretch",
                marginBottom: "48px",
              }}
            >
              Hyper Casual Decentralized Exchange
            </h1>

            <div
              className="heroBtns"
              style={{ display: "flex", gap: "16px", justifyContent: "center" }}
            >
              <a
                href="#"
                className="btnPrimary"
                style={{
                  display: "flex",
                  width: "225px",
                  height: "48px",
                  padding: "12px 28px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  borderRadius: "12px",
                  border: "1px solid #FFF",
                  background: "#FFF",
                  boxShadow: "0 0 12px 0 rgba(255, 255, 255, 0.24)",
                  color: "#000",
                  fontWeight: 600,
                  fontSize: "20px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                Join Waitlist
              </a>
              <a
                href="#"
                className="btnPrimary"
                style={{
                  display: "flex",
                  width: "225px",
                  height: "48px",
                  padding: "12px 28px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  borderRadius: "12px",
                  border: "1px solid #FFF",
                  background: "rgba(0, 0, 0, 0.40)",
                  boxShadow: "0 0 12px 0 rgba(255, 255, 255, 0.24)",
                  color: "#FFF",
                  fontWeight: 600,
                  fontSize: "20px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                Read Docs
              </a>
            </div>
          </div>
          <div
            className="overlayFooter"
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "21px",
              zIndex: 10,
            }}
          >
            <img
              src="/slogan.png"
              alt="Slogan"
              style={{ width: "240px", objectFit: "contain" }}
            />
            <img
              src="/copyright.png"
              alt="Copyright"
              style={{ width: "160px", objectFit: "contain" }}
            />
          </div>
        </div>
      )}


      {/* ===== Mobile 端：在按钮与底部之间插入 CenterBoard ===== */}
      {isMobile && (
        <div>
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            style={{
              position: "absolute",
              top: 47,
              right: 18,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 17,
              height: 17,
            }}
          >
            <img
              src="/twitter.png"
              alt="Twitter"
              style={{ width: 17, height: 17, objectFit: "contain" }}
            />
          </a>

          <div
            className="overlayInner"
            style={{
              position: "relative",
              zIndex: 10,
              textAlign: "center",
              width: "100%",
              maxWidth: "800px",
              padding: "0 16px",
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="heroLogo"
              style={{
                margin: "24px auto 24px",
                height: "96px",
                width: "243px",
              }}
            />

            <h1
              className={`heroTitle ${montserrat.className}`}
              style={{
                color: "#FFF",
                textAlign: "center",
                fontSize: "24px",
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "100%",
                letterSpacing: "1.5px",
                alignSelf: "stretch",
                marginBottom: "36px",
              }}
            >
              Hyper Casual Decentralized Exchange
            </h1>

            <div
              className="heroBtns"
              style={{ display: "flex", gap: "24px", justifyContent: "center" }}
            >
              <a
                href="#"
                className="btnPrimary"
                style={{
                  display: "flex",
                  width: "358px",
                  height: "48px",
                  padding: "12px 28px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  borderRadius: "12px",
                  border: "1px solid #FFF",
                  background: "#FFF",
                  boxShadow: "0 0 12px 0 rgba(255, 255, 255, 0.24)",
                  color: "#000",
                  fontWeight: 600,
                  fontSize: "20px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                Join Waitlist
              </a>
              <a
                href="#"
                className="btnPrimary"
                style={{
                  display: "flex",
                  width: "358px",
                  height: "48px",
                  padding: "12px 28px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  borderRadius: "12px",
                  border: "1px solid #FFF",
                  background: "rgba(0, 0, 0, 0.40)",
                  boxShadow: "0 0 12px 0 rgba(255, 255, 255, 0.24)",
                  color: "#FFF",
                  fontWeight: 600,
                  fontSize: "20px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                Read Docs
              </a>
            </div>
          </div>

          <div
            className="overlayChartWrap fullBleed"
            style={{
              // width: "min(880px, 92vw)",
              // margin: "24px auto 12px",
              // padding: "0 0px",
              // zIndex: 10,

              margin: "24px 0 12px",
              padding: 0,
              zIndex: 10,
            }}
          >
            {/* 直接复用 CenterBoard（ChartCanvas） */}
            <div className="cbScaleBox" style={
              {
                ['--chartH' as any]: '494px',   // 基准高度（保持与组件内部一致）
                ['--cb-scale' as any]: '0.512', // = 253 / 494
                ['--cb-extra' as any]: '12px',  // ← 新增：底部安全区
              } as React.CSSProperties
            }>
              <div className="cbScaleInner">

                <CenterBoard
                  // heightPx={253}       // ← 调“高度”：数值（px）
                  // vCols={9}            // ← 调“纵向格子数量”（列数）
                  // hCells={4}           // ← 调“横向完整格数量”（决定横线条数 = hCells+1）
                  bgColor="#100F17"    // ← 调“背景颜色”
                />
              </div>
            </div>
          </div>
          <div
            className="overlayFooter"
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "21px",
              zIndex: 10,
            }}
          >
            <img
              src="/slogan.png"
              alt="Slogan"
              style={{ width: "192px", objectFit: "contain" }}
            />
            <img
              src="/copyright.png"
              alt="Copyright"
              style={{ width: "110px", objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      {/* 底部 slogan + copyright（保持不变） */}

    </section>
  );
}
