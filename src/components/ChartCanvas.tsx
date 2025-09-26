"use client";
import { useEffect, useRef } from "react";

/** ===== 布局与网格 ===== */
const PANEL_W = 142.5;           // 右侧静态面板宽度（需与 .right_panel 一致）
const CHART_H = 494;             // 中间区域高度（需与 CSS 一致）
const V_COLS = 13;               // 纵向格子数量（整屏列数）
const TIME_PER_COL_SEC = 10;     // 每列代表的秒数
const H_FULL_CELLS = 4;          // 横向中间完整格数量（上下各半格）

/** ===== 右侧价格对齐/样式 ===== */
const CAPSULE_W = 96;            // 当前价格胶囊宽（更窄）
const CAPSULE_H = 24;            // 当前价格胶囊高

/** ===== 字体：时间/价格 ===== */
const TIME_FONT_SIZE = 9;
const TIME_FONT_WEIGHT = 600;    // Montserrat SemiBold
const TIME_FONT_FAMILY = "Montserrat, ui-monospace, SFMono-Regular, Menlo, monospace";

const PRICE_FONT_SIZE = 12;
const PRICE_FONT_FAMILY = "ui-monospace, SFMono-Regular, Menlo, monospace";



/** ===== 左上角时间 & 价格胶囊样式 ===== */
const TL_MARGIN_X = 16;           // 左边距
const TL_TIME_Y = 15;           // 时间文本 y
const BADGE_Y = 49;           // 胶囊中心 y
const BADGE_H = 28;           // 胶囊高度
const BADGE_R = BADGE_H / 2;  // 胶囊圆角
const BADGE_PAD_X = 14;           // 胶囊左右内边距
const BADGE_GAP = 12;           // “BTC” 与价格之间的间距
const BADGE_STROKE = "#FFFFFF";
const BADGE_FILL = "rgba(255, 255, 255, 0.12)";
const TIME_PADDING_TOP = 12; // 向下留 12px

const TIME_TZ_LABEL = "UTC+9";    // 文案
const TIME_TZ_NAME = "Asia/Tokyo"; // 用于格式化（东京=UTC+9）

/** 价格格式化：千分位 + 固定小数 */
function formatPrice(v: number, digits = 3) {
  const num = v.toFixed(digits);
  const [int, frac] = num.split(".");
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${intFmt}.${frac}`;
}

/** 时间格式化（UTC+9） */
function formatTimeUTC9(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: TIME_TZ_NAME,
  }) + ` ${TIME_TZ_LABEL}`;
}

/** 画一个胶囊矩形 */
function drawCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke: string) {
  const r = h / 2, l = x, t = y - h / 2, rgt = x + w, btm = y + h / 2;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(l + r, t);
  ctx.lineTo(rgt - r, t);
  ctx.arcTo(rgt, t, rgt, t + r, r);
  ctx.lineTo(rgt, btm - r);
  ctx.arcTo(rgt, btm, rgt - r, btm, r);
  ctx.lineTo(l + r, btm);
  ctx.arcTo(l, btm, l, btm - r, r);
  ctx.lineTo(l, t + r);
  ctx.arcTo(l, t, l + r, t, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** 小三角（下拉箭头） */
function drawTriangleDown(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color = "#FFF") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - s / 2, cy - s / 4);
  ctx.lineTo(cx + s / 2, cy - s / 4);
  ctx.lineTo(cx, cy + s / 4);
  ctx.closePath();
  ctx.fill();
}

/** ===== 数值显示量化步长（价格标签按 0.02 递进） ===== */
const PRICE_STEP = 0.02;

/** ===== 价格点类型 ===== */
type Pt = { t: number; v: number }; // t = 虚拟墙钟毫秒

/** ===== 行情生成参数（更稳、更小波动） ===== */
const CONFIG = {
  basePrice: 116200.13,
  sampleMs: 150,        // 采样更密
  pxPerSec: 100,
  nowXR: 0.62,

  // —— 降低真实波动 —— //
  noiseAmp: 0.005,       // ↓ 随机抖动很小
  driftStep: 0.0002,
  driftClamp: 0.0003,
  driftScale: 0.0005,

  meanRevertTo: 116200.0,
  meanRevertK: 0.15,    // ↑ 回归更强，跑不远

  volCycleSec: 18,
  volCycleMin: 0.9,     // 波动率范围更窄
  volCycleMax: 1.1,

  spikeProb: 0.001,     // 极少插针
  spikeAmp: 0.2,
  spikeDecay: 0.9,

  maxMovePerTick: 0.01,  // 单步变化更小

  // —— 视觉窗口：固定区间（默认 ±0.10 = 总 0.20）—— //
  yWindowMode: "fixed" as const,
  fixedYPad: 0.10,
  autoPadRatio: 0.12,   // fixed 模式下无效，仅保留字段
  priceLabelDigits: 2,  // 显示到 2 位（配合 step 0.02 恰好）
};

/** ===== EMA 平滑参数（越小越顺） ===== */
const EMA_ALPHA = 0.25;

/** 工具：按 0.02 量化一个值（四舍五入到最近的 0.02 倍数） */
const quantizeToStep = (v: number, step = PRICE_STEP) =>
  Math.round(v / step) * step;

/** ================= Chart ================= */
function ChartCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let running = true;

    // —— 统一时间：虚拟墙钟 —— //
    const perfStart = performance.now();
    const wallStart = Date.now();
    const nowMs = () => wallStart + (performance.now() - perfStart);

    // —— DPR & 尺寸 —— //
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    function resize() {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    // —— 纵向列数固定：根据列数与每列秒数，动态计算 pxPerSec —— //
    let pxPerSec = CONFIG.pxPerSec;
    function computePxPerSec() {
      const chartW = canvas.clientWidth - PANEL_W;
      const visibleSec = V_COLS * TIME_PER_COL_SEC;
      pxPerSec = chartW / visibleSec;
    }

    // —— 价格状态 —— //
    const points: Pt[] = [];
    let lastV = CONFIG.basePrice;
    let vEMA = lastV;               // EMA 平滑值
    let drift = 0;
    let spikeVel = 0;
    let yMin = CONFIG.meanRevertTo - CONFIG.fixedYPad;
    let yMax = CONFIG.meanRevertTo + CONFIG.fixedYPad;
    let acc = 0;
    let lastFramePerf = performance.now();

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const currentVolMultiplier = (perfNow: number) => {
      const phase = (perfNow / 1000 / CONFIG.volCycleSec) * Math.PI * 2;
      const s = (Math.sin(phase) + 1) / 2;
      return CONFIG.volCycleMin + (CONFIG.volCycleMax - CONFIG.volCycleMin) * s;
    };

    function synth(dtMs: number) {
      acc += dtMs;
      while (acc >= CONFIG.sampleMs) {
        acc -= CONFIG.sampleMs;
        const curNowMs = nowMs();

        drift += (Math.random() - 0.5) * CONFIG.driftStep;
        drift = clamp(drift, -CONFIG.driftClamp, CONFIG.driftClamp);

        const gaussian = (Math.random() - 0.5) + (Math.random() - 0.5);
        const vol = CONFIG.noiseAmp * currentVolMultiplier(performance.now());

        if (Math.random() < CONFIG.spikeProb) {
          spikeVel += (Math.random() < 0.5 ? -1 : 1) * CONFIG.spikeAmp;
        }
        spikeVel *= CONFIG.spikeDecay;

        const meanForce = CONFIG.meanRevertK * (CONFIG.meanRevertTo - lastV);

        let delta =
          lastV * (drift * CONFIG.driftScale) +
          gaussian * vol +
          meanForce +
          spikeVel;
        delta = clamp(delta, -CONFIG.maxMovePerTick, CONFIG.maxMovePerTick);
        lastV += delta;

        // EMA 平滑
        vEMA = vEMA * (1 - EMA_ALPHA) + lastV * EMA_ALPHA;

        // 用平滑值入列
        points.push({ t: curNowMs, v: vEMA });

        // 丢弃左侧超出
        const chartW = canvas.clientWidth - PANEL_W;
        const maxLeft = (chartW * CONFIG.nowXR) / pxPerSec * 1000 + 2000;
        const cutoff = curNowMs - maxLeft;
        while (points.length && points[0].t < cutoff) points.shift();

        // 纵轴窗口（固定）
        yMin = CONFIG.meanRevertTo - CONFIG.fixedYPad;
        yMax = CONFIG.meanRevertTo + CONFIG.fixedYPad;
      }
    }

    // —— 坐标映射（仅图表区域，不含右侧面板）—— //
    const yToPx = (v: number) => {
      const h = canvas.clientHeight;
      return h - ((v - yMin) / (yMax - yMin)) * h;
    };
    const tToPx = (tMs: number, nowMsVal: number) => {
      const chartW = canvas.clientWidth - PANEL_W;
      const nowX = chartW * CONFIG.nowXR;
      const dtSec = (nowMsVal - tMs) / 1000;
      return nowX - dtSec * pxPerSec;
    };

    /** Catmull–Rom → 贝塞尔：更圆滑的曲线 */
    function strokeSmoothLine(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      const t = 0.5; // 张力 0.4~0.6 自然
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) * (t / 6);
        const cp1y = p1.y + (p2.y - p0.y) * (t / 6);
        const cp2x = p2.x - (p3.x - p1.x) * (t / 6);
        const cp2y = p2.y - (p3.y - p1.y) * (t / 6);

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx.stroke();
    }

    // —— 网格 + 标签（格子随时间移动；价格标签量化到 0.02）—— //
    function drawGridAndLabels(nowMsVal: number) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const chartW = w - PANEL_W;

      // 保持列数
      computePxPerSec();

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.fillStyle = "rgba(255,255,255,0.75)";

      // 纵向格 + 时间（只改时间字体）
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `${TIME_FONT_WEIGHT} ${TIME_FONT_SIZE}px ${TIME_FONT_FAMILY}`;

      const stepMs = TIME_PER_COL_SEC * 1000;
      const baseTick = Math.floor(nowMsVal / stepMs) * stepMs;

      for (let t = baseTick; ; t -= stepMs) {
        const x = tToPx(t, nowMsVal);
        if (x < -60) break;
        ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke();
        if (x >= 8 && x <= chartW - 8) {
          const label = new Date(t).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
          ctx.fillText(label, x, h - 8);
        }
      }
      for (let t = baseTick + stepMs; ; t += stepMs) {
        const x = tToPx(t, nowMsVal);
        if (x > w + 60) break;
        ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke();
        if (x >= 8 && x <= chartW - 8) {
          const label = new Date(t).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
          ctx.fillText(label, x, h - 8);
        }
      }

      // 横向格 + 价格（与胶囊中心对齐，胶囊贴右；标签值量化到 0.02）
      const priceAnchorX = chartW - CAPSULE_W / 2;

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `normal ${PRICE_FONT_SIZE}px ${PRICE_FONT_FAMILY}`;

      const parts = H_FULL_CELLS + 1; // 5 条线（上下半格 + 中间4整格）
      for (let i = 0; i < parts; i++) {
        const frac = (i + 0.5) / parts;       // 0.5/5, 1.5/5, ... 4.5/5
        // 先按比例求值 → 再量化到 0.02 → 再把线画在量化后的值上（保证数值与线一致）
        const vRaw = yMax - (yMax - yMin) * frac;
        const vQ = quantizeToStep(vRaw, PRICE_STEP);
        const yy = Math.round(yToPx(vQ)) + 0.5;

        // 画横线
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        // 画价格标签（量化后，保留两位）
        ctx.fillText(vQ.toFixed(CONFIG.priceLabelDigits), priceAnchorX, yy - 2);
      }
    }

    /** 左上角：时间 + “BTC 价格”胶囊 */
    function drawTopLeftBadge(ctx: CanvasRenderingContext2D, lastMs: number, price: number) {
      // 时间
      ctx.font = `600 12px ${TIME_FONT_FAMILY}`;
      ctx.fillStyle = "#666666";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";


      ctx.fillText(formatTimeUTC9(lastMs), TL_MARGIN_X, TL_TIME_Y+TIME_PADDING_TOP);

      // 文字度量
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      // “BTC”
      ctx.font = `600 8px Montserrat, ${PRICE_FONT_FAMILY}`;
      const btcW = ctx.measureText("BTC").width;

      // 价格（与你现有的 priceLabelDigits 对齐）
      const priceText = formatPrice(price, CONFIG.priceLabelDigits);
      ctx.font = `800 14px Montserrat, ${PRICE_FONT_FAMILY}`;
      const priceW = ctx.measureText(priceText).width;

      // 箭头尺寸 & 额外内距
      const caretW = 10;

      // 胶囊宽度
      const badgeW = BADGE_PAD_X + btcW + BADGE_GAP + priceW + BADGE_GAP + caretW + BADGE_PAD_X;

      // 胶囊位置（贴左边距 TL_MARGIN_X）
      const badgeX = TL_MARGIN_X;
      const badgeY = BADGE_Y;

      // 绘制胶囊
      drawCapsule(ctx, badgeX, badgeY, badgeW, BADGE_H, BADGE_FILL, BADGE_STROKE);

      // 写入“BTC”
      let cursorX = badgeX + BADGE_PAD_X;
      ctx.font = `600 12px Montserrat, ${PRICE_FONT_FAMILY}`;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("BTC", cursorX, badgeY);

      // 价格
      cursorX += btcW + BADGE_GAP;
      ctx.font = `800 14px Montserrat, ${PRICE_FONT_FAMILY}`;
      ctx.fillText(priceText, cursorX, badgeY);

      // 箭头
      const caretX = badgeX + badgeW - BADGE_PAD_X - caretW / 2;
      drawTriangleDown(ctx, caretX, badgeY, caretW, "#FFFFFF");
    }


    function drawPrice(nowMsVal: number) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const chartW = w - PANEL_W;
      if (points.length < 2) return;

      // 视口内点 → 像素点
      const pix: { x: number; y: number }[] = [];
      for (const p of points) {
        const x = tToPx(p.t, nowMsVal);
        if (x < -20 || x > w + 20) continue;
        const y = yToPx(p.v);
        pix.push({ x, y });
      }
      if (pix.length < 2) return;

      // 曲线风格
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(90, 200, 250, 0.95)";
      ctx.shadowColor = "rgba(90, 200, 250, 0.25)";
      ctx.shadowBlur = 6;

      // 平滑曲线
      strokeSmoothLine(ctx, pix);

      // 复原阴影
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // 当前价
      const last = points[points.length - 1];
      const lastY = yToPx(last.v);
      // 当前价标签也量化到 0.02（显示看齐）
      const lastLabelV = quantizeToStep(last.v, PRICE_STEP);
      const label = `$${lastLabelV.toFixed(CONFIG.priceLabelDigits)}`;

      // 与价格刻度共用锚点；胶囊紧贴右缘
      const priceAnchorX = chartW - CAPSULE_W / 2;

      // 胶囊几何
      const boxW = CAPSULE_W;
      const boxH = CAPSULE_H;
      const radius = boxH / 2;
      const boxX = priceAnchorX - boxW / 2;
      const boxY = lastY - boxH / 2;

      // 胶囊背景
      ctx.fillStyle = "#E0E0E0";
      ctx.beginPath();
      ctx.moveTo(boxX + radius, boxY);
      ctx.lineTo(boxX + boxW - radius, boxY);
      ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + radius, radius);
      ctx.lineTo(boxX + boxW, boxY + boxH - radius);
      ctx.arcTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH, radius);
      ctx.lineTo(boxX + radius, boxY + boxH);
      ctx.arcTo(boxX, boxY + boxH, boxX, boxY + boxH - radius, radius);
      ctx.lineTo(boxX, boxY + radius);
      ctx.arcTo(boxX, boxY, boxX + radius, boxY, radius);
      ctx.closePath();
      ctx.fill();

      // 胶囊文字
      ctx.fillStyle = "#000";
      ctx.font = "600 12px Montserrat, ui-monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, priceAnchorX, boxY + boxH / 2);

      // 当前价水平虚线
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath(); ctx.moveTo(0, lastY); ctx.lineTo(w, lastY); ctx.stroke();
      ctx.setLineDash([]);

      // “现在线”
      const nowX = chartW * CONFIG.nowXR;
      ctx.strokeStyle = "rgba(80,160,255,0.65)";
      ctx.beginPath(); ctx.moveTo(nowX + 0.5, 0); ctx.lineTo(nowX + 0.5, h); ctx.stroke();

      // 当前价圆点
      ctx.beginPath(); ctx.arc(nowX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#5AC8FA"; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();

      drawTopLeftBadge(ctx, last.t, lastLabelV);

    }

    // —— 主循环 —— //
    function frame(tsPerf: number) {
      if (!running) return;
      const dt = tsPerf - lastFramePerf; lastFramePerf = tsPerf;
      synth(dt);
      const curNow = nowMs();
      drawGridAndLabels(curNow);
      drawPrice(curNow);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return () => { running = false; ro.disconnect(); };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="chartWrap"
      style={{ position: "relative", width: "100%", height: `${CHART_H}px` }}
    >
      <canvas ref={canvasRef} className="chartCanvas" />
      {/* 右侧静态面板：上/下/右贴边 */}
      <img
        src="/right_panel.png"
        alt=""
        className="right_panel"
        style={{
          position: "absolute",
          inset: "0 0 0 auto",
          width: `${PANEL_W}px`,
          height: "100%",
          objectFit: "fill",
          objectPosition: "right center",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/** ================= 包装成一个 Section（保持边框不透明、内容 60% 透明） ================= */
export default function CenterBoard() {
  return (
    <section className="card">
      <div className="cardContent">
        <div className="chartContainer">
          <ChartCanvas />
        </div>
      </div>
    </section>
  );
}
