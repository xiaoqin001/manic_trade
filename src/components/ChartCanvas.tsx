"use client";
import { useEffect, useRef, useState } from "react";

type ChartProps = {
  heightPx?: number;
  vCols?: number;
  hCells?: number;
  bgColor?: string;
  hideRightPanel?: boolean;
};

const PANEL_W = 142.5;
const CHART_H = 494;
const V_COLS = 13;
const TIME_PER_COL_SEC = 10;
const H_FULL_CELLS = 4;

const CAPSULE_W = 85;
const CAPSULE_H = 18;

const TIME_FONT_SIZE = 9;
const TIME_FONT_WEIGHT = 600;
const TIME_FONT_FAMILY = "Montserrat, ui-monospace, SFMono-Regular, Menlo, monospace";

const PRICE_FONT_SIZE = 10;
const PRICE_FONT_FAMILY = "Montserrat, ui-monospace, SFMono-Regular, Menlo, monospace";

function formatPrice(v: number, digits = 3) {
  const num = v.toFixed(digits);
  const [int, frac] = num.split(".");
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${intFmt}.${frac}`;
}

const PRICE_STEP = 0.02;

type Pt = { t: number; v: number };

const CONFIG = {
  basePrice: 116200,
  sampleMs: 200,
  pxPerSec: 100,
  nowXR: 0.62,
  noiseAmp: 0.005,
  driftStep: 0.0002,
  driftClamp: 0.0003,
  driftScale: 0.0005,
  meanRevertTo: 116200.0,
  meanRevertK: 0.35,
  volCycleSec: 18,
  volCycleMin: 0.9,
  volCycleMax: 1.1,
  spikeProb: 0.001,
  spikeAmp: 0.2,
  spikeDecay: 0.9,
  maxMovePerTick: 0.01,
  yWindowMode: "fixed" as const,
  fixedYPad: 0.10,
  autoPadRatio: 0.12,
  priceLabelDigits: 2,
};

const EMA_ALPHA = 0.25;

const quantizeToStep = (v: number, step = PRICE_STEP) =>
  Math.round(v / step) * step;

function ChartCanvas({ heightPx, vCols, hCells, hideRightPanel }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const panelRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [panelW, setPanelW] = useState<number>(PANEL_W);

  const VCOLS = vCols ?? V_COLS;
  const HCELLS = hCells ?? H_FULL_CELLS;

  // const STAGES = ["long", "none", "short", "none"] as const;
  // type Stage = (typeof STAGES)[number];

  // const DURATIONS: Record<Stage, number> = {
  //   long: 5000,
  //   short: 5000,
  //   none: 2000,
  // };

  // 视频同步控制
  const modeRef = useRef<"none" | "long" | "short">("none");
  const marksRef = useRef<{ t: number; v: number; kind: "long" | "short" }[]>([]);
  const lastTRef = useRef<number>(0);
  const lastVRef = useRef<number>(0);
  const prevVideoTimeRef = useRef(0);


  // 根据视频时间表设定触发时刻（单位：秒）
  const triggerTimeline = [
    { start: 0.132, kind: "short" },
    { start: 0.528, kind: "long" },
    { start: 0.924, kind: "short" },
    { start: 1.353, kind: "long" },
    { start: 1.716, kind: "short" },
    { start: 2.145, kind: "long" },
    { start: 2.574, kind: "short" },
    { start: 3.696, kind: "long" },
    { start: 4.62, kind: "short" },
    { start: 4.851, kind: "long" },
    { start: 5.61, kind: "long" },
    { start: 6.402, kind: "short" },
    { start: 6.732, kind: "long" },
    { start: 7.458, kind: "short" },
    { start: 8.745, kind: "long" },
    { start: 9.174, kind: "short" },
    { start: 9.6, kind: "long" },
  ];

  type Mark = { t: number; v: number; kind: "long" | "short" };

  const measurePanelWidth = () => {
    const w = panelRef.current?.clientWidth ?? 0;
    const next = Math.max(0, Math.round(w));
    if (Math.abs(next - panelW) > 0) {
      setPanelW(next);
    }
  };

  function drawUpArrow(ctx: CanvasRenderingContext2D, tipX: number, tipY: number) {
    const w = 12, h = 10;
    ctx.fillStyle = "#2BB20A";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - w / 2, tipY + h);
    ctx.lineTo(tipX + w / 2, tipY + h);
    ctx.closePath();
    ctx.fill();
  }
  function drawDownArrow(ctx: CanvasRenderingContext2D, tipX: number, tipY: number) {
    const w = 12, h = 10;
    ctx.fillStyle = "#C82F2F";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - w / 2, tipY - h);
    ctx.lineTo(tipX + w / 2, tipY - h);
    ctx.closePath();
    ctx.fill();
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let running = true;

    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 0.4s ease";

    const perfStart = performance.now();
    const wallStart = Date.now();
    const nowMs = () => wallStart + (performance.now() - perfStart);

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    function resize() {
      measurePanelWidth();
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const prepareAndStart = async () => {
      const vid = panelRef.current;
      const onVidReady = () => { measurePanelWidth(); resize(); };
      if (vid) {
        vid.addEventListener("loadeddata", onVidReady, { once: true });
      }

      await new Promise((r) => requestAnimationFrame(() => r(null)));
      resize();
      canvas.style.opacity = "1";
      requestAnimationFrame(frame);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    let pxPerSec = CONFIG.pxPerSec;
    function computePxPerSec() {
      const chartW = canvas.clientWidth - panelW; // ★ 用动态 panelW
      const visibleSec = VCOLS * TIME_PER_COL_SEC;
      pxPerSec = chartW > 0 ? chartW / visibleSec : CONFIG.pxPerSec;
    }

    const points: Pt[] = [];
    let lastV = CONFIG.basePrice;
    let vEMA = lastV;
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

        vEMA = vEMA * (1 - EMA_ALPHA) + lastV * EMA_ALPHA;

        points.push({ t: curNowMs, v: vEMA });

        const chartW = canvas.clientWidth - panelW;
        const maxLeft = (chartW * CONFIG.nowXR) / pxPerSec * 1000 + 2000;
        const cutoff = curNowMs - maxLeft;
        while (points.length && points[0].t < cutoff) points.shift();

        yMin = CONFIG.meanRevertTo - CONFIG.fixedYPad;
        yMax = CONFIG.meanRevertTo + CONFIG.fixedYPad;
      }
    }

    const yToPx = (v: number) => {
      const h = canvas.clientHeight;
      return h - ((v - yMin) / (yMax - yMin)) * h;
    };
    const tToPx = (tMs: number, nowMsVal: number) => {
      const chartW = canvas.clientWidth - panelW;
      const nowX = chartW * CONFIG.nowXR;
      const dtSec = (nowMsVal - tMs) / 1000;
      return nowX - dtSec * pxPerSec;
    };

    function strokeSmoothLine(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      const t = 0.5;
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

    function drawGridAndLabels(nowMsVal: number) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const chartW = w - panelW;

      computePxPerSec();

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.fillStyle = "rgba(255,255,255,0.75)";

      // 纵向格 + 时间
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

      const priceAnchorX = chartW - CAPSULE_W / 2;

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `normal ${PRICE_FONT_SIZE}px ${PRICE_FONT_FAMILY}`;

      const parts = HCELLS + 1;
      for (let i = 0; i < parts; i++) {
        const frac = (i + 0.5) / parts;
        const vRaw = yMax - (yMax - yMin) * frac;
        const vQ = quantizeToStep(vRaw, PRICE_STEP);
        const yy = Math.round(yToPx(vQ)) + 0.5;

        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        ctx.fillText(formatPrice(vQ, CONFIG.priceLabelDigits), priceAnchorX, yy - 2);
      }
    }

    function drawPrice(nowMsVal: number) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const chartW = w - panelW;
      if (points.length < 2) return;

      const pix: { x: number; y: number }[] = [];
      for (const p of points) {
        const x = tToPx(p.t, nowMsVal);
        if (x < -20 || x > w + 20) continue;
        const y = yToPx(p.v);
        pix.push({ x, y });
      }
      if (pix.length < 2) return;

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#5FC5FF";
      ctx.shadowColor = "rgba(90, 200, 250, 0.25)";
      ctx.shadowBlur = 6;
      strokeSmoothLine(ctx, pix);
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      const last = points[points.length - 1];
      const lastY = yToPx(last.v);

      const lastLabelV = quantizeToStep(last.v, PRICE_STEP);
      const label = `$${lastLabelV.toFixed(CONFIG.priceLabelDigits)}`;

      const priceAnchorX = chartW - CAPSULE_W / 2;

      const boxW = CAPSULE_W;
      const boxH = CAPSULE_H;
      const radius = boxH / 2;
      const boxX = priceAnchorX - boxW / 2;
      const boxY = lastY - boxH / 2;

      let color = "#8e8e8eff";
      if (modeRef.current === "short") color = "#ce0e0eff";
      else if (modeRef.current === "long") color = "#2BB20A";

      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(0, lastY); ctx.lineTo(w, lastY); ctx.stroke();

      ctx.fillStyle = color;
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

      ctx.fillStyle = "#000";
      ctx.font = "600 12px Montserrat, ui-monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, priceAnchorX, boxY + boxH / 2);

      const nowX = chartW * CONFIG.nowXR;
      lastTRef.current = last.t;
      lastVRef.current = last.v;
      ctx.strokeStyle = "#FFF614";
      ctx.beginPath(); ctx.moveTo(nowX + 0.5, 0); ctx.lineTo(nowX + 0.5, h); ctx.stroke();

      ctx.beginPath(); ctx.arc(nowX, lastY, 18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(95,197,255,0.24)"; ctx.fill();
      ctx.beginPath(); ctx.arc(nowX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#5AC8FA"; ctx.fill();
      ctx.strokeStyle = "#5FC5FF"; ctx.lineWidth = 1; ctx.stroke();

      if (marksRef.current.length > 0) {
        const visibleMarks: Mark[] = [];
        for (const m of marksRef.current) {
          const markX = tToPx(m.t, nowMsVal);
          const markY = yToPx(m.v);
          if (markX > 0) {
            visibleMarks.push(m);
            if (m.kind === "long") drawUpArrow(ctx, markX, markY);
            else drawDownArrow(ctx, markX, markY);
          }
        }
        marksRef.current = visibleMarks;
      }
    }

    function frame(tsPerf: number) {
      if (!running) return;

      const dt = tsPerf - lastFramePerf;
      lastFramePerf = tsPerf;
      synth(dt);

      const curNow = nowMs();
      drawGridAndLabels(curNow);
      drawPrice(curNow);

      const vid = panelRef.current;
      if (vid) {
        const videoTime = vid.currentTime;

        // 检测是否视频 loop 回到开头
        if (videoTime < prevVideoTimeRef.current) {
          modeRef.current = "none"; // 不清空 marks，只重置状态
        }
        prevVideoTimeRef.current = videoTime;

        // 根据视频时间判断 long / short
        let newMode: "none" | "long" | "short" = "none";
        for (const { start, kind } of triggerTimeline) {
          if (videoTime >= start && videoTime < start + 0.8) {
            newMode = kind as "long" | "short";
            break;
          }
        }
        modeRef.current = newMode;

        // 若触发 long / short，生成箭头并锁定当前价位
        if (newMode !== "none") {
          const lastMark = marksRef.current[marksRef.current.length - 1];
          if (!lastMark || lastMark.kind !== newMode || Math.abs(lastMark.t - lastTRef.current) > 1000) {
            marksRef.current.push({ t: lastTRef.current, v: lastVRef.current, kind: newMode });
          }
        }

        // 清理滑出屏幕左边的箭头
        const chartW = canvas.clientWidth - panelW;
        const leftBoundary = -40;
        marksRef.current = marksRef.current.filter((m) => tToPx(m.t, curNow) > leftBoundary);
      }


      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    const vid = panelRef.current;
    if (vid) {
      const onVidReady = () => { measurePanelWidth(); resize(); };
      vid.addEventListener("loadeddata", onVidReady, { once: true });
    }

    const onWinResize = () => resize();
    window.addEventListener("resize", onWinResize);

    prepareAndStart();

    return () => {
      running = false;
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
  }, [panelW, vCols, hCells]);

  return (
    <div
      ref={wrapRef}
      className="chartWrap"
      style={{
        position: "relative",
        width: "100%",
        height: heightPx ? `${heightPx}px` : `var(--chartH, ${CHART_H}px)`,
      }}
    >
      <canvas ref={canvasRef} className="chartCanvas" />

      {!hideRightPanel && (
        <video
          ref={panelRef}
          src="/game_demo.mp4"
          className="right_panel"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => {
            measurePanelWidth();
            setVideoLoaded(true);
          }}
          style={{
            opacity: videoLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        />
      )}
    </div>
  );
}

export default function CenterBoard(props: ChartProps) {
  return (
    <section className="card">
      <div className="cardContent" style={{ background: props.bgColor }}>
        <div className="chartContainer">
          <ChartCanvas {...props} />
        </div>
      </div>
    </section>
  );
}
