"use client";

import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// --- INTERFACES ---
interface Accommodation {
  name: string;
  location?: string;
  estimated_cost_inr: number;
  booking_link: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  activities: string[];
  accommodation?: Accommodation | null;
}

interface TripSegment {
  mode: string;
  source: string;
  destination: string;
  cost: number;
  durationHrs?: number;
  bufferMins?: number;
  bufferNote?: string;
  distanceKm?: number;
}

interface Trip {
  _id?: string;
  from: string;
  to: string;
  startDate: string;
  deadline: string;
  budget: number;

  plan_name?: string;
  plan_rationale?: string;

  itinerary: ItineraryDay[];
  plan: TripSegment[];

  total_cost_accommodation_activities?: number;
  totalCost: number;
  budgetRemaining?: number;

  warnings: string[];
  userID: string;
  createdAt?: string;
}

export default function TripsPage() {
  const router = useRouter();
  const [displayTrips, setDisplayTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const hasProcessedGeneratedTrips = useRef(false);

  useEffect(() => {
    const loadCurrentSessionTrips = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('sessionToken');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // 1. Authenticate
        const meRes = await fetch(`${API_URL}/api/auth/me`, { headers, credentials: 'include' });
        if (!meRes.ok) { router.push('/login'); return; }
        const meJson = await meRes.json();
        const uid = meJson?.user?.id;

        // 2. Priority: Show fresh trips from LocalStorage
        const stored = localStorage.getItem('lastGeneratedTrips');
        if (stored && !hasProcessedGeneratedTrips.current) {
          const local: Trip[] = JSON.parse(stored);
          setDisplayTrips(local);
          hasProcessedGeneratedTrips.current = true;
          setLoading(false);
          return; // STOP HERE - Don't load history
        }

        // 3. Fallback: Fetch ONLY the latest batch from Backend
        const backendRes = await fetch(`${API_URL}/api/trips?userID=${uid}`, { headers, credentials: 'include' });
        if (backendRes.ok) {
          const allSavedTrips: Trip[] = await backendRes.json();
          
          if (allSavedTrips.length > 0) {
            // Sort by newest first
            allSavedTrips.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
            
            // Filter: Only show trips created in the same "batch" (within 30 seconds of the newest trip)
            const newestTripTime = new Date(allSavedTrips[0].createdAt!).getTime();
            const currentBatch = allSavedTrips.filter(trip => {
              const tripTime = new Date(trip.createdAt!).getTime();
              return (newestTripTime - tripTime) < 30000; // 30 second window
            });
            
            setDisplayTrips(currentBatch);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentSessionTrips();
  }, [router]);

  const handleDelete = async (tripId: string) => {
    if (!confirm("Remove this option?")) return;
    setIsDeleting(tripId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('sessionToken');
      const res = await fetch(`${API_URL}/api/trips/${tripId}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) setDisplayTrips(prev => prev.filter(t => t._id !== tripId));
    } catch (err) {
      alert("Delete failed");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Head><title>Current Plan - TravelWise</title></Head>
      <div className="min-h-screen bg-site p-6 text-site">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black">Generated Trip Options</h1>
            <button 
              onClick={() => {
                localStorage.removeItem('lastGeneratedTrips');
                router.push('/dashboard');
              }}
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl font-bold text-sm transition"
            >
              + Plan New Trip
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="animate-pulse font-medium">Fetching the latest plans...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-500">{error}</div>
          ) : displayTrips.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted mb-4">No recent trips found.</p>
              <button onClick={() => router.push('/dashboard')} className="text-primary font-bold hover:underline">Go to Dashboard</button>
            </div>
          ) : (
            displayTrips.map((trip, idx) => (
              <div key={trip._id || idx} className="mb-12 p-6 md:p-10 bg-card rounded-[2rem] shadow-2xl border border-white/5 relative">
                
                {/* Delete Icon */}
                <button 
                  onClick={() => trip._id && handleDelete(trip._id)}
                  disabled={isDeleting === trip._id}
                  className="absolute top-6 right-6 p-2 text-muted hover:text-red-400 transition"
                >
                  {isDeleting === trip._id ? "..." : "🗑️"}
                </button>

                {/* Header */}
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full mb-2">
                    Option {idx + 1}
                  </span>
                  <h2 className="text-3xl font-black mb-2">{trip.plan_name || `${trip.from} to ${trip.to}`}</h2>
                  {trip.plan_rationale && <p className="text-muted italic text-sm border-l-2 border-primary/40 pl-4">"{trip.plan_rationale}"</p>}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-site/30 p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-muted uppercase font-bold">Est. Cost</p>
                    <p className={`text-lg font-black ${trip.totalCost > trip.budget ? 'text-red-400' : 'text-green-400'}`}>₹{trip.totalCost}</p>
                  </div>
                  <div className="bg-site/30 p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-muted uppercase font-bold">Daily Budget</p>
                    <p className="text-lg font-black">₹{(trip.budget / 5).toFixed(0)}</p>
                  </div>
                  <div className="bg-site/30 p-4 rounded-2xl text-center md:col-span-2">
                    <p className="text-[10px] text-muted uppercase font-bold">Dates</p>
                    <p className="text-sm font-black">{formatDate(trip.startDate)} - {formatDate(trip.deadline)}</p>
                  </div>
                </div>

                {/* Itinerary Timeline */}
                <div className="relative space-y-10 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/50 before:to-transparent">
                  {trip.itinerary?.map((day) => (
                    <div key={day.day} className="relative pl-12">
                      <div className="absolute left-3 top-1 size-4 bg-primary rounded-full border-4 border-card z-10"></div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3">
                        <h4 className="text-xl font-bold">Day {day.day}: {day.theme}</h4>
                        <span className="text-xs font-medium text-muted">{formatDate(day.date)}</span>
                      </div>
                      
                      <ul className="space-y-2 mb-6">
                        {day.activities.map((act, i) => (
                          <li key={i} className="text-muted text-sm flex gap-2">
                            <span className="text-primary">•</span> {act}
                          </li>
                        ))}
                      </ul>

                      {day.accommodation && (
                        <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-site/40 rounded-2xl border border-white/5 gap-4">
                          <div className="text-center sm:text-left">
                            <p className="text-[10px] font-bold text-primary uppercase mb-1">Recommended Stay</p>
                            <p className="font-bold text-sm">{day.accommodation.name}</p>
                          </div>
                          <a 
                            href={day.accommodation.booking_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:scale-105 transition"
                          >
                            Book @ ₹{day.accommodation.estimated_cost_inr}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Transport Accordion */}
                {trip.plan.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-white/5">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none text-muted font-bold text-xs uppercase tracking-widest hover:text-primary transition">
                        Logistics & Transport
                        <span className="group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-4 grid gap-3">
                        {trip.plan.map((seg, i) => (
                          <div key={i} className="p-4 bg-site/20 rounded-xl flex justify-between items-center text-sm">
                            <span><span className="font-bold">{seg.mode}</span>: {seg.source} → {seg.destination}</span>
                            <span className="font-mono text-primary font-bold">₹{seg.cost}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}