import "./globals.css";
import { Montserrat } from "next/font/google";
import type { Metadata } from "next";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});


export const metadata: Metadata = {
  title: "Manic.Trade - Hyper Casual DEX",
  description: "Tap once to trade, get instant results. Manic.Trade transforms crypto trading into an accessible, entertainment-first experience for retail users. No complex charts or jargon - just simple predictions with immediate on-chain settlement. Making markets playful, intuitive, and instantly rewarding.",
  openGraph: {
    title: "Manic.Trade - Hyper Casual DEX",
    description:
      "Tap once to trade, get instant results. Manic.Trade transforms crypto trading into an accessible, entertainment-first experience for retail users. No complex charts or jargon - just simple predictions with immediate on-chain settlement. Making markets playful, intuitive, and instantly rewarding.",
    images: ["/SEO_M.png"],
  },
};





export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
