import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import Header from "./components/Header";

const plus = Plus_Jakarta_Sans({
  variable: "--font-plus",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "TravelWise – Smart Trip Planner",
  description: "Plan smarter. Travel wiser. Generate AI-assisted itineraries based on your budget and timeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plus.variable} antialiased bg-site text-site`}
      >
        <Header userName={null} avatarUrl={null} />
        {children}
      </body>
    </html>
  );
}
