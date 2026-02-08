import React, { useMemo, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

// UI Wrappers
import PlannerShell from '../../ui/PlannerShell.jsx';
import TransitionScreen from '../../ui/TransitionScreen.jsx';

// Sections (Existing)
import TripStatusSection from './sections/TripStatusSection.jsx';
import HomeContextSection from './sections/HomeContextSection.jsx';
import DestinationSection from './sections/DestinationSection.jsx';
import SeasonSection from './sections/SeasonSection.jsx';
import BudgetSection from './sections/BudgetSection.jsx';

// Sections (NEW/UPDATED)
import FoodSection from './sections/FoodSection.jsx';
import MobilitySection from './sections/MobilitySection.jsx';
import TravelStyleSection from './sections/TravelStyleSection.jsx';
import GroupSection from './sections/GroupSection.jsx';
import AccommodationSection from './sections/AccommodationSection.jsx';
import ExperienceGoalsSection from './sections/ExperienceGoalsSection.jsx';
import PermissionsSection from './sections/PermissionsSection.jsx';

// Visualizers
import MapVisualizer from './visualizers/MapVisualizer.jsx';
import CalendarVisualizer from './visualizers/CalendarVisualizer.jsx';
import SummaryVisualizer from './visualizers/SummaryVisualizer.jsx';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:9008'
).replace(/\/$/, '');

// --- Constants ---

const ALLOWED_INTERESTS = new Set([
  'city', 'culture', 'history', 'food', 'nature', 'art', 
  'adventure', 'relaxation', 'nightlife', 'shopping', 'photography'
]);

// Step Definitions
const ALL_STEPS = [
  { key: 'status', title: 'Define Your Journey Type', subtitle: 'Choose planning mode to tailor recommendations and pacing.', visual: 'summary' },
  { key: 'context', title: 'Set Your Home Context', subtitle: 'Departure location and currency shape the route strategy.', visual: 'map' },
  { key: 'destination', title: 'Shape The Destination Map', subtitle: 'Add multiple countries, cities, or regions for route planning.', visual: 'map' },
  { key: 'season', title: 'Tune Timing & Seasonality', subtitle: 'Balance weather, crowds, and value windows for better timing.', visual: 'calendar' },
  { key: 'budget', title: 'Engineer The Budget', subtitle: 'Set cost priorities so the plan fits your travel style.', visual: 'summary' },
  { key: 'food', title: 'Food Preferences', subtitle: 'Tell us what you want to eat (or avoid) for better recommendations.', visual: 'summary' },
  // Group & Accom moved before Mobility
  { key: 'group', title: 'Group Composition', subtitle: 'Right pacing and filters for families, couples, and groups.', visual: 'summary' },
  { key: 'accommodation', title: 'Accommodation Status', subtitle: 'Map-centric planning works best when we know where you’ll stay.', visual: 'map' },
  { key: 'mobility', title: 'Mobility & Movement', subtitle: 'Optimize routes and hotel placement based on your comfort range.', visual: 'map' },
  { key: 'style', title: 'Travel Style & Interests', subtitle: 'Pick interests and describe your taste for deeper personalization.', visual: 'summary' },
  { key: 'goals', title: 'Experience Goals', subtitle: 'This becomes the narrative anchor for the itinerary.', visual: 'summary', condition: (data) => data.tripStatus === 'booked' },
  { key: 'permissions', title: 'AI Permissions', subtitle: 'Control how the AI can optimize and remember your preferences.', visual: 'summary' },
];

function defaultState() {
  return {
    tripStatus: '', 
    context: { homeCountry: '', departureCity: '', currency: 'USD', nearbyAirports: false, departureAirportCode: '' },
    destination: { countries: [], cities: [], regions: [], continents: [], flexibility: 'fixed', dayTripsPlanned: false },
    dates: { start: '', end: '', durationDays: 7, durationRange: { min: '', max: '' }, canChangeDates: 'no', timingPriority: [], seasonPref: 'no_preference' },
    budget: { currency: 'USD', usdBudget: 0, budgetType: 'total', savedAmountUsd: 0, isFlexible: true, priority: 'balance', spendingStyle: 'track', emergencyBufferUsd: 0 },
    food: { diet: [], importance: 'nice', notes: '' },
    mobility: { preferredTransport: [], comfortRange: '30', notes: '' },
    style: { interests: [], tasteText: '', travelPace: 'balanced', hates: [], pastLoved: [] },
    group: { who: 'solo', adults: 1, childrenAges: [], totalPeople: 1 },
    accommodation: { 
      status: 'not_booked', 
      type: '', 
      preference: [], 
      hotels: [], // Stores location objects {lat, lng, name}
      budgetPerNight: 0 
    },
    goals: { experienceGoals: [], oneSentenceGoal: '' },
    permissions: { allowAltDestinations: true, allowBudgetOptimize: true, allowDailyAdjust: false, allowSaveForFuture: true },
  };
}

function mergePlannerData(base, loaded) {
  if (!loaded || typeof loaded !== 'object') return base;
  return {
    ...base,
    ...loaded,
    context: { ...base.context, ...(loaded.context || {}) },
    destination: { ...base.destination, ...(loaded.destination || {}) },
    dates: { ...base.dates, ...(loaded.dates || {}) },
    budget: { ...base.budget, ...(loaded.budget || {}) },
    food: { ...base.food, ...(loaded.food || {}) },
    mobility: { ...base.mobility, ...(loaded.mobility || {}) },
    style: { ...base.style, ...(loaded.style || {}) },
    group: { ...base.group, ...(loaded.group || {}) },
    accommodation: { ...base.accommodation, ...(loaded.accommodation || {}) },
    goals: { ...base.goals, ...(loaded.goals || {}) },
    permissions: { ...base.permissions, ...(loaded.permissions || {}) },
  };
}

function isStepComplete(stepKey, data) {
  switch (stepKey) {
    case 'status': return Boolean(data.tripStatus);
    case 'context': return Boolean(data.context.homeCountry?.trim()) && Boolean(data.context.departureCity?.trim());
    case 'destination': return (data.destination.countries?.length || 0) + (data.destination.cities?.length || 0) + (data.destination.regions?.length || 0) > 0;
    case 'season': return data.tripStatus === 'booked' ? (Boolean(data.dates.start) && Boolean(data.dates.end)) : Boolean(data.dates.start);
    case 'budget': return Number(data.budget.usdBudget || 0) > 0;
    case 'food': return Boolean(data.food?.importance);
    case 'group': return Boolean(data.group?.who);
    // Accommodation is valid if status is set. If booked, ideally hotels exist, but we won't block strict validation.
    case 'accommodation': return Boolean(data.accommodation?.status); 
    case 'mobility': return (data.mobility?.preferredTransport?.length || 0) > 0;
    default: return true;
  }
}

// ... (Payload Construction helpers omitted for brevity, same as previous logic) ...
// Ensure you keep your buildPreferencesPayload function here

export default function TripOnboarding({ token, onCompleted, initialData }) {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [data, setData] = useState(() => mergePlannerData(defaultState(), initialData));
  const [step, setStep] = useState(0);
  const [rightQuery, setRightQuery] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const visibleSteps = useMemo(() => {
    return ALL_STEPS.filter((s) => !s.condition || s.condition(data));
  }, [data.tripStatus]);

  const stepConfig = visibleSteps[step];
  const stepsCount = visibleSteps.length;
  const isLastStep = step === stepsCount - 1;
  const canContinue = isStepComplete(stepConfig?.key, data);

  // Map Logic
  const defaultMapQuery = useMemo(() => {
    if (!stepConfig) return 'World';
    if (stepConfig.key === 'context') return [data.context.departureCity, data.context.homeCountry].filter(Boolean).join(', ') || 'World';
    if (['destination', 'mobility', 'accommodation'].includes(stepConfig.key)) {
      // Prioritize last entered city/country
      return data.destination.cities?.slice(-1)[0] || data.destination.countries?.slice(-1)[0] || 'World';
    }
    return 'World';
  }, [stepConfig, data.context, data.destination]);

  const markers = useMemo(() => {
    // If in Mobility or Accom step, show hotel markers if they exist
    if (['mobility', 'accommodation'].includes(stepConfig?.key) && data.accommodation.hotels?.length > 0) {
      return data.accommodation.hotels; // These objects should have {lat, lng}
    }
    return [...(data.destination.countries || []), ...(data.destination.cities || []), ...(data.destination.regions || [])].slice(0, 12);
  }, [data.destination, data.accommodation.hotels, stepConfig]);

  const rightContent = useMemo(() => {
    if (!stepConfig) return null;
    if (stepConfig.visual === 'map') {
      return (
        <MapVisualizer
          apiKey={mapsApiKey}
          query={rightQuery?.trim() || defaultMapQuery}
          label={stepConfig.key === 'context' ? 'Home Base' : 'Preview'}
          markers={markers}
        />
      );
    }
    if (stepConfig.visual === 'calendar') {
        return <CalendarVisualizer startDate={data.dates.start} endDate={data.dates.end} title="Trip Plan" location={data.destination.cities?.[0] || "Trip"} />;
    }
    return <SummaryVisualizer data={data} />;
  }, [stepConfig, rightQuery, defaultMapQuery, mapsApiKey, markers, data]);

  // Handlers
  const handleNext = async () => {
    if (!canContinue || isSaving) return;
    setSaveError('');
    if (isLastStep) {
        setTransitionMsg('Building your dream itinerary...');
        setIsTransitioning(true);
        // await saveTravelPreferences(); // Call your save logic here
        return;
    }
    setTransitionMsg('Processing...');
    setIsTransitioning(true);
  };

  const handleTransitionDone = () => {
    setIsTransitioning(false);
    setStep((s) => s + 1);
    setRightQuery('');
  };

  const handleBack = () => {
    if (isSaving || step === 0) return;
    setStep((s) => s - 1);
    setRightQuery('');
  };

  return (
    <PlannerShell
      stepIndex={step}
      stepsCount={stepsCount}
      title={stepConfig?.title}
      subtitle={stepConfig?.subtitle}
      rightContent={rightContent}
      onBack={handleBack}
    >
      {isTransitioning && <TransitionScreen onDone={handleTransitionDone} customMessage={transitionMsg} />}
      
      <div className={`transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        
        {stepConfig?.key === 'status' && <TripStatusSection value={data.tripStatus} onChange={(v) => setData(d => ({...d, tripStatus: v}))} />}
        {stepConfig?.key === 'context' && <HomeContextSection value={data.context} onChange={(v) => setData(d => ({...d, context: v}))} mapsApiKey={mapsApiKey} onFocusQuery={setRightQuery} />}
        {stepConfig?.key === 'destination' && <DestinationSection value={data.destination} onChange={(v) => setData(d => ({...d, destination: v}))} mapsApiKey={mapsApiKey} onFocusQuery={setRightQuery} />}
        {stepConfig?.key === 'season' && <SeasonSection tripStatus={data.tripStatus} value={data.dates} onChange={(v) => setData(d => ({...d, dates: v}))} />}
        {stepConfig?.key === 'budget' && <BudgetSection tripStatus={data.tripStatus} value={data.budget} onChange={(v) => setData(d => ({...d, budget: v}))} />}
        {stepConfig?.key === 'food' && <FoodSection tripStatus={data.tripStatus} value={data.food} onChange={(v) => setData(d => ({...d, food: v}))} />}
        
        {stepConfig?.key === 'group' && <GroupSection value={data.group} onChange={(v) => setData(d => ({...d, group: v}))} />}
        
        {stepConfig?.key === 'accommodation' && (
          <AccommodationSection 
            value={data.accommodation} 
            onChange={(v) => setData(d => ({...d, accommodation: v}))} 
            mapsApiKey={mapsApiKey} 
            onFocusQuery={setRightQuery} 
          />
        )}
        
        {stepConfig?.key === 'mobility' && (
          <MobilitySection 
            value={data.mobility} 
            onChange={(v) => setData(d => ({...d, mobility: v}))} 
            hotels={data.accommodation.hotels} // PASSING HOTELS HERE
            mapsApiKey={mapsApiKey} 
            onFocusQuery={setRightQuery} 
          />
        )}
        
        {stepConfig?.key === 'style' && <TravelStyleSection tripStatus={data.tripStatus} value={data.style} onChange={(v) => setData(d => ({...d, style: v}))} />}
        {stepConfig?.key === 'goals' && <ExperienceGoalsSection tripStatus={data.tripStatus} value={data.goals} onChange={(v) => setData(d => ({...d, goals: v}))} />}
        {stepConfig?.key === 'permissions' && <PermissionsSection tripStatus={data.tripStatus} value={data.permissions} onChange={(v) => setData(d => ({...d, permissions: v}))} />}

        <div className="mt-12 flex items-center gap-4">
          <button onClick={handleNext} disabled={!canContinue || isSaving} className={`h-14 px-8 rounded-full font-semibold text-lg flex items-center gap-3 transition-all ${canContinue ? 'bg-[#FF385C] text-white shadow-lg hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {isLastStep ? 'Generate Plan' : 'Continue'}
            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </PlannerShell>
  );
}