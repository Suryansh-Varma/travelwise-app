'use client';
import React from 'react';

interface TripData {
  plan_name: string;
  plan_rationale: string;
  from: string;
  to: string;
  budget: number;
  totalCost: number; // Transport total
  total_cost_accommodation_activities: number; // Stay/Activities total
  budgetRemaining: number;
  itinerary: Array<{
    day: number;
    date: string;
    theme: string;
    activities: string[];
    accommodation: {
      name: string;
      estimated_cost_inr: number;
      booking_link?: string;
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

export default function TripDashboard({ trip }: { trip: TripData }) {
  // Calculations for the progress bar
  const totalSpent = trip.totalCost + trip.total_cost_accommodation_activities;
  const usagePercentage = Math.min((totalSpent / trip.budget) * 100, 100);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-up">
      
      {/* --- HEADER SECTION --- */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-white">{trip.plan_name}</h1>
        <p className="text-muted italic border-l-4 border-primary pl-4 py-1 bg-white/5">
          {trip.plan_rationale}
        </p>
      </div>

      {/* --- BUDGET BREAKDOWN CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-white/10">
          <p className="text-muted text-xs uppercase font-bold tracking-widest">Total Budget</p>
          <p className="text-2xl font-black text-white">₹{trip.budget.toLocaleString()}</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-white/10">
          <p className="text-muted text-xs uppercase font-bold tracking-widest">Est. Transport</p>
          <p className="text-2xl font-black text-primary">₹{trip.totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-white/10">
          <p className="text-muted text-xs uppercase font-bold tracking-widest">Est. Stay & Fun</p>
          <p className="text-2xl font-black text-blue-400">₹{trip.total_cost_accommodation_activities.toLocaleString()}</p>
        </div>
      </div>

      {/* --- BUDGET PROGRESS BAR --- */}
      <div className="bg-card p-6 rounded-2xl border border-white/10">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-site">Budget Utilization</span>
          <span className="text-sm text-site">{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${usagePercentage > 90 ? 'bg-red-500' : 'bg-primary'}`} 
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-3">
          Remaining for shopping/food: <span className="text-white font-bold">₹{trip.budgetRemaining.toLocaleString()}</span>
        </p>
      </div>

      {/* --- TRANSPORT OVERVIEW --- */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-primary/20 rounded-lg">✈️</span> Primary Transport
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trip.plan.map((p, i) => (
            <div key={i} className="bg-card p-4 rounded-xl border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-primary uppercase font-bold">{p.mode}</p>
                <p className="text-site font-bold">{p.source} → {p.destination}</p>
                <p className="text-[10px] text-muted">{new Date(p.departureTime).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-black">₹{p.cost}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- DAILY ITINERARY --- */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-primary/20 rounded-lg">📅</span> Daily Itinerary
        </h2>
        
        {trip.itinerary.map((day) => (
          <div key={day.day} className="relative pl-10 border-l-2 border-white/10 pb-8 last:pb-0">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-site shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
            
            <div className="bg-card p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Day {day.day}</span>
                  <h3 className="text-lg font-bold text-white">{day.theme}</h3>
                  <p className="text-xs text-muted">{new Date(day.date).toDateString()}</p>
                </div>
              </div>

              <ul className="grid grid-cols-1 gap-2">
                {day.activities.map((act, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <span className="text-primary">•</span> {act}
                  </li>
                ))}
              </ul>

              {/* ESTIMATED COST BOX */}
              {day.accommodation.name !== "N/A" && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-muted uppercase">Stay Accommodation</p>
                    <p className="text-sm text-white font-medium">{day.accommodation.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted uppercase">Est. Cost</p>
                    <p className="text-md font-black text-primary">₹{day.accommodation.estimated_cost_inr}</p>
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