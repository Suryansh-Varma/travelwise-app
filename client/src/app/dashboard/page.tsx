'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from "next/navigation";
export default function PlanTripPage() {
      const router = useRouter();
    const[userName, setUserName] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
   const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);
    const[avoidNightTravel, setAvoidNightTravel] = useState(false);
    const [includeLayovers, setIncludeLayovers] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Try to get user's name from user_metadata, fallback to email
      setUserName(user?.user_metadata?.full_name || user?.email || null);
    };
    fetchUser();
  }, []);
  const handleGenerateItinerary = async () => {
    if (!userID) return;
     const tripDetails = {
      from,
      to,
      startDate,
      deadline,
      budget,
      avoidNightTravel,
      includeLayovers,
      userID,
      selectedMode,
    };
    const res = await fetch('http://localhost:5000/api/trips/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripDetails),
    });
    const data = await res.json();
    // Show itinerary options to user (implement UI as needed)
     setLoading(false);
     router.push("/trips");
    console.log(data);
    }

  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#151122] overflow-x-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#2d2447] px-10 py-3">
          <div className="flex items-center gap-4 text-white">
            <div className="w-4 h-4">
              {/* Insert SVG logo here */}
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
              TravelWise
            </h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-white text-sm font-medium" href="#">Explore</a>
              <a className="text-white text-sm font-medium" href="#">Trips</a>
              <a className="text-white text-sm font-medium" href="#">Saved</a>
              <a className="text-white text-sm font-medium" href="#">Updates</a>
            </div>
            <button className="flex items-center justify-center rounded-xl h-10 bg-[#2d2447] text-white text-sm font-bold px-2.5">
              {/* Bell Icon */}
            </button>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/...")' }}
            />
            {/* Display user's name */}
            {userName && (
              <span className="text-white text-base font-bold ml-4">{userName}</span>
            )}
          </div>
        </header>

        {/* Main Body */}
        <main className="px-40 flex flex-1 justify-center py-5">
          <div className="flex flex-col w-[512px] max-w-[512px] py-5">
            <h1 className="text-white text-[32px] font-bold px-4">Plan your trip</h1>

            {/* From */}
            <InputSection label="From" placeholder="City or airport"  icon={null} value={from} onChange={e => setFrom(e.target.value)}/>

            {/* To */}
            <InputSection label="To" placeholder="City or airport" icon={null} value={to} onChange={e => setTo(e.target.value)} />

            {/* Start Date */}
            <InputSection label="Start Date" placeholder="Select date" icon="calendar" value={startDate} onChange={e => setStartDate(e.target.value)}  />

            {/* Deadline */}
            <InputSection label="Deadline" placeholder="Select date" icon="calendar" value={deadline} onChange={e => setDeadline(e.target.value)}/>

            {/* Budget */}
            <InputSection label="Budget" placeholder="Enter budget" icon="currency" value={budget} onChange={e => setBudget(e.target.value)}/>

            {/* Toggles */}
            <ToggleOption label="Avoid night travel" checked={avoidNightTravel} onChange={setAvoidNightTravel} />
            <ToggleOption label="Include layovers" checked={includeLayovers} onChange={setIncludeLayovers} />

            {/* Travel Modes */}
            <h3 className="text-white text-lg font-bold px-4 pt-4 pb-2">Travel Modes</h3>
            <TravelMode label="Flights" selected={selectedMode === "Flights"} onClick={() => setSelectedMode("Flights")}  />
            <TravelMode label="Trains" selected={selectedMode === "Trains"} onClick={() => setSelectedMode("Trains")}/>
            <TravelMode label="Buses" selected={selectedMode === "Buses"} onClick={() => setSelectedMode("Buses")}/>

            {/* Submit */}
            <div className="flex px-4 py-3">
              <button onClick={handleGenerateItinerary} type="submit" className="w-full h-12 rounded-xl bg-[#4c19e5] text-white font-bold text-base" disabled={loading} >{loading ? 'Creating..' : 'Created Itinerary'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function InputSection({ label, placeholder, icon,value,onChange }: { label: string; placeholder: string; icon: any; value:string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
      <label className="flex flex-col min-w-40 flex-1">
        <p className="text-white text-base font-medium pb-2">{label}</p>
        <div className="flex w-full items-stretch rounded-xl">
          <input
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="form-input flex w-full flex-1 rounded-xl text-white focus:outline-none bg-[#2d2447] h-14 placeholder:text-[#a093c8] p-4 text-base"
  />
          {icon && (
            <div className="text-[#a093c8] flex items-center justify-center pr-4 rounded-r-xl bg-[#2d2447]">
              {/* Icon Placeholder */}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

function ToggleOption({ label,checked,onChange }: { label: string ;checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center gap-4 bg-[#151122] px-4 min-h-14 justify-between">
      <p className="text-white text-base flex-1 truncate">{label}</p>
      <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-[#2d2447] p-0.5">
        <div className={`h-full w-[27px] rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-[20px]' : ''}`} />
        <input type="checkbox" className="absolute inset-0 opacity-0" checked={checked} onChange={e => onChange(e.target.checked)} />
      </label>
    </div>
  );
}

function TravelMode({ label,selected,
  onClick, }: { label: string; selected?: boolean;
  onClick?: () => void;}) {
  return (
    <div
      className={`flex items-center gap-4 bg-[#151122] px-4 min-h-14 cursor-pointer ${
        selected ? "border-2 border-[#4c19e5]" : ""
      }`}
      onClick={onClick}
    >
      <div className="text-white flex items-center justify-center rounded-lg bg-[#2d2447] w-10 h-10">
        {/* Travel mode icon placeholder */}
      </div>
      <p className="text-white text-base flex-1 truncate">{label}</p>
      {selected && (
        <span className="text-[#4c19e5] font-bold ml-2">Selected</span>
      )}
    </div>
  );
}