'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
// Header is provided by the root layout — don't render it again here

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
  const [authChecked, setAuthChecked] = useState(false);
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
    let mounted = true;
    const fetchUser = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/auth/me`, { headers, credentials: 'include' });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          const user = json.user;
          setUserID(user.id);
          setUserName(user.name || user.email || null);
        } else {
          setUserID(null);
          setUserName(null);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setUserID(null);
        setUserName(null);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    };

    fetchUser();

    return () => { mounted = false; };
  }, [router]); // Add router to dependency array

  // Redirect to login after we've checked auth and found no user
  useEffect(() => {
    if (authChecked && !userID) {
      router.push('/login');
    }
  }, [authChecked, userID, router]);

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
      className="relative flex min-h-screen flex-col bg-site overflow-x-hidden"
    >
      <div className="layout-container flex h-full grow flex-col">
        {/* Header removed: rendered in app layout.tsx */}

        {/* Main Body */}
        <main className="px-8 md:px-40 flex flex-1 justify-center py-8">
          {!authChecked ? (
            <div className="flex items-center justify-center w-full py-20">
              <div className="text-site">Checking authentication...</div>
            </div>
          ) : !userID ? (
            // If auth checked and no user, the effect will redirect — show nothing here
            <div className="flex items-center justify-center w-full py-20">
              <div className="text-site">Redirecting to login…</div>
            </div>
          ) : null}
          <div className="flex flex-col w-full max-w-[640px] py-5 animate-fade-up">
            <h1 className="text-site text-[28px] md:text-[32px] font-bold px-4">Plan your trip</h1>

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
                  className="w-full h-12 rounded-xl btn-primary text-white font-bold text-base flex items-center justify-center shadow-md"
                  disabled={loading}
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
        <p className="text-site text-base font-medium pb-2">{label}</p>
        <div className="flex w-full items-stretch rounded-xl">
          <input
            type={type} // Set input type dynamically
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            // Adjusted className to allow 'date' and 'number' types to show content correctly
            className="form-input flex w-full flex-1 rounded-xl text-site focus:outline-none bg-card h-14 placeholder:text-muted p-4 text-base"
          />
          {icon && (
            <div className="text-muted flex items-center justify-center pr-4 rounded-r-xl bg-site/60">
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
    <div className="flex items-center gap-4 bg-card px-4 min-h-14 justify-between">
      <p className="text-site text-base flex-1 truncate">{label}</p>
      <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-site/60 p-0.5">
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
      className={`flex items-center gap-4 bg-card px-4 min-h-14 cursor-pointer rounded-xl ${
        selected ? "border-2 border-primary" : ""
      }`}
      onClick={onClick}
    >
      <div className="text-site flex items-center justify-center rounded-lg bg-site w-10 h-10">
        {renderIcon()}
      </div>
      <p className="text-site text-base flex-1 truncate">{label}</p>
      {selected && (
        <span className="text-primary font-bold ml-2">Selected</span>
      )}
    </div>
  );
}