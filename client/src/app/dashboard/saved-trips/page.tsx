// src/app/dashboard/saved-trips/page.tsx
"use client";

import Head from "next/head";
import React, { useEffect, useState } from "react";
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

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Get current user from backend auth endpoint
        const meRes = await fetch(`${API_URL}/api/auth/me`, { headers, credentials: 'include' });
        if (!meRes.ok) {
          setUserID(null);
          router.push('/login');
          setLoading(false);
          return;
        }
        const meJson = await meRes.json();
        const uid = meJson?.user?.id ?? null;
        setUserID(uid);

        if (!uid) {
          setSavedTrips([]);
          setLoading(false);
          return;
        }

        // Fetch saved trips from backend
        const res = await fetch(`${API_URL}/api/trips?userID=${uid}`, { headers, credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: Trip[] = await res.json();
        data.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        setSavedTrips(data);
      } catch (error: any) {
        console.error("Failed to fetch saved trips:", error);
        setError(error.message || "Could not load your saved trips.");
        setSavedTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedTrips();
  }, [router]);

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

      <div className="relative flex min-h-screen flex-col bg-site overflow-x-hidden">
        <div className="layout-container flex flex-col h-full grow">
          {/* Header provided by layout; removed duplicate per-page header */}

          <div className="px-6 md:px-40 flex flex-1 justify-center py-8">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              {loading ? (
                <p className="text-site text-lg">Loading saved trips...</p>
              ) : error ? (
                 <p className="text-red-400 text-lg">Error: {error}</p>
              ) : savedTrips.length === 0 ? (
                <p className="text-site text-lg">No saved trips found for this user.</p>
              ) : (
                savedTrips.map((trip, idx) => (
                  <div key={getPlanKey(trip, idx)} className="mb-8 p-6 rounded-lg bg-card shadow-lg animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                    <h2 className="text-site text-2xl font-bold mb-4">
                      Trip {idx + 1}: {trip.from} to {trip.to}
                    </h2>

                    <div className="flex flex-wrap justify-between gap-3 pb-4 border-b mb-4" style={{ borderColor: 'var(--primary)', opacity: 0.12 }}>
                      <div className="flex flex-col gap-2">
                        <p className="text-muted text-sm">
                          Planned from: <span className="font-semibold text-site">{formatDate(trip.startDate)}</span> to <span className="font-semibold text-site">{formatDate(trip.deadline)}</span>
                        </p>
                        <p className="text-muted text-sm">
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

                    <h3 className="text-site text-xl font-semibold mb-4 border-b pb-2" style={{ borderColor: 'var(--primary)', opacity: 0.12 }}>Itinerary Details:</h3>
                    {trip.plan.length > 0 ? (
                      <div className="relative pl-6" style={{ borderLeft: '2px dashed var(--primary)', opacity: 0.9 }}>
                        {trip.plan.map((segment, segIdx) => (
                          <div key={segIdx} className="mb-6 relative">
                            <div className="absolute left-[-11px] top-0 size-5 rounded-full" style={{ backgroundColor: 'var(--primary)', border: '2px solid var(--bg)' }}></div>
                            <div className="bg-card rounded-lg p-4 shadow-md">
                              <p className="text-site text-base font-semibold mb-1">
                                {segment.mode}: {segment.source} to {segment.destination}
                              </p>
                              {segment.serviceNumber && (
                                <p className="text-muted text-sm">Service: {segment.serviceNumber}</p>
                              )}
                              <p className="text-muted text-sm">
                                <span className="font-medium text-site">Departure:</span> {formatDate(segment.departureTime)} {formatTime(segment.departureTime)}
                              </p>
                              <p className="text-muted text-sm">
                                <span className="font-medium text-site">Arrival:</span> {formatDate(segment.arrivalTime)} {formatTime(segment.arrivalTime)}
                              </p>
                              <p className="text-muted text-sm">
                                Duration: {segment.durationHrs?.toFixed(2)} hours | Cost: ₹{segment.cost?.toFixed(2)}
                              </p>
                              {segment.layover && (
                                <p className="text-muted text-sm">Layover: {segment.layover} minutes</p>
                              )}
                              {segment.bufferMins && (
                                <p className="text-muted text-sm">Buffer: {segment.bufferMins} mins ({segment.bufferNote})</p>
                              )}
                              {segment.availability && (
                                <p className="text-muted text-sm">Availability: {segment.availability}</p>
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
                      <p className="text-muted text-base">No detailed plan available for this trip.</p>
                    )}

                    <div className="flex px-4 py-3 justify-between mt-4">
                      <button className="flex items-center justify-center rounded-xl h-10 px-4 bg-card text-site text-sm font-bold shadow-sm">
                        Edit Trip
                      </button>
                      <button className="flex items-center justify-center rounded-xl h-10 px-4 btn-primary text-white text-sm font-bold shadow-md">
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