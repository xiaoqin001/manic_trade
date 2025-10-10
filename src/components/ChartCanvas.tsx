"use client";
import { useEffect, useRef, useState } from "react";

type ChartProps = {
  heightPx?: number;   // 高度（仅 mobile 用）
  vCols?: number;      // 纵向格子（列）数量
  hCells?: number;     // 横向“完整格”数量（决定横线数量）
  bgColor?: string;    // 卡片内容背景色（只改 Overlay 的 mobile）
};

/** ===== 布局与网格 ===== */
const PANEL_W = 142.5;           // 右侧静态面板“初始估计宽度”（实际用动态 panelW 替代）
const CHART_H = 494;             // 中间区域高度（需与 CSS 一致）
const V_COLS = 13;               // 纵向格子数量（整屏列数）
const TIME_PER_COL_SEC = 10;     // 每列代表的秒数
const H_FULL_CELLS = 4;          // 横向中间完整格数量（上下各半格）

/** ===== 右侧价格对齐/样式 ===== */
const CAPSULE_W = 85;            // 当前价格胶囊宽（更窄）
const CAPSULE_H = 18;            // 当前价格胶囊高

/** ===== 字体：时间/价格 ===== */
const TIME_FONT_SIZE = 9;
const TIME_FONT_WEIGHT = 600;    // Montserrat SemiBold
const TIME_FONT_FAMILY = "Montserrat, ui-monospace, SFMono-Regular, Menlo, monospace";

const PRICE_FONT_SIZE = 10;
const PRICE_FONT_FAMILY = "Montserrat, ui-monospace, SFMono-Regular, Menlo, monospace";


/** 价格格式化：千分位 + 固定小数 */
function formatPrice(v: number, digits = 3) {
  const num = v.toFixed(digits);
  const [int, frac] = num.split(".");
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${intFmt}.${frac}`;
}

/** ===== 数值显示量化步长（价格标签按 0.02 递进） ===== */
const PRICE_STEP = 0.02;

/** ===== 价格点类型 ===== */
type Pt = { t: number; v: number }; // t = 虚拟墙钟毫秒

/** ===== 行情生成参数（更稳、更小波动） ===== */
const CONFIG = {
  basePrice: 116200,
  sampleMs: 200,        // 采样更密
  pxPerSec: 100,
  nowXR: 0.62,

  // —— 降低真实波动 —— //
  noiseAmp: 0.005,       // ↓ 随机抖动很小
  driftStep: 0.0002,
  driftClamp: 0.0003,
  driftScale: 0.0005,

  meanRevertTo: 116200.0,
  meanRevertK: 0.35,    // ↑ 回归更强，跑不远

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
function ChartCanvas({ heightPx, vCols, hCells }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const AUTO_TRIGGER_MS = 5000;
  const autoTriggeredRef = useRef(false);

  // ★ 右侧 demo 图：动态实际宽度
  const panelImgRef = useRef<HTMLImageElement | null>(null);
  const [panelW, setPanelW] = useState<number>(PANEL_W);

  const VCOLS = vCols ?? V_COLS;
  const HCELLS = hCells ?? H_FULL_CELLS;


  // --- Long 标记：固定在触发瞬间的“数据点”（时间t, 价格v）---
  const longMarkRef = useRef<{ t: number; v: number } | null>(null);


  const FIRST_TRIGGER_MS = 5000;
  const SWITCH_EVERY_MS = 5000;
  const nextTriggerAtRef = useRef<number>(FIRST_TRIGGER_MS);
  const modeRef = useRef<"long" | "short">("long");

  // 用 (t,v) 锁定触发时的数据点（不是屏幕坐标）
  type Mark = { t: number; v: number; kind: "long" | "short" };
  const markRef = useRef<Mark | null>(null);

  // 每帧记录“当前价”的数据点（t 与 v）
  const lastTRef = useRef<number>(0);
  const lastVRef = useRef<number>(0);



  // 画一个指向( tipX, tipY ) 的右指三角箭头（绿色）
  function drawUpArrow(ctx: CanvasRenderingContext2D, tipX: number, tipY: number) {
    const w = 12;   // 箭头底宽
    const h = 10;   // 箭头高
    ctx.fillStyle = "#2BB20A";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);                  // 这一点就是尖端，对齐价格点
    ctx.lineTo(tipX - w / 2, tipY + h);      // 左底角
    ctx.lineTo(tipX + w / 2, tipY + h);      // 右底角
    ctx.closePath();
    ctx.fill();
  }


  function drawDownArrow(ctx: CanvasRenderingContext2D, tipX: number, tipY: number) {
    const w = 12, h = 10;
    ctx.fillStyle = "#6D242F";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);                // 尖端=价格点/渐变边界
    ctx.lineTo(tipX - w / 2, tipY - h);    // 底边
    ctx.lineTo(tipX + w / 2, tipY - h);
    ctx.closePath();
    ctx.fill();
  }

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

    // ★ 动态测量右侧图片宽度
    const measurePanelWidth = () => {
      const w = panelImgRef.current?.clientWidth ?? 0;
      const next = Math.max(0, Math.round(w));
      if (Math.abs(next - panelW) > 0) {
        setPanelW(next);
      }
    };

    function resize() {
      // 先量 panel 宽，避免先绘制再跳动
      measurePanelWidth();

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
      const chartW = canvas.clientWidth - panelW; // ★ 用动态 panelW
      const visibleSec = VCOLS * TIME_PER_COL_SEC;
      pxPerSec = chartW > 0 ? chartW / visibleSec : CONFIG.pxPerSec;
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
        const chartW = canvas.clientWidth - panelW; // ★
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
      const chartW = canvas.clientWidth - panelW; // ★
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
      const chartW = w - panelW; // ★

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
          const label = new Date(t).toLocaleTimeString(undefined, {
            hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"
          });
          ctx.fillText(label, x, h - 8);
        }
      }
      for (let t = baseTick + stepMs; ; t += stepMs) {
        const x = tToPx(t, nowMsVal);
        if (x > w + 60) break;
        ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke();
        if (x >= 8 && x <= chartW - 8) {
          const label = new Date(t).toLocaleTimeString(undefined, {
            hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"
          });
          ctx.fillText(label, x, h - 8);
        }
      }

      // 横向格 + 价格（与胶囊中心对齐，胶囊贴右；标签值量化到 0.02）
      const priceAnchorX = chartW - CAPSULE_W / 2; // ★

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `normal ${PRICE_FONT_SIZE}px ${PRICE_FONT_FAMILY}`;

      const parts = HCELLS + 1; // 5 条线（上下半格 + 中间4整格）
      for (let i = 0; i < parts; i++) {
        const frac = (i + 0.5) / parts;       // 0.5/5, 1.5/5, ... 4.5/5
        // 先按比例求值 → 再量化到 0.02 → 再把线画在量化后的值上（保证数值与线一致）
        const vRaw = yMax - (yMax - yMin) * frac;
        const vQ = quantizeToStep(vRaw, PRICE_STEP);
        const yy = Math.round(yToPx(vQ)) + 0.5;

        // 画横线
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        // 画价格标签（量化后，保留两位/格式化千分位）
        ctx.fillText(formatPrice(vQ, CONFIG.priceLabelDigits), priceAnchorX, yy - 2);
      }
    }

    function drawPrice(nowMsVal: number) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const chartW = w - panelW; // ★
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
      ctx.strokeStyle = "#5FC5FF";
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
      const priceAnchorX = chartW - CAPSULE_W / 2; // ★

      // 胶囊几何
      const boxW = CAPSULE_W;
      const boxH = CAPSULE_H;
      const radius = boxH / 2;
      const boxX = priceAnchorX - boxW / 2;
      const boxY = lastY - boxH / 2;


      // 当前价水平实线
      ctx.strokeStyle = "#2BB20A";
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(w, lastY);
      ctx.stroke();

      // 胶囊背景
      ctx.fillStyle = "#2BB20A";
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



      // “现在线”
      const nowX = chartW * CONFIG.nowXR;

      lastTRef.current = last.t;
      lastVRef.current = last.v;


      // nowXRef.current = nowX;
      // lastYRef.current = lastY;

      ctx.strokeStyle = "#FFF614";
      ctx.beginPath(); ctx.moveTo(nowX + 0.5, 0); ctx.lineTo(nowX + 0.5, h); ctx.stroke();

      // 光晕（先画在底层）
      ctx.beginPath();
      ctx.arc(nowX, lastY, 18, 0, Math.PI * 2);         // 光晕半径可调 16~24
      ctx.fillStyle = "rgba(95,197,255,0.24)";          // #5FC5FF3D
      ctx.fill();

      // 当前价圆点
      ctx.beginPath(); ctx.arc(nowX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#5AC8FA"; ctx.fill();
      ctx.strokeStyle = "#5FC5FF"; ctx.lineWidth = 1; ctx.stroke();

      // 左上角时间 + BTC 胶囊
      // drawTopLeftBadge(ctx, last.t, lastLabelV);

      const m = markRef.current;
      if (m) {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        const chartW = w - panelW;
        const markX = tToPx(m.t, nowMsVal);
        const markY = yToPx(m.v);

        if (m.kind === "long") {
          // 向上渐变：#2BB20A33(≈24%) -> #73737300(0%)
          const grad = ctx.createLinearGradient(0, markY, 0, 0);
          grad.addColorStop(0, "rgba(43,178,10,0.24)");  // #2BB20A33
          grad.addColorStop(1, "rgba(115,115,115,0.0)"); // #73737300
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, chartW, markY);

          drawUpArrow(ctx, markX, markY);               // 上箭头，尖端=markY
        } else {
          // 向下渐变：#6D242F3D(≈24%) -> #73737300(0%)
          const grad = ctx.createLinearGradient(0, markY, 0, h);
          grad.addColorStop(0, "rgba(175, 60, 77, 0.24)"); // #6D242F3D
          grad.addColorStop(1, "rgba(115,115,115,0.0)"); // #73737300
          ctx.fillStyle = grad;
          ctx.fillRect(0, markY, chartW, h - markY);

          drawDownArrow(ctx, markX, markY);             // 下箭头，尖端=markY
        }
      }

    }

    // —— 主循环 —— //
    function frame(tsPerf: number) {
      if (!running) return;
      const dt = tsPerf - lastFramePerf;
      lastFramePerf = tsPerf;
      synth(dt);
      const curNow = nowMs();
      drawGridAndLabels(curNow);
      drawPrice(curNow);

      const elapsed = performance.now() - perfStart;
      if (elapsed >= nextTriggerAtRef.current) {
        const t = lastTRef.current;
        const v = lastVRef.current;
        if (t && v) {
          markRef.current = { t, v, kind: modeRef.current };
          // 下一次触发时间 & 模式切换
          nextTriggerAtRef.current += SWITCH_EVERY_MS;
          modeRef.current = modeRef.current === "long" ? "short" : "long";
        } else {
          // 如果此帧还没拿到点，下一帧再试（避免空读）
          nextTriggerAtRef.current = elapsed + 100;
        }
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // ★ 右图加载/错误后重新测量并 resize
    const img = panelImgRef.current;
    const onImgLoadOrErr = () => { measurePanelWidth(); resize(); };
    if (img) {
      if (img.complete) onImgLoadOrErr();
      else {
        img.addEventListener("load", onImgLoadOrErr, { once: true });
        img.addEventListener("error", onImgLoadOrErr, { once: true });
      }
    }

    // 视口变化兜底
    const onWinResize = () => resize();
    window.addEventListener("resize", onWinResize);

    return () => {
      running = false;
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      if (img) {
        img.removeEventListener("load", onImgLoadOrErr);
        img.removeEventListener("error", onImgLoadOrErr);
      }
    };
  }, [panelW, vCols, hCells]); // ★ 依赖 panelW：图片宽度变化会重建尺寸/pxPerSec/重绘

  return (
    <div
      ref={wrapRef}
      className="chartWrap"
      style={{
        position: "relative",
        width: "100%",
        height: heightPx
          ? `${heightPx}px`
          : `var(--chartH, ${CHART_H}px)`,
      }}
    >
      <canvas ref={canvasRef} className="chartCanvas" />

      {/* 右侧静态面板：高 = chart 高；宽自动，保持比例；实际占位宽度由浏览器计算 */}
      <img
        ref={panelImgRef}
        src="/game_demo.png"
        alt=""
        className="right_panel"
        style={{
          position: "absolute",
          inset: "0 0 0 auto",
          height: "100%",     // 高度与 chart 一致
          width: "auto",      // 宽度按比例自适应
          objectFit: "contain",
          objectPosition: "right center",
          pointerEvents: "none",
          zIndex: 2,
          borderLeft: "1px solid #FFFFFF",
          // 如需限制最大宽度，可开启：
          // maxWidth: "260px",
        }}
      />
    </div>
  );
}

/** ================= 包装成一个 Section（保持边框不透明、内容 60% 透明） ================= */
export default function CenterBoard(props: ChartProps) {
  return (
    <section className="card">
      <div className="cardContent" style={{ background: props.bgColor }}>
        <div className="chartContainer" >
          <ChartCanvas {...props} />
        </div>
      </div>
    </section>
  );
}
