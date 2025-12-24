'use client';
import React, { useEffect, useState } from 'react';

// Define the interface to help TypeScript understand the data shape
interface TripData {
  plan_name: string;
  plan_rationale: string;
  from: string;
  to: string;
  budget: number;
  totalCost: number;
  total_cost_accommodation_activities: number;
  budgetRemaining: number;
  itinerary: Array<{
    day: number;
    date: string;
    theme: string;
    activities: string[];
    accommodation: {
      name: string;
      estimated_cost_inr: number;
    };
  }>;
  plan: Array<{
    mode: string;
    source: string;
    destination: string;
    cost: number;
    departureTime: string;
    arrivalTime: string;
  }>;
}

export default function DashboardPage() {
  const [trip, setTrip] = useState<TripData | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('lastGeneratedTrips');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Handle both single object and array responses
        setTrip(Array.isArray(parsed) ? parsed[0] : parsed);
      } catch (err) {
        console.error("Failed to parse trip data", err);
      }
    }
  }, []);

  // 1. Loading State
  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="text-white text-lg animate-pulse">Loading your itinerary...</p>
      </div>
    );
  }

  // 2. Safe Calculations (Only runs if trip is not null)
  // We use the || 0 fallback to prevent toLocaleString errors
  const totalTransport = trip.totalCost || 0;
  const totalStay = trip.total_cost_accommodation_activities || 0;
  const totalBudget = trip.budget || 1; // Avoid division by zero
  
  const totalSpent = totalTransport + totalStay;
  const usagePercentage = Math.min((totalSpent / totalBudget) * 100, 100);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-up min-h-screen bg-[#0a0a0a]">
      
      {/* HEADER SECTION */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-white">
          {trip.plan_name || "Your Trip Plan"}
        </h1>
        <p className="text-gray-400 italic border-l-4 border-[#ccff00] pl-4 py-1 bg-white/5">
          {trip.plan_rationale}
        </p>
      </div>

      {/* BUDGET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/10">
          <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Total Budget</p>
          <p className="text-2xl font-black text-white">₹{totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/10">
          <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Est. Transport</p>
          <p className="text-2xl font-black text-[#ccff00]">₹{totalTransport.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/10">
          <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Est. Stay & Fun</p>
          <p className="text-2xl font-black text-blue-400">₹{totalStay.toLocaleString()}</p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-300">Budget Utilization</span>
          <span className="text-sm text-[#ccff00]">{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${usagePercentage > 90 ? 'bg-red-500' : 'bg-[#ccff00]'}`} 
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Remaining: <span className="text-white font-bold">₹{(trip.budgetRemaining || 0).toLocaleString()}</span>
        </p>
      </div>

      {/* TRANSPORT OVERVIEW */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-[#ccff00]/20 rounded-lg text-[#ccff00]">✈️</span> Transport
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trip.plan?.map((p, i) => (
            <div key={i} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-[#ccff00] uppercase font-bold">{p.mode}</p>
                <p className="text-white font-bold">{p.source} → {p.destination}</p>
                <p className="text-[10px] text-gray-500">{new Date(p.departureTime).toLocaleString()}</p>
              </div>
              <p className="text-white font-black">₹{(p.cost || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ITINERARY */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-[#ccff00]/20 rounded-lg text-[#ccff00]">📅</span> Itinerary
        </h2>
        {trip.itinerary?.map((day) => (
          <div key={day.day} className="relative pl-10 border-l-2 border-white/10 pb-8 last:pb-0">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#ccff00] border-4 border-[#0a0a0a] shadow-[0_0_15px_#ccff00]" />
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#ccff00] uppercase">Day {day.day}</span>
                <h3 className="text-lg font-bold text-white">{day.theme}</h3>
                <p className="text-xs text-gray-500">{new Date(day.date).toDateString()}</p>
              </div>
              <ul className="space-y-2">
                {day.activities?.map((act, i) => (
                  <li key={i} className="text-sm text-gray-400 flex gap-2">
                    <span className="text-[#ccff00]">•</span> {act}
                  </li>
                ))}
              </ul>
              {day.accommodation?.name !== "N/A" && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Stay</p>
                    <p className="text-sm text-white font-medium">{day.accommodation.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Est. Cost</p>
                    <p className="text-md font-black text-[#ccff00]">₹{(day.accommodation.estimated_cost_inr || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}