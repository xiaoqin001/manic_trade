import Overlay from "@/components/Overlay";
import CenterBoard from "@/components/ChartCanvas";
import SideReel from "@/components/SideReel";

export default function Page() {
  return (
    <main className="main">
      <div className="container">
        <div className="grid3">
          {/* 左侧循环滚动 */}
          <SideReel speedSec={22} width={180} />

          {/* 中间内容：Hero + Chart */}
          <div>
            <Overlay mode="hero" />
            <CenterBoard />
          </div>

          {/* 右侧循环滚动 */}
          <SideReel reverse speedSec={26} width={180} />
        </div>
      </div>

      {/* 全屏蒙层 Overlay */}
      <Overlay mode="fullscreen" />
    </main>
  );
}
