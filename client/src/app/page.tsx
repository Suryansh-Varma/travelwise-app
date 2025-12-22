import Hero from "./components/Hero";

export const metadata = {
  title: "TravelWise – Smart Trip Planner",
  description: "Plan smarter. Travel wiser. Generate AI-assisted itineraries based on your budget and timeline.",
};

export default function Home() {
  return (
    <main className="min-h-screen font-sans transition-colors">
      <Hero />
    </main>
  );
}