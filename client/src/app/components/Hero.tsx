'use client';

import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/login');
  };
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left column: content */}
        <div className="md:col-span-7">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-site animate-fade-up">
            Plan smarter. Travel wiser.
          </h1>
          <p className="mt-4 text-base text-muted max-w-xl animate-fade-up animate-delay-150">
            Generate AI-assisted itineraries tailored to your budget and timeline — quick, reliable, and travel-ready.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-up animate-delay-250">
            <button
              onClick={handleClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold shadow-sm btn-primary text-white hover:brightness-90 transition"
            >
              Start Planning
            </button>

            <button
              onClick={() => router.push('/trips')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border bg-card text-site hover:shadow-md transition"
            >
              Explore Trips
            </button>
          </div>

          <div className="mt-6 text-sm text-muted">
            No account needed to browse. Sign up to save itineraries and sync across devices.
          </div>
        </div>

        {/* Right column: image/card */}
        <div className="md:col-span-5">
          <div className="rounded-xl overflow-hidden shadow-lg bg-card animate-fade-in animate-delay-250">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=3d52d7b4a9b6d2f6f7f6b7c6a3e2d1f0"
              alt="Travel destination preview"
              className="w-full h-64 object-cover sm:h-80 md:h-72 lg:h-80"
            />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-site">7-day Bali Explorer</div>
                  <div className="text-sm text-muted">Flexible, budget-friendly itinerary</div>
                </div>
                <div className="text-sm font-medium text-primary">$399</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}