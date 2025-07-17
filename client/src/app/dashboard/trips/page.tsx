"use client";

import Head from "next/head";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

export default function TripsPage() {
  const [userID, setUserID] = useState<string | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndTrips = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserID(uid);

      if (uid) {
        const res = await fetch(`http://localhost:5000/api/trips?userID=${uid}`);
        const data = await res.json();
        setTrips(data);
      }
      setLoading(false);
    };
    fetchUserAndTrips();
  }, []);

  return (
    <>
      <Head>
        <title>TravelWise Trips</title>
        <link rel="icon" href="data:image/x-icon;base64," />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?display=swap&family=Noto+Sans:wght@400;500;700;900&family=Plus+Jakarta+Sans:wght@400;500;700;800"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />
      </Head>

      <div
        className="relative flex min-h-screen flex-col bg-[#151122] overflow-x-hidden"
        style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex flex-col h-full grow">
          <header className="flex items-center justify-between border-b border-solid border-b-[#2d2447] px-10 py-3">
            <div className="flex items-center gap-4 text-white">
              <div className="size-4">
                {/* SVG LOGO */}
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* SVG paths */}
                </svg>
              </div>
              <h2 className="text-white text-lg font-bold tracking-[-0.015em]">TravelWise</h2>
            </div>
            <div className="flex flex-1 justify-end gap-8">
              <div className="flex items-center gap-9">
                <a className="text-white text-sm font-medium" href="#">
                  Trips
                </a>
                <a className="text-white text-sm font-medium" href="#">
                  Explore
                </a>
                <a className="text-white text-sm font-medium" href="#">
                  Saved
                </a>
              </div>
              <button className="flex items-center justify-center rounded-xl h-10 bg-[#2d2447] text-white text-sm font-bold px-2.5">
                {/* Notification bell icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                  {/* SVG paths */}
                </svg>
              </button>
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD5ZW3XSMqjSsWXQv4DPRe7XZVifNdyZQvH98ObVIuaQB8YDWUhyd4vnTVBat9cY5kHvFUrRukrLOvuO2pKy19TOz36EkuR9GOpowLxvbSSFfr3ooEcNjXZzM4KoNTyOndVBZ9HkOrS7Qhw6vNbht820axtgvZwIu4acrts9YrKskEIsxl9JJCoRKnO3O1jwhm8jAZwtwChSEnSMHyD4mIfPjuE-ObcLR0pABs71R4Gb04phJM8na4su5aPT2Dhds0fd1NjZGPF9pDa")',
                }}
              ></div>
            </div>
          </header>

          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              {loading ? (
                <p className="text-white text-lg">Loading trips...</p>
              ) : trips.length === 0 ? (
                <p className="text-white text-lg">No trips found.</p>
              ) : (
                trips.map((trip, idx) => (
                  <div key={trip._id || idx} className="mb-8">
                    {/* Trip Details */}
                    <div className="flex flex-wrap justify-between gap-3 p-4">
                      <div className="flex min-w-72 flex-col gap-3">
                        <p className="text-white text-[32px] font-bold">Trip to {trip.to}</p>
                        <p className="text-[#a093c8] text-sm">
                          {trip.startDate} to {trip.deadline} | Budget: ₹{trip.budget}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Section */}
                    {/* Add your timeline SVGs/layout here if needed */}

                    {/* Budget Tracker */}
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex justify-between">
                        <p className="text-white text-base font-medium">Budget Used</p>
                        <p className="text-white text-sm">75%</p>
                      </div>
                      <div className="rounded bg-[#403465]">
                        <div className="h-2 rounded bg-[#4c19e5]" style={{ width: "75%" }}></div>
                      </div>
                      <p className="text-[#a093c8] text-sm">
                        ₹{Math.round(Number(trip.budget) * 0.75)} / ₹{trip.budget}
                      </p>
                    </div>

                    {/* Gemini Suggestion */}
                    {trip.gemini && (
                      <div className="bg-[#2d2447] rounded-xl p-4 mb-4 text-white">
                        <p className="font-bold mb-2">Gemini Suggestion:</p>
                        <p>{trip.gemini}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex px-4 py-3 justify-between">
                      <button className="flex items-center justify-center rounded-xl h-10 px-4 bg-[#2d2447] text-white text-sm font-bold">
                        Edit Trip
                      </button>
                      <button className="flex items-center justify-center rounded-xl h-10 px-4 bg-[#4c19e5] text-white text-sm font-bold">
                        Start Over
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
