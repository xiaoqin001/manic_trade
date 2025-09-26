// import "./globals.css";
// import { Montserrat } from "next/font/google";

// export const montserrat = Montserrat({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700", "800"],
// });


// export const metadata = {
//   title: "Manic Trade — No Tailwind",
//   description: "Canvas price chart + side reels (pure CSS)"
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body className={montserrat.className}>{children}</body>
//     </html>
//   );
// }

// src/app/layout.tsx
import "./globals.css";
import { Montserrat } from "next/font/google";
import type { Metadata } from "next";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Your App",
  description: "…",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
