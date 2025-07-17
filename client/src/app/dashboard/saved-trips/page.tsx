// src/app/dashboard/saved-trips/page.tsx
"use client";

import Head from "next/head";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

// Re-use interfaces for type safety
interface TripSegment {
  mode: string;
  source: string;
  destination: string;
  serviceNumber: string | null;
  departureTime: string;
  arrivalTime: string;
  cost: number;
  durationHrs: number;
  layover: string | null;
  bufferMins: number | null;
  bufferNote: string | null;
  availability: string;
  warnings: string[] | null;
  distanceKm?: number;
}

interface Trip {
  _id?: string;
  from: string;
  to: string;
  startDate: string;
  deadline: string;
  budget: number;
  plan: TripSegment[];
  warnings: string[];
  userID: string;
  totalCost: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function SavedTripsPage() {
  const router = useRouter();
  const [userID, setUserID] = useState<string | null>(null);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]); // State for ALL saved trips
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedTrips = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserID(uid);

      if (uid) {
        try {
          // This API endpoint fetches ALL trips for the user
          const res = await fetch(`http://localhost:5000/api/trips?userID=${uid}`);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data: Trip[] = await res.json();
          // Sort by creation date if you want the most recent first
          data.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
          setSavedTrips(data);
        } catch (error: any) {
          console.error("Failed to fetch saved trips:", error);
          setError(error.message || "Could not load your saved trips.");
        }
      } else {
        // If no user, redirect to login or show appropriate message
        // router.push('/login');
      }
      setLoading(false);
    };

    fetchSavedTrips();
  }, [userID]); // Re-fetch when userID changes

  // Helper functions for formatting (copy-pasted from TripsPage)
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    try { return new Date(dateString).toLocaleDateString(undefined, options); } catch { return dateString; }
  };

  const formatTime = (timeString: string) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    try { const date = new Date(timeString); if (isNaN(date.getTime())) return timeString; return date.toLocaleTimeString(undefined, options); } catch { return timeString; }
  };

  const getPlanKey = (trip: Trip, idx: number) => trip._id || `${trip.from}-${trip.to}-${trip.startDate}-${idx}`;


  return (
    <>
      <Head>
        <title>TravelWise Saved Trips</title>
        <link rel="icon" href="data:image/x-icon;base64," />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?display=swap&family=Noto+Sans:wght@400;500;700;900&family=Plus+Jakarta+Sans:wght@400;500;700;800"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />
      </Head>

      <div className="relative flex min-h-screen flex-col bg-[#151122] overflow-x-hidden" style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}>
        <div className="layout-container flex flex-col h-full grow">
          <header className="flex items-center justify-between border-b border-solid border-b-[#2d2447] px-10 py-3">
            <div className="flex items-center gap-4 text-white">
              <div className="size-4">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M37 25.5C37 26.3284 36.3284 27 35.5 27H29.625C28.8066 27 28.125 26.3284 28.125 25.5V19.625C28.125 18.8066 28.8066 18.125 29.625 18.125H35.5C36.3284 18.125 37 18.8066 37 19.625V25.5ZM19.625 25.5C19.625 26.3284 18.9534 27 18.125 27H12.25C11.4216 27 10.75 26.3284 10.75 25.5V19.625C10.75 18.8066 11.4216 18.125 12.25 18.125H18.125C18.9534 18.125 19.625 18.8066 19.625 19.625V25.5ZM19.625 35.5C19.625 36.3284 18.9534 37 18.125 37H12.25C11.4216 37 10.75 36.3284 10.75 35.5V29.625C10.75 28.8066 11.4216 28.125 12.25 28.125H18.125C18.9534 28.125 19.625 28.8066 19.625 29.625V35.5ZM37 35.5C37 36.3284 36.3284 37 35.5 37H29.625C28.8066 37 28.125 36.3284 28.125 35.5V29.625C28.125 28.8066 28.8066 28.125 29.625 28.125H35.5C36.3284 28.125 37 28.8066 37 29.625V35.5Z" fill="white" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M0 13C0 5.8203 5.8203 0 13 0H35C42.1797 0 48 5.8203 48 13V35C48 42.1797 42.1797 48 35 48H13C5.8203 48 0 42.1797 0 35V13ZM13 1.5C6.64873 1.5 1.5 6.64873 1.5 13V35C1.5 41.3513 6.64873 46.5 13 46.5H35C41.3513 46.5 46.5 41.3513 46.5 35V13C46.5 6.64873 41.3513 1.5 35 1.5H13Z" fill="white" />
                </svg>
              </div>
              <h2 className="text-white text-lg font-bold tracking-[-0.015em]">TravelWise</h2>
            </div>
            <div className="flex flex-1 justify-end gap-8">
              <div className="flex items-center gap-9">
                <a className="text-white text-sm font-medium" href="/explore">Explore</a>
                <a className="text-white text-sm font-medium" href="/trips">Recent Trips</a>
                <a className="text-white text-sm font-medium" href="/dashboard/saved-trips">Saved Trips</a>
                <a className="text-white text-sm font-medium" href="/updates">Updates</a>
              </div>
              <button className="flex items-center justify-center rounded-xl h-10 bg-[#2d2447] text-white text-sm font-bold px-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M224 192V104a96.11 96.11 0 0 0-96-96A95.53 95.53 0 0 0 32 104v88a8 8 0 0 0 8 8H64a8 8 0 0 0 8-8v-6.09c0-30.81 22.84-56.6 53-60.67V32a8 8 0 0 1 16 0v2.79a7.83 7.83 0 0 0 .52 2.39 95.27 95.27 0 0 1 15.65 25.13 8 8 0 0 0 13.6-8.24 111.47 111.47 0 0 0-19-30.16 23 23 0 0 1-1.28-10.45 8 8 0 0 0-16 0 22.89 22.89 0 0 1-1.29 10.45 111.47 111.47 0 0 0-19-30.16 8 8 0 0 0-13.6 8.24 95.27 95.27 0 0 1 15.65 25.13 7.83 7.83 0 0 0 .52 2.39v2.79a80.1 80.1 0 0 1 80 80v88a8 8 0 0 0 8 8h24a8 8 0 0 0 8-8Z" />
                  <path d="M96 224a32 32 0 0 0 64 0Z" />
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
                <p className="text-white text-lg">Loading saved trips...</p>
              ) : error ? (
                 <p className="text-red-400 text-lg">Error: {error}</p>
              ) : savedTrips.length === 0 ? (
                <p className="text-white text-lg">No saved trips found for this user.</p>
              ) : (
                savedTrips.map((trip, idx) => (
                  <div key={getPlanKey(trip, idx)} className="mb-8 p-6 rounded-lg bg-[#211d35] shadow-lg">
                    <h2 className="text-white text-2xl font-bold mb-4">
                      Trip {idx + 1}: {trip.from} to {trip.to}
                    </h2>

                    <div className="flex flex-wrap justify-between gap-3 pb-4 border-b border-solid border-b-[#403465] mb-4">
                      <div className="flex flex-col gap-2">
                        <p className="text-[#a093c8] text-sm">
                          Planned from: <span className="font-semibold">{formatDate(trip.startDate)}</span> to <span className="font-semibold">{formatDate(trip.deadline)}</span>
                        </p>
                        <p className="text-[#a093c8] text-sm">
                          Original Budget: ₹{trip.budget} | Estimated Cost: ₹{trip.totalCost?.toFixed(2)}
                          {trip.totalCost > trip.budget && (
                            <span className="text-red-400 ml-2">(Exceeds Budget!)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {trip.warnings && trip.warnings.length > 0 && (
                      <div className="bg-yellow-800 bg-opacity-30 rounded-lg p-3 mb-4">
                        <p className="text-yellow-300 text-sm font-semibold mb-1">Warnings for this Plan:</p>
                        <ul className="list-disc list-inside text-yellow-200 text-sm">
                          {trip.warnings.map((warning, wIdx) => (
                            <li key={wIdx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <h3 className="text-white text-xl font-semibold mb-4 border-b border-dashed border-b-[#403465] pb-2">Itinerary Details:</h3>
                    {trip.plan.length > 0 ? (
                      <div className="relative border-l-2 border-dashed border-[#4c19e5] pl-6">
                        {trip.plan.map((segment, segIdx) => (
                          <div key={segIdx} className="mb-6 relative">
                            <div className="absolute left-[-11px] top-0 size-5 rounded-full bg-[#4c19e5] border-2 border-[#151122]"></div>
                            <div className="bg-[#2d2447] rounded-lg p-4 shadow-md">
                              <p className="text-white text-base font-semibold mb-1">
                                {segment.mode}: {segment.source} to {segment.destination}
                              </p>
                              {segment.serviceNumber && (
                                <p className="text-[#a093c8] text-sm">Service: {segment.serviceNumber}</p>
                              )}
                              <p className="text-[#a093c8] text-sm">
                                <span className="font-medium">Departure:</span> {formatDate(segment.departureTime)} {formatTime(segment.departureTime)}
                              </p>
                              <p className="text-[#a093c8] text-sm">
                                <span className="font-medium">Arrival:</span> {formatDate(segment.arrivalTime)} {formatTime(segment.arrivalTime)}
                              </p>
                              <p className="text-[#a093c8] text-sm">
                                Duration: {segment.durationHrs?.toFixed(2)} hours | Cost: ₹{segment.cost?.toFixed(2)}
                              </p>
                              {segment.layover && (
                                <p className="text-[#a093c8] text-sm">Layover: {segment.layover} minutes</p>
                              )}
                              {segment.bufferMins && (
                                <p className="text-[#a093c8] text-sm">Buffer: {segment.bufferMins} mins ({segment.bufferNote})</p>
                              )}
                              {segment.availability && (
                                <p className="text-[#a093c8] text-sm">Availability: {segment.availability}</p>
                              )}
                              {segment.warnings && segment.warnings.length > 0 && (
                                <div className="mt-2 text-red-300 text-xs">
                                  <p className="font-medium">Segment Warnings:</p>
                                  <ul className="list-disc list-inside">
                                    {segment.warnings.map((warn, wIdx) => (
                                      <li key={wIdx}>{warn}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#a093c8] text-base">No detailed plan available for this trip.</p>
                    )}

                    <div className="flex px-4 py-3 justify-between mt-4">
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