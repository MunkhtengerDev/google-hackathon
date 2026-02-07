import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Plane, Calendar, MapPin, Wallet, Compass, 
  Users, Globe, Coffee, Car, Utensils, 
  Sun, Cloud, CloudSnow, Leaf,
  ArrowRight, ChevronRight, Check,
  TrendingUp, Hotel, Train, Footprints,
  CloudRain, Wind
} from "lucide-react";

// ============================================
// DESIGN SYSTEM & CONSTANTS
// ============================================

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "MNT", symbol: "₮", name: "Mongolian Tögrög" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "KRW", symbol: "₩", name: "Korean Won" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
];

const FX_RATES = {
  USD: 1,
  MNT: 3450,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149,
  KRW: 1325,
  CNY: 7.23,
};

const SEASON_ICONS = {
  spring: { icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50" },
  summer: { icon: Sun, color: "text-amber-500", bg: "bg-amber-50" },
  autumn: { icon: CloudRain, color: "text-orange-500", bg: "bg-orange-50" },
  winter: { icon: CloudSnow, color: "text-blue-500", bg: "bg-blue-50" },
};

const cx = (...args) => args.filter(Boolean).join(" ");

// ============================================
// UI COMPONENTS (Reusable)
// ============================================

const ProgressDots = ({ current, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={cx(
          "h-1.5 rounded-full transition-all duration-500",
          i === current
            ? "w-6 bg-gradient-to-r from-blue-500 to-purple-500"
            : i < current
            ? "w-3 bg-emerald-400"
            : "w-3 bg-slate-200"
        )}
      />
    ))}
  </div>
);

const AnimatedCard = ({ children, delay = 0 }) => (
  <div
    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const FloatingButton = ({ onClick, disabled, children, variant = "primary" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cx(
      "group relative flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold transition-all duration-300",
      "shadow-lg hover:shadow-xl active:scale-[0.98]",
      variant === "primary"
        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed"
        : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
    )}
  >
    {children}
    {variant === "primary" && (
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    )}
  </button>
);

const Pill = ({ selected, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={cx(
      "group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300",
      "hover:scale-[1.02] active:scale-[0.98]",
      selected
        ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm"
        : "bg-white border-slate-200 hover:border-slate-300"
    )}
  >
    {Icon && (
      <div className={cx(
        "p-2 rounded-xl",
        selected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
      )}>
        <Icon size={18} />
      </div>
    )}
    <span className={cx(
      "font-medium",
      selected ? "text-slate-900" : "text-slate-700"
    )}>
      {children}
    </span>
  </button>
);

const DestinationInput = ({ value, onChange, placeholder, icon: Icon }) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className={cx(
      "relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300",
      focused
        ? "border-blue-400 bg-white shadow-lg shadow-blue-100/50"
        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
    )}>
      {Icon && (
        <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
          <Icon size={20} />
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-lg font-medium placeholder-slate-400"
      />
    </div>
  );
};

const BudgetDisplay = ({ budget, currency, label }) => {
  const localAmount = budget * (FX_RATES[currency] || 1);
  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || "$";
  
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          USD
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900">${budget.toLocaleString()}</span>
        <span className="text-slate-400">USD</span>
      </div>
      <div className="mt-3 text-sm text-slate-500">
        ≈ {symbol}{localAmount.toLocaleString()} {currency}
      </div>
    </div>
  );
};

// ============================================
// FORM STEPS
// ============================================

const StepWelcome = ({ onNext }) => (
  <AnimatedCard>
    <div className="text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-8">
        <Plane className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">Trip Planner</span>
      </div>
      
      <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
        Where will your next adventure take you?
      </h1>
      
      <p className="text-xl text-slate-600 mb-12 leading-relaxed">
        Plan your perfect trip with personalized recommendations for flights, 
        hotels, activities, and more. We'll tailor everything to your preferences.
      </p>
      
      <FloatingButton onClick={onNext}>
        Start Planning
      </FloatingButton>
    </div>
  </AnimatedCard>
);

const StepTripType = ({ value, onChange, onNext, onBack }) => {
  const options = [
    {
      id: "planning",
      icon: Compass,
      title: "Planning to book",
      description: "Get recommendations for flights, hotels, and best times to travel",
    },
    {
      id: "booked",
      icon: Calendar,
      title: "Already booked",
      description: "Optimize your itinerary and discover hidden gems at your destination",
    },
  ];

  return (
    <AnimatedCard>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            What's your travel status?
          </h2>
          <p className="text-lg text-slate-600">
            Choose how we can best help you plan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cx(
                "relative p-8 rounded-3xl border-2 text-left transition-all duration-300",
                "hover:scale-[1.01] active:scale-[0.99]",
                value === option.id
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              {value === option.id && (
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={cx(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6",
                value === option.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
              )}>
                <option.icon size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {option.title}
              </h3>
              <p className="text-slate-600">
                {option.description}
              </p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <FloatingButton onClick={onNext} disabled={!value}>
            Continue
          </FloatingButton>
        </div>
      </div>
    </AnimatedCard>
  );
};

const StepDestination = ({ value, onChange, onNext, onBack, tripType }) => (
  <AnimatedCard>
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">
          {tripType === "booked" ? "Where are you heading?" : "Where would you like to go?"}
        </h2>
        <p className="text-lg text-slate-600">
          Start with a country, then add specific cities if you know them
        </p>
      </div>

      <div className="space-y-6 mb-12">
        <DestinationInput
          value={value.country}
          onChange={(country) => onChange({ ...value, country })}
          placeholder="e.g., Japan"
          icon={Globe}
        />
        
        <DestinationInput
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
          placeholder="e.g., Tokyo (optional)"
          icon={MapPin}
        />
        
        <div className="relative">
          <textarea
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            placeholder="Any specific regions, multiple cities, or special places you'd like to visit?"
            rows={4}
            className="w-full p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white focus:border-blue-400 focus:bg-white outline-none transition-all duration-300 resize-none placeholder-slate-400"
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-400">
            Optional
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>
        <FloatingButton onClick={onNext} disabled={!value.country}>
          Continue
        </FloatingButton>
      </div>
    </div>
  </AnimatedCard>
);

const StepDates = ({ value, onChange, onNext, onBack, tripType }) => {
  const isBooked = tripType === "booked";
  const SeasonIcon = value.seasonPref ? SEASON_ICONS[value.seasonPref]?.icon : Sun;

  return (
    <AnimatedCard>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            When are you traveling?
          </h2>
          <p className="text-lg text-slate-600">
            {isBooked 
              ? "Enter your exact travel dates" 
              : "Tell us your preferred time frame"
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {isBooked ? "Start date" : "Preferred month"}
            </label>
            <div className="relative">
              <input
                type={isBooked ? "date" : "text"}
                value={value.start}
                onChange={(e) => onChange({ ...value, start: e.target.value })}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-blue-400 transition-all"
                placeholder={isBooked ? "YYYY-MM-DD" : "e.g., April"}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {isBooked ? "End date" : "Duration"}
            </label>
            {isBooked ? (
              <input
                type="date"
                value={value.end}
                onChange={(e) => onChange({ ...value, end: e.target.value })}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-blue-400 transition-all"
                placeholder="YYYY-MM-DD"
              />
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={value.duration}
                  onChange={(e) => onChange({ ...value, duration: e.target.value })}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-blue-400 transition-all"
                  placeholder="e.g., 7"
                />
                <div className="absolute right-4 top-4 text-slate-400">days</div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Season preference
            </label>
            <select
              value={value.seasonPref}
              onChange={(e) => onChange({ ...value, seasonPref: e.target.value })}
              className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-blue-400 transition-all appearance-none"
            >
              <option value="">Any season</option>
              <option value="spring">🌸 Spring</option>
              <option value="summer">☀️ Summer</option>
              <option value="autumn">🍂 Autumn</option>
              <option value="winter">❄️ Winter</option>
            </select>
          </div>
        </div>

        {!isBooked && (
          <div className="mb-12">
            <label className="block text-sm font-medium text-slate-700 mb-4">
              What matters most for your timing?
            </label>
            <div className="flex flex-wrap gap-3">
              {["Best weather", "Avoid crowds", "Festivals", "Lowest prices"].map((option) => (
                <Pill
                  key={option}
                  selected={value.flexibility?.includes(option)}
                  onClick={() => {
                    const current = value.flexibility || [];
                    const updated = current.includes(option)
                      ? current.filter((item) => item !== option)
                      : [...current, option];
                    onChange({ ...value, flexibility: updated });
                  }}
                >
                  {option}
                </Pill>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <FloatingButton onClick={onNext} disabled={!value.start}>
            Continue
          </FloatingButton>
        </div>
      </div>
    </AnimatedCard>
  );
};

const StepBudget = ({ value, onChange, onNext, onBack }) => {
  const [currency, setCurrency] = useState("USD");
  const localBudget = value.total * (FX_RATES[currency] || 1);
  const localSavings = value.savings * (FX_RATES[currency] || 1);
  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || "$";

  return (
    <AnimatedCard>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            What's your budget?
          </h2>
          <p className="text-lg text-slate-600">
            We'll show prices in your preferred currency
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <label className="text-sm font-medium text-slate-700">
              Display currency
            </label>
            <div className="flex gap-2">
              {CURRENCIES.slice(0, 4).map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => setCurrency(curr.code)}
                  className={cx(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    currency === curr.code
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {curr.code}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Total trip budget (USD)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-2xl font-bold text-slate-300">
                  $
                </div>
                <input
                  type="number"
                  min="0"
                  value={value.total}
                  onChange={(e) => onChange({ ...value, total: Number(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 bg-white text-2xl font-bold outline-none focus:border-blue-400 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="text-sm text-slate-500">
                ≈ {symbol}{localBudget.toLocaleString()} {currency}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Available savings (USD)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-2xl font-bold text-slate-300">
                  $
                </div>
                <input
                  type="number"
                  min="0"
                  value={value.savings}
                  onChange={(e) => onChange({ ...value, savings: Number(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 bg-white text-2xl font-bold outline-none focus:border-blue-400 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="text-sm text-slate-500">
                ≈ {symbol}{localSavings.toLocaleString()} {currency}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-slate-900">Budget insights</h4>
            </div>
            <p className="text-sm text-slate-600">
              Based on your budget, we'll recommend accommodations, activities, 
              and dining options that fit your spending range.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <FloatingButton onClick={onNext} disabled={!value.total}>
            Continue
          </FloatingButton>
        </div>
      </div>
    </AnimatedCard>
  );
};

const StepTravelStyle = ({ value, onChange, onNext, onBack }) => (
  <AnimatedCard>
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">
          What's your travel style?
        </h2>
        <p className="text-lg text-slate-600">
          Tell us what you love to do while traveling
        </p>
      </div>

      <div className="space-y-8 mb-12">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Describe your ideal trip
          </label>
          <textarea
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            rows={4}
            placeholder="e.g., I enjoy exploring local markets, hiking in nature, trying street food, and visiting historical sites..."
            className="w-full p-5 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-blue-400 transition-all resize-none placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Select your interests
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { label: "Nature", icon: Leaf },
              { label: "City life", icon: Hotel },
              { label: "History", icon: Compass },
              { label: "Adventure", icon: Wind },
              { label: "Food", icon: Utensils },
              { label: "Relaxation", icon: Sun },
              { label: "Photography", icon: Cloud },
              { label: "Shopping", icon: Wallet },
            ].map((item) => (
              <Pill
                key={item.label}
                selected={value.interests?.includes(item.label)}
                onClick={() => {
                  const current = value.interests || [];
                  const updated = current.includes(item.label)
                    ? current.filter((i) => i !== item.label)
                    : [...current, item.label];
                  onChange({ ...value, interests: updated });
                }}
                icon={item.icon}
              >
                {item.label}
              </Pill>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100">
          <div className="flex items-center gap-3 mb-3">
            <Compass className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-slate-900">Personalized recommendations</h4>
          </div>
          <p className="text-sm text-slate-600">
            Based on your style, we'll curate experiences, restaurants, and 
            activities that match your preferences.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>
        <FloatingButton onClick={onNext} disabled={!value.description}>
          Continue
        </FloatingButton>
      </div>
    </div>
  </AnimatedCard>
);

const StepTransportation = ({ value, onChange, onNext, onBack }) => {
  const options = [
    { id: "walking", label: "Walking", icon: Footprints },
    { id: "public", label: "Public transport", icon: Train },
    { id: "taxi", label: "Taxi/Rideshare", icon: Car },
    { id: "rental", label: "Rental car", icon: Car },
    { id: "bike", label: "Bike/Scooter", icon: Compass },
  ];

  return (
    <AnimatedCard>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            How do you prefer to get around?
          </h2>
          <p className="text-lg text-slate-600">
            Select all that apply to your travel style
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                const current = value.modes || [];
                const updated = current.includes(option.id)
                  ? current.filter((m) => m !== option.id)
                  : [...current, option.id];
                onChange({ ...value, modes: updated });
              }}
              className={cx(
                "flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.98]",
                (value.modes || []).includes(option.id)
                  ? "border-blue-400 bg-gradient-to-br from-blue-50 to-white shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className={cx(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                (value.modes || []).includes(option.id)
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-100 text-slate-600"
              )}>
                <option.icon size={24} />
              </div>
              <span className="font-medium text-slate-900">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-12">
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Any special transportation needs?
          </label>
          <textarea
            value={value.notes || ""}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            rows={3}
            placeholder="e.g., Prefer walking-friendly areas, need accessible options, avoid driving in cities..."
            className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-blue-400 transition-all resize-none placeholder-slate-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <FloatingButton onClick={onNext} disabled={!value.modes?.length}>
            Continue
          </FloatingButton>
        </div>
      </div>
    </AnimatedCard>
  );
};

const StepFoodPreferences = ({ value, onChange, onNext, onBack }) => {
  const options = [
    "Local cuisine",
    "Vegetarian",
    "Vegan",
    "Halal",
    "Kosher",
    "No restrictions",
    "Other",
  ];

  const hasOther = value.types?.includes("Other");

  return (
    <AnimatedCard>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            What are your food preferences?
          </h2>
          <p className="text-lg text-slate-600">
            Help us recommend the best dining experiences for you
          </p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-3 mb-6">
            {options.map((option) => {
              const selected = value.types?.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    if (option === "No restrictions" && !selected) {
                      onChange({ ...value, types: ["No restrictions"], other: "" });
                      return;
                    }

                    const current = value.types?.filter(x => x !== "No restrictions") || [];
                    const updated = selected
                      ? current.filter(x => x !== option)
                      : [...current, option];
                    onChange({ ...value, types: updated });
                  }}
                  className={cx(
                    "px-5 py-3 rounded-2xl border-2 transition-all duration-300",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    selected
                      ? "border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <span className={cx(
                    "font-medium",
                    selected ? "text-orange-700" : "text-slate-700"
                  )}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {hasOther && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Please specify
              </label>
              <input
                type="text"
                value={value.other || ""}
                onChange={(e) => onChange({ ...value, other: e.target.value })}
                placeholder="e.g., gluten-free, no seafood, lactose-free..."
                className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-orange-400 transition-all"
              />
            </div>
          )}

          <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
            <div className="flex items-center gap-3 mb-3">
              <Utensils className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-slate-900">Food recommendations</h4>
            </div>
            <p className="text-sm text-slate-600">
              We'll suggest restaurants, local dishes, and food experiences 
              based on your preferences.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <FloatingButton onClick={onNext} disabled={!value.types?.length}>
            Continue
          </FloatingButton>
        </div>
      </div>
    </AnimatedCard>
  );
};

const StepSummary = ({ data, onEdit, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit();
    }, 1500);
  };

  const getSeasonIcon = (season) => {
    if (!season) return Sun;
    return SEASON_ICONS[season]?.icon || Sun;
  };
  const SeasonIcon = getSeasonIcon(data.dates?.seasonPref);

  return (
    <AnimatedCard>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Review your trip details
          </h2>
          <p className="text-lg text-slate-600">
            Everything looks great! Submit to get your personalized travel plan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Trip Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Status</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {data.tripType === "booked" ? "Already booked" : "Planning"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Destination</span>
                  <span className="font-medium text-slate-900">
                    {data.destination?.country}
                    {data.destination?.city && `, ${data.destination.city}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Travel dates</span>
                  <span className="font-medium text-slate-900">
                    {data.dates?.start} 
                    {data.dates?.end ? ` - ${data.dates.end}` : data.dates?.duration ? ` (${data.dates.duration} days)` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Season</span>
                  <div className="flex items-center gap-2">
                    <SeasonIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-900 capitalize">
                      {data.dates?.seasonPref || "Any"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Budget</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total budget</span>
                  <span className="font-bold text-slate-900">
                    ${data.budget?.total?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Available savings</span>
                  <span className="font-medium text-slate-900">
                    ${data.budget?.savings?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Preferences</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600 mb-2">Travel style</div>
                  <p className="text-slate-800">
                    {data.travelStyle?.description || "Not specified"}
                  </p>
                </div>
                {data.travelStyle?.interests?.length > 0 && (
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Interests</div>
                    <div className="flex flex-wrap gap-2">
                      {data.travelStyle.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Transportation</h3>
                <div className="space-y-2">
                  {data.transportation?.modes?.map((mode) => (
                    <div key={mode} className="flex items-center gap-2 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Food</h3>
                <div className="space-y-2">
                  {data.food?.types?.slice(0, 3).map((type) => (
                    <div key={type} className="flex items-center gap-2 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      {type}
                    </div>
                  ))}
                  {data.food?.types?.length > 3 && (
                    <div className="text-sm text-slate-500">
                      +{data.food.types.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onEdit}
            className="px-8 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Edit Details
          </button>
          <FloatingButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Your Plan...
              </>
            ) : (
              "Generate Travel Plan"
            )}
          </FloatingButton>
        </div>
      </div>
    </AnimatedCard>
  );
};

const StepComplete = ({ data, onNewTrip }) => {
  return (
    <AnimatedCard>
      <div className="text-center max-w-2xl mx-auto">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl -z-10" />
        </div>

        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          Your trip is planned! ✈️
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 leading-relaxed">
          We've created a personalized itinerary for your trip to{" "}
          <span className="font-semibold text-slate-900">
            {data.destination?.country}
            {data.destination?.city && `, ${data.destination.city}`}
          </span>
          . Check your email for the complete travel plan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
            <div className="text-2xl font-bold text-slate-900 mb-2">
              ${data.budget?.total?.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">Estimated budget</div>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {data.dates?.duration || "7"} days
            </div>
            <div className="text-sm text-slate-600">Trip duration</div>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {data.food?.types?.length || 0}
            </div>
            <div className="text-sm text-slate-600">Food preferences</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <FloatingButton onClick={onNewTrip} variant="secondary">
            Plan Another Trip
          </FloatingButton>
          <button
            onClick={() => {
              const json = JSON.stringify(data, null, 2);
              navigator.clipboard.writeText(json);
              alert("Trip data copied to clipboard!");
            }}
            className="px-8 py-4 rounded-full border-2 border-slate-200 text-slate-700 font-medium hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Copy Trip Data
          </button>
        </div>
      </div>
    </AnimatedCard>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function PremiumTripPlanner() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    tripType: "",
    destination: { country: "", city: "", notes: "" },
    dates: { start: "", end: "", duration: 7, seasonPref: "", flexibility: [] },
    budget: { total: 1200, savings: 2000 },
    travelStyle: { description: "", interests: [] },
    transportation: { modes: [], notes: "" },
    food: { types: [], other: "" },
  });
  const [completed, setCompleted] = useState(false);

  const steps = [
    { id: "welcome", component: StepWelcome },
    { id: "tripType", component: StepTripType },
    { id: "destination", component: StepDestination },
    { id: "dates", component: StepDates },
    { id: "budget", component: StepBudget },
    { id: "travelStyle", component: StepTravelStyle },
    { id: "transportation", component: StepTransportation },
    { id: "food", component: StepFoodPreferences },
    { id: "summary", component: StepSummary },
    { id: "complete", component: StepComplete },
  ];

  const CurrentStep = steps[step].component;
  const stepIndex = step;

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    }
  }, [step, steps.length]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  }, [step]);

  const handleDataUpdate = useCallback((updates) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleEdit = useCallback(() => {
    setStep(5); // Go back to preferences step for editing
  }, []);

  const handleSubmit = useCallback(() => {
    console.log("Submitted data:", data);
    setStep(steps.length - 1);
    setCompleted(true);
  }, [data, steps.length]);

  const handleNewTrip = useCallback(() => {
    setData({
      tripType: "",
      destination: { country: "", city: "", notes: "" },
      dates: { start: "", end: "", duration: 7, seasonPref: "", flexibility: [] },
      budget: { total: 1200, savings: 2000 },
      travelStyle: { description: "", interests: [] },
      transportation: { modes: [], notes: "" },
      food: { types: [], other: "" },
    });
    setStep(0);
    setCompleted(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900">TripPlanner</div>
                <div className="text-xs text-slate-500">Personal travel assistant</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {step > 0 && step < steps.length - 1 && (
                <div className="hidden md:block">
                  <div className="text-xs font-medium text-slate-500 mb-2">
                    Step {step} of {steps.length - 2}
                  </div>
                  <ProgressDots current={step - 1} total={steps.length - 2} />
                </div>
              )}
              
              {step > 0 && step < steps.length - 1 && (
                <button
                  onClick={handleNewTrip}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Start over
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {step === 0 && <CurrentStep onNext={handleNext} />}
        {step === 1 && (
          <CurrentStep
            value={data.tripType}
            onChange={(value) => handleDataUpdate({ tripType: value })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 2 && (
          <CurrentStep
            value={data.destination}
            onChange={(value) => handleDataUpdate({ destination: value })}
            onNext={handleNext}
            onBack={handleBack}
            tripType={data.tripType}
          />
        )}
        {step === 3 && (
          <CurrentStep
            value={data.dates}
            onChange={(value) => handleDataUpdate({ dates: value })}
            onNext={handleNext}
            onBack={handleBack}
            tripType={data.tripType}
          />
        )}
        {step === 4 && (
          <CurrentStep
            value={data.budget}
            onChange={(value) => handleDataUpdate({ budget: value })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 5 && (
          <CurrentStep
            value={data.travelStyle}
            onChange={(value) => handleDataUpdate({ travelStyle: value })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 6 && (
          <CurrentStep
            value={data.transportation}
            onChange={(value) => handleDataUpdate({ transportation: value })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 7 && (
          <CurrentStep
            value={data.food}
            onChange={(value) => handleDataUpdate({ food: value })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 8 && (
          <CurrentStep
            data={data}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
          />
        )}
        {step === 9 && (
          <CurrentStep
            data={data}
            onNewTrip={handleNewTrip}
          />
        )}
      </main>

      {/* Debug Panel (Optional) */}
      {process.env.NODE_ENV === 'development' && step > 0 && step < steps.length - 1 && (
        <div className="fixed bottom-4 right-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-lg max-w-xs">
          <div className="text-xs font-medium text-slate-700 mb-2">Debug</div>
          <div className="text-xs text-slate-500">
            Step: {step}/{steps.length - 1}
          </div>
          <div className="text-xs text-slate-500">
            Trip Type: {data.tripType || "Not set"}
          </div>
        </div>
      )}
    </div>
  );
}