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
  const [remainingBudget, setRemainingBudget] = useState<number | null>(null);
  const [outboundOptions, setOutboundOptions] = useState<any[]>([]);
  const [returnOptions, setReturnOptions] = useState<any[]>([]);
  const [selectedOutbound, setSelectedOutbound] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null);
  const [initialBudgetNumber, setInitialBudgetNumber] = useState<number | null>(null);
  const [outboundCost, setOutboundCost] = useState<number | null>(null);
  const [returnCost, setReturnCost] = useState<number | null>(null);
  const [sideLocations, setSideLocations] = useState<Array<{name: string; days: number; budget?: number}>>([]);

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

    // Require that user selects at least an outbound travel option first
    if (!outboundCost && !returnCost) {
      setError('Please generate and select travel options first.');
      return;
    }

    setLoading(true); // Start loading animation
    
    const tripDetails = {
      from,
      to,
      startDate,
      deadline,
      budget: Number(budget), // Ensure budget is a number (original total)
      // include selected travel choices and costs so backend can adjust itinerary
      travelSelection: {
        outboundId: selectedOutbound,
        returnId: selectedReturn,
        outboundCost: outboundCost ?? 0,
        returnCost: returnCost ?? 0,
      },
      budgetRemaining: (() => {
        const init = Number(budget);
        const sideSum = sideLocations.reduce((s, loc) => s + (loc.budget || 0), 0);
        return Math.max(0, init - (outboundCost ?? 0) - (returnCost ?? 0) - sideSum);
      })(),
      avoidNightTravel,
      includeLayovers,
      userID,
      selectedMode, // Pass this to backend if your API uses it for filtering
      sideLocations: sideLocations, // Include side locations for multi-destination trips
    };

    // --- Log data being passed to backend ---
    console.log("Data being sent to backend:", tripDetails);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/trips/generate`, {
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

  // --- New: Local planner UI helpers ---
  // Generate travel options heuristically (can be replaced by backend API later)
  const generateBudgetOptions = () => {
    const b = Number(budget);
    if (!b || b <= 0) return;
    const optA = { id: 'a_quarter', label: 'Economy (1/4 budget)', cost: Math.round(b / 4) };
    const optB = { id: 'a_third', label: 'Comfort (1/3 budget)', cost: Math.round(b / 3) };
    setOutboundOptions([optA, optB]);
    setReturnOptions([optA, optB]);
    setInitialBudgetNumber(b);
    setSelectedOutbound(null);
    setSelectedReturn(null);
    setOutboundCost(null);
    setReturnCost(null);
  };

  const selectOption = (which: 'outbound' | 'return', id: string) => {
    const opts = which === 'outbound' ? outboundOptions : returnOptions;
    const opt = opts.find(o => o.id === id);
    if (!opt) return;
    if (which === 'outbound') {
      setSelectedOutbound(id);
      setOutboundCost(opt.cost);
    } else {
      setSelectedReturn(id);
      setReturnCost(opt.cost);
    }
  };

  const addSideLocation = (name: string, days: number) => {
    if (!name) return;
    const newLoc = { name, days, budget: undefined };
    setSideLocations(prev => [...prev, newLoc]);
  };

  const assignBudgetToSide = (index: number, amount: number) => {
    // cap amount to allowed maximum for this index
    const maxAlloc = (() => {
      const init = initialBudgetNumber ?? 0;
      const otherSum = sideLocations.reduce((s, loc, i) => s + (i === index ? 0 : (loc.budget || 0)), 0);
      return Math.max(0, init - travelSum() - otherSum);
    })();
    const capped = Math.max(0, Math.min(amount, maxAlloc));
    setSideLocations(prev => prev.map((s, i) => i === index ? { ...s, budget: capped } : s));
  };

  const travelSum = () => (outboundCost || 0) + (returnCost || 0);
  const sumSideBudgets = () => sideLocations.reduce((s, loc) => s + (loc.budget || 0), 0);

  const getMaxAlloc = (index: number) => {
    const init = initialBudgetNumber ?? 0;
    const otherSum = sideLocations.reduce((s, loc, i) => s + (i === index ? 0 : (loc.budget || 0)), 0);
    return Math.max(0, init - travelSum() - otherSum);
  };

  // Ensure allocations are clamped when budget or travel selection changes
  React.useEffect(() => {
    if (initialBudgetNumber === null) return;
    setSideLocations(prev => prev.map((s, i) => {
      const otherSum = prev.reduce((acc, loc, j) => acc + (j === i ? 0 : (loc.budget || 0)), 0);
      const max = Math.max(0, (initialBudgetNumber ?? 0) - travelSum() - otherSum);
      if ((s.budget || 0) > max) return { ...s, budget: max };
      return s;
    }));
  }, [initialBudgetNumber, outboundCost, returnCost]);

  const travelBookingLink = (fromLoc: string, toLoc: string) => {
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(fromLoc + ' to ' + toLoc)}`;
  };

  const hotelSearchLink = (loc: string) => {
    return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(loc)}`;
  };
  // -------------------------------

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

            {/* Budget split and travel options */}
            <div className="px-4 pt-6">
              <h3 className="text-site font-semibold">Budget & Travel Options</h3>
              <p className="text-muted text-sm">Total budget: ₹{budget || '—'}</p>
              <div className="flex gap-3 mt-3">
                <button onClick={generateBudgetOptions} className="btn-primary px-3 py-2 rounded">Generate Options</button>
                <button onClick={() => { setOutboundOptions([]); setReturnOptions([]); setRemainingBudget(null); setSelectedOutbound(null); setSelectedReturn(null); }} className="px-3 py-2 rounded bg-card">Reset</button>
              </div>

              {initialBudgetNumber !== null && (
                <p className="text-site mt-3">Remaining budget: ₹{(() => {
                  const sideSum = sideLocations.reduce((s, loc) => s + (loc.budget || 0), 0);
                  const travelSum = (outboundCost || 0) + (returnCost || 0);
                  return Math.max(0, initialBudgetNumber - travelSum - sideSum);
                })()}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-site font-medium">Outbound Options</h4>
                  {outboundOptions.length === 0 ? <p className="text-muted">No options yet.</p> : outboundOptions.map(opt => (
                    <div key={opt.id} className={`flex items-center justify-between p-3 rounded-lg mt-2 ${selectedOutbound === opt.id ? 'border-2 border-primary' : 'bg-card'}`}>
                      <div>
                        <div className="text-site font-semibold">{opt.label}</div>
                        <div className="text-muted text-sm">Approx cost: ₹{opt.cost}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a href={travelBookingLink(from || '', to || '')} target="_blank" rel="noreferrer" className="text-primary text-sm">Book travel</a>
                        <button onClick={() => selectOption('outbound', opt.id)} className="px-3 py-1 rounded bg-primary text-black text-sm">Select</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-site font-medium">Return Options</h4>
                  {returnOptions.length === 0 ? <p className="text-muted">No options yet.</p> : returnOptions.map(opt => (
                    <div key={opt.id} className={`flex items-center justify-between p-3 rounded-lg mt-2 ${selectedReturn === opt.id ? 'border-2 border-primary' : 'bg-card'}`}>
                      <div>
                        <div className="text-site font-semibold">{opt.label}</div>
                        <div className="text-muted text-sm">Approx cost: ₹{opt.cost}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a href={travelBookingLink(to || '', from || '')} target="_blank" rel="noreferrer" className="text-primary text-sm">Book travel</a>
                        <button onClick={() => selectOption('return', opt.id)} className="px-3 py-1 rounded bg-primary text-black text-sm">Select</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side locations (multi-destination) */}
              <div className="mt-6">
                <h3 className="text-site font-semibold">Side Locations / Multi-stop</h3>
                <SideLocationForm onAdd={addSideLocation} />
                {sideLocations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {sideLocations.map((s, idx) => {
                          const maxAlloc = getMaxAlloc(idx);
                          const current = s.budget ?? 0;
                          const totalAfter = (initialBudgetNumber ?? 0) - travelSum() - (sumSideBudgets() - current) - current;
                          return (
                            <div key={idx} className="bg-card p-3 rounded">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="text-site font-medium">{s.name} — {s.days} day(s)</div>
                                  <div className="text-muted text-sm">Assigned budget: ₹{current}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a href={hotelSearchLink(s.name)} target="_blank" rel="noreferrer" className="text-primary text-sm">Hotels</a>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={0}
                                  max={maxAlloc}
                                  value={current}
                                  onChange={e => assignBudgetToSide(idx, Math.round(Number(e.target.value)))}
                                  className="flex-1"
                                  disabled={initialBudgetNumber === null}
                                />
                                <input
                                  type="number"
                                  min={0}
                                  max={maxAlloc}
                                  value={current}
                                  onChange={e => {
                                    const val = Math.round(Number(e.target.value) || 0);
                                    const capped = Math.max(0, Math.min(val, maxAlloc));
                                    assignBudgetToSide(idx, capped);
                                  }}
                                  className="w-28 p-1 rounded bg-card text-site"
                                />
                                <button onClick={() => { const amt = Math.round(maxAlloc * 0.5); assignBudgetToSide(idx, amt); }} className="px-2 py-1 rounded bg-primary text-black text-sm">Fill 50%</button>
                              </div>

                              {/* Remaining budget is shown globally above — per-location remainder removed to avoid duplication */}
                            </div>
                          );
                        })}
                  </div>
                )}
              </div>
            </div>

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

// --- SideLocationForm Component ---
function SideLocationForm({ onAdd }: { onAdd: (name: string, days: number) => void }) {
  const [name, setName] = useState('');
  const [days, setDays] = useState<number>(1);

  return (
    <div className="flex gap-2 items-end mt-3">
      <div className="flex-1">
        <label className="text-site text-sm">Location</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Munnar" className="w-full mt-1 p-2 rounded bg-card text-site" />
      </div>
      <div className="w-28">
        <label className="text-site text-sm">Days</label>
        <input type="number" value={days} min={1} onChange={e => setDays(Number(e.target.value))} className="w-full mt-1 p-2 rounded bg-card text-site" />
      </div>
      <div>
        <button onClick={() => { onAdd(name.trim(), days); setName(''); setDays(1); }} className="px-3 py-2 rounded bg-primary text-black">Add</button>
      </div>
    </div>
  );
}
