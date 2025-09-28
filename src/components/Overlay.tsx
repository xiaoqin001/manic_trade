"use client";
import React from "react";
import { Montserrat } from "next/font/google";


type OverlayProps = {
  mode?: "fullscreen" | "hero";
};

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // 按需选择
});

export default function Overlay({ mode = "hero" }: OverlayProps) {
  const isFull = mode === "fullscreen";

  return (
    <section
      // className={`overlay ${isFull ? "fixed inset-0 z-[999]" : "relative"} `}
      // style={{
      //   display: "flex",
      //   alignItems: "center",
      //   justifyContent: "center",
      //   minHeight: isFull ? "100vh" : "80vh",
      // }}

      className={`overlay ${isFull ? "fixed inset-0 z-[999]" : "relative"}`}
      style={{
        display: "flex",
        flexDirection: "column",   // 上下布局
        alignItems: "center",      // 居中对齐
        justifyContent: "flex-start", // 顶部对齐
        minHeight: isFull ? "100vh" : "80vh",
        paddingTop: "80px",        // 控制整体距离顶部的位置
      }}
    >


      {/* 背景 */}
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

      {/* 左上角品牌 Logo */}
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

      {/* 右上角 Twitter 图标 */}
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

      {/* 中间内容 */}
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
            width: '400px'
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
            lineHeight: "100%", // 32px
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
            // onMouseEnter={(e) => {
            //   Object.assign((e.currentTarget as HTMLElement).style, {
            //     padding: "12px 21px",
            //     background: "#FFF",
            //     color: "#000", // hover时改成黑色文字更清晰
            //   });
            // }}
            // onMouseLeave={(e) => {
            //   Object.assign((e.currentTarget as HTMLElement).style, {
            //     padding: "12px 28px",
            //     background: "rgba(0, 0, 0, 0.40)",
            //     color: "#FFF",
            //   });
            // }}
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
            // onMouseEnter={(e) => {
            //   Object.assign((e.currentTarget as HTMLElement).style, {
            //     padding: "12px 21px",
            //     background: "#FFF",
            //     color: "#000", // hover时改成黑色文字更清晰
            //   });
            // }}
            // onMouseLeave={(e) => {
            //   Object.assign((e.currentTarget as HTMLElement).style, {
            //     padding: "12px 28px",
            //     background: "rgba(0, 0, 0, 0.40)",
            //     color: "#FFF",
            //   });
            // }}
          >
            Read Docs
          </a>
        </div>
      </div>

      {/* 底部 slogan + copyright */}
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
    </section>
  );
}
