'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from "next/navigation";

// --- Loading Spinner Component ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    {/* Simple rotating SVG spinner */}
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-white ml-3 text-lg">Creating Itinerary...</p>
  </div>
);
// -------------------------------

export default function PlanTripPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null); // This needs to be set from Supabase user data
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false); // State for the loading bar
  const [avoidNightTravel, setAvoidNightTravel] = useState(false);
  const [includeLayovers, setIncludeLayovers] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for displaying errors

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserID(user.id); // Set userID from Supabase user data
        setUserName(user.user_metadata?.full_name || user.email || null);
      } else {
        // Handle case where user is not logged in, maybe redirect to login
        router.push('/login'); // Example: redirect to a login page
      }
    };
    fetchUser();
  }, [router]); // Add router to dependency array

  const handleGenerateItinerary = async () => {
    // Basic validation
    if (!from || !to || !startDate || !deadline || !budget || !userID) {
      setError('Please fill in all required fields (From, To, Dates, Budget).');
      return;
    }
    if (isNaN(Number(budget)) || Number(budget) <= 0) {
      setError('Budget must be a positive number.');
      return;
    }
    if (new Date(startDate) > new Date(deadline)) {
      setError('Start date cannot be after deadline.');
      return;
    }
    setError(null); // Clear previous errors

    setLoading(true); // Start loading animation
    
    const tripDetails = {
      from,
      to,
      startDate,
      deadline,
      budget: Number(budget), // Ensure budget is a number
      avoidNightTravel,
      includeLayovers,
      userID,
      selectedMode, // Pass this to backend if your API uses it for filtering
    };

    // --- Log data being passed to backend ---
    console.log("Data being sent to backend:", tripDetails);

    try {
      const res = await fetch('http://localhost:5000/api/trips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripDetails),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error Response:", errorData); // Log API's error response
        throw new Error(errorData.message || 'Failed to generate itinerary. Please try again.');
      }

      const data = await res.json();
      // --- Log data received from backend ---
      console.log("Data received from backend:", data);
      localStorage.setItem('lastGeneratedTrips', JSON.stringify(data));

      // Redirect to the trips page after successful generation
      router.push(`/dashboard/trips?userID=${userID}`);

    } catch (err: any) { // Catch any errors from the fetch or parsing
      console.error("Error during itinerary generation:", err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false); // Stop loading animation regardless of success or failure
    }
  };

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
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M37 25.5C37 26.3284 36.3284 27 35.5 27H29.625C28.8066 27 28.125 26.3284 28.125 25.5V19.625C28.125 18.8066 28.8066 18.125 29.625 18.125H35.5C36.3284 18.125 37 18.8066 37 19.625V25.5ZM19.625 25.5C19.625 26.3284 18.9534 27 18.125 27H12.25C11.4216 27 10.75 26.3284 10.75 25.5V19.625C10.75 18.8066 11.4216 18.125 12.25 18.125H18.125C18.9534 18.125 19.625 18.8066 19.625 19.625V25.5ZM19.625 35.5C19.625 36.3284 18.9534 37 18.125 37H12.25C11.4216 37 10.75 36.3284 10.75 35.5V29.625C10.75 28.8066 11.4216 28.125 12.25 28.125H18.125C18.9534 28.125 19.625 28.8066 19.625 29.625V35.5ZM37 35.5C37 36.3284 36.3284 37 35.5 37H29.625C28.8066 37 28.125 36.3284 28.125 35.5V29.625C28.125 28.8066 28.8066 28.125 29.625 28.125H35.5C36.3284 28.125 37 28.8066 37 29.625V35.5Z" fill="white" />
                <path fillRule="evenodd" clipRule="evenodd" d="M0 13C0 5.8203 5.8203 0 13 0H35C42.1797 0 48 5.8203 48 13V35C48 42.1797 42.1797 48 35 48H13C5.8203 48 0 42.1797 0 35V13ZM13 1.5C6.64873 1.5 1.5 6.64873 1.5 13V35C1.5 41.3513 6.64873 46.5 13 46.5H35C41.3513 46.5 46.5 41.3513 46.5 35V13C46.5 6.64873 41.3513 1.5 35 1.5H13Z" fill="white" />
              </svg>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
              TravelWise
            </h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-white text-sm font-medium" href="/explore">Explore</a> {/* Added actual paths */}
              <a className="text-white text-sm font-medium" href="/trips">Trips</a>   {/* Added actual paths */}
              <a className="text-white text-sm font-medium" href="/dashboard/saved-trips">Saved</a>   {/* Added actual paths */}
              <a className="text-white text-sm font-medium" href="/updates">Updates</a> {/* Added actual paths */}
            </div>
            <button className="flex items-center justify-center rounded-xl h-10 bg-[#2d2447] text-white text-sm font-bold px-2.5">
              {/* Bell Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224 192V104a96.11 96.11 0 0 0-96-96A95.53 95.53 0 0 0 32 104v88a8 8 0 0 0 8 8H64a8 8 0 0 0 8-8v-6.09c0-30.81 22.84-56.6 53-60.67V32a8 8 0 0 1 16 0v2.79a7.83 7.83 0 0 0 .52 2.39 95.27 95.27 0 0 1 15.65 25.13 8 8 0 0 0 13.6-8.24 111.47 111.47 0 0 0-19-30.16 23 23 0 0 1-1.28-10.45 8 8 0 0 0-16 0 22.89 22.89 0 0 1-1.29 10.45 111.47 111.47 0 0 0-19-30.16 8 8 0 0 0-13.6 8.24 95.27 95.27 0 0 1 15.65 25.13 7.83 7.83 0 0 0 .52 2.39v2.79a80.1 80.1 0 0 1 80 80v88a8 8 0 0 0 8 8h24a8 8 0 0 0 8-8Z" />
                <path d="M96 224a32 32 0 0 0 64 0Z" />
              </svg>
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

            {error && (
              <p className="text-red-400 text-sm px-4 mb-4">{error}</p>
            )}

            {/* From */}
            <InputSection label="From" placeholder="" value={from} onChange={e => setFrom(e.target.value)} />

            {/* To */}
            <InputSection label="To" placeholder="" value={to} onChange={e => setTo(e.target.value)} />

            {/* Start Date - Changed type to 'date' for proper input behavior */}
            <InputSection label="Start Date" placeholder="Select date" icon="calendar" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />

            {/* Deadline - Changed type to 'date' */}
            <InputSection label="Deadline" placeholder="Select date" icon="calendar" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />

            {/* Budget - Changed type to 'number' */}
            <InputSection label="Budget" placeholder="Enter budget" icon="currency" type="number" value={budget} onChange={e => setBudget(e.target.value)} />

            {/* Toggles */}
            <ToggleOption label="Avoid night travel" checked={avoidNightTravel} onChange={setAvoidNightTravel} />
            <ToggleOption label="Include layovers" checked={includeLayovers} onChange={setIncludeLayovers} />

            {/* Travel Modes */}
            <h3 className="text-white text-lg font-bold px-4 pt-4 pb-2">Travel Modes</h3>
            {/* Added actual icons/placeholders for clarity */}
            <TravelMode label="Flights" selected={selectedMode === "Flights"} onClick={() => setSelectedMode("Flights")} iconType="flight" />
            <TravelMode label="Trains" selected={selectedMode === "Trains"} onClick={() => setSelectedMode("Trains")} iconType="train" />
            <TravelMode label="Buses" selected={selectedMode === "Buses"} onClick={() => setSelectedMode("Buses")} iconType="bus" />

            {/* Submit Button with Loading Spinner */}
            <div className="flex px-4 py-3">
              <button
                onClick={handleGenerateItinerary}
                type="submit"
                className="w-full h-12 rounded-xl bg-[#4c19e5] text-white font-bold text-base flex items-center justify-center"
                disabled={loading} // Disable button while loading
              >
                {loading ? <LoadingSpinner /> : 'Generate Itinerary'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- InputSection Component ---
interface InputSectionProps {
  label: string;
  placeholder: string;
  icon?: string | null; // Optional: 'calendar' or 'currency'
  type?: string; // Added type prop for input (e.g., "date", "number")
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InputSection({ label, placeholder, icon, type = 'text', value, onChange }: InputSectionProps) {
  return (
    <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
      <label className="flex flex-col min-w-40 flex-1">
        <p className="text-white text-base font-medium pb-2">{label}</p>
        <div className="flex w-full items-stretch rounded-xl">
          <input
            type={type} // Set input type dynamically
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            // Adjusted className to allow 'date' and 'number' types to show content correctly
            className="form-input flex w-full flex-1 rounded-xl text-white focus:outline-none bg-[#2d2447] h-14 placeholder:text-[#a093c8] p-4 text-base"
          />
          {icon && (
            <div className="text-[#a093c8] flex items-center justify-center pr-4 rounded-r-xl bg-[#2d2447]">
              {/* Conditional Icon Rendering */}
              {icon === 'calendar' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M208 32h-8V24a8 8 0 0 0-16 0v8H80V24a8 8 0 0 0-16 0v8H48A16 16 0 0 0 32 48v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16Zm0 176H48V88h160ZM48 72V48h160v24Z"></path>
                </svg>
              )}
              {icon === 'currency' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M128 32a96 96 0 1 0 96 96 96.11 96.11 0 0 0-96-96Zm0 176a80 80 0 1 1 80-80 80.09 80.09 0 0 1-80 80Zm40-104H144v-8a8 8 0 0 0-16 0v8h-8a24 24 0 0 0-24 24v16a24 24 0 0 0 24 24h32v8a8 8 0 0 0 16 0v-8h8a24 24 0 0 0 24-24v-16a24 24 0 0 0-24-24Zm8 40h-48v-16h48a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8Z"></path>
                </svg>
              )}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

// --- ToggleOption Component ---
interface ToggleOptionProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function ToggleOption({ label, checked, onChange }: ToggleOptionProps) {
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

// --- TravelMode Component ---
interface TravelModeProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  iconType: 'flight' | 'train' | 'bus' | 'car' | 'metro'; // Added iconType prop
}

function TravelMode({ label, selected, onClick, iconType }: TravelModeProps) {
  const renderIcon = () => {
    switch (iconType) {
      case 'flight': return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M224 160h-56l-48 72v-56H40a8 8 0 0 1 0-16h80V72l48 72h56a8 8 0 0 1 0 16Z"></path>
        </svg>
      );
      case 'train': return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M232 96a8 8 0 0 0-8 8v88a8 8 0 0 1-8 8h-8.4L184 80h-8a8 8 0 0 0-8 8v64h-8v-8a8 8 0 0 0-16 0v8h-8v-8a8 8 0 0 0-16 0v8h-8v-8a8 8 0 0 0-16 0v8h-8v-8a8 8 0 0 0-16 0v8h-8v-64h-8a8 8 0 0 0-8 8v88a8 8 0 0 1-8 8H32a8 8 0 0 0 0 16h192a8 8 0 0 0 0-16Z"></path>
        </svg>
      );
      case 'bus': return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M192 104a16 16 0 1 0 16 16 16 16 0 0 0-16-16Zm-128 0a16 16 0 1 0 16 16 16 16 0 0 0-16-16ZM224 80v64a8 8 0 0 1-8 8h-8v24a16 16 0 0 1-16 16h-8a16 16 0 0 1-16-16v-24h-64v24a16 16 0 0 1-16 16h-8a16 16 0 0 1-16-16v-24h-8a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8h192a8 8 0 0 1 8 8ZM80 160v16h96v-16ZM216 88H40v48h176Z"></path>
        </svg>
      );
      // You can add more cases for 'car', 'metro' etc.
      default: return null;
    }
  };

  return (
    <div
      className={`flex items-center gap-4 bg-[#151122] px-4 min-h-14 cursor-pointer rounded-xl ${ // Added rounded-xl here
        selected ? "border-2 border-[#4c19e5]" : ""
      }`}
      onClick={onClick}
    >
      <div className="text-white flex items-center justify-center rounded-lg bg-[#2d2447] w-10 h-10">
        {renderIcon()}
      </div>
      <p className="text-white text-base flex-1 truncate">{label}</p>
      {selected && (
        <span className="text-[#4c19e5] font-bold ml-2">Selected</span>
      )}
    </div>
  );
}