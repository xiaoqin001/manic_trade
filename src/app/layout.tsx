import "./globals.css";

export const metadata = {
  title: "Manic Trade — No Tailwind",
  description: "Canvas price chart + side reels (pure CSS)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
