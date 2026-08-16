/* eslint-disable @next/next/no-img-element -- External travel-provider images are rendered from runtime provider URLs. */

"use client";
import { useMemo, useState } from "react";
import {
  GuidedUtilityShell,
  type GuidedUtilityStep,
} from "@/components/site/tools/guided-utility-shell";
import type {
  TravelDiscoveryKind,
  TravelDiscoveryResponse,
  TravelPlaceSuggestion,
  TravelProviderReport,
} from "@/lib/travel-provider-contract";
type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (value: number) => void;
};
function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
function NumberField({
  id,
  label,
  value,
  min = 0,
  max = 1_000_000,
  suffix,
  onChange,
}: NumberFieldProps) {
  return (
    <label
      htmlFor={id}
      className="border-border bg-background block rounded-xl border p-4"
    >
      <span className="block text-sm font-semibold">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          autoComplete="off"
          aria-label={label}
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const parsed = parseNumber(event.target.value, min);
            onChange(Math.min(max, Math.max(min, parsed)));
          }}
          className="border-border bg-background min-w-0 flex-1 rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
        />
        {suffix ? <span className="text-muted-foreground text-sm">{suffix}</span> : null}
      </div>
    </label>
  );
}
type TravelSearchStatus = "idle" | "loading" | "success" | "error";
type TravelSearchState = {
  status: TravelSearchStatus;
  suggestions: TravelPlaceSuggestion[];
  providers: TravelProviderReport[];
  message: string | null;
};
function createTravelSearchState(): TravelSearchState {
  return {
    status: "idle",
    suggestions: [],
    providers: [],
    message: null,
  };
}
type TravelDiscoveryPanelProps = {
  label: string;
  title: string;
  description: string;
  searchLabel: string;
  destination: string;
  budgetContext: string;
  state: TravelSearchState;
  onSearch: () => void;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatProviderName(provider: TravelProviderReport["provider"]): string {
  switch (provider) {
    case "google-places":
      return "Google Places";
    case "foursquare":
      return "Foursquare";
    case "amadeus":
      return "Amadeus";
    default:
      return provider;
  }
}
function formatPriceLevel(value: TravelPlaceSuggestion["priceLevel"]): string | null {
  if (value === "unknown") {
    return null;
  }
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function TravelDiscoveryPanel({
  label,
  title,
  description,
  searchLabel,
  destination,
  budgetContext,
  state,
  onSearch,
}: TravelDiscoveryPanelProps) {
  const canSearch = destination.trim().length >= 2;
  const isLoading = state.status === "loading";
  return (
    <article className="border-border rounded-2xl border p-5">
      <p className="text-xs font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300">
        {label}
      </p>
      <h3 className="mt-2 text-lg font-bold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
      <div className="bg-muted/40 mt-4 rounded-xl p-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Your budget context
        </p>
        <p className="mt-1 text-sm font-semibold">{budgetContext}</p>
      </div>
      <button
        type="button"
        onClick={onSearch}
        disabled={!canSearch || isLoading}
        className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Searching..." : searchLabel}
      </button>
      {!canSearch ? (
        <p className="mt-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
          Enter a destination above before searching.
        </p>
      ) : null}
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {state.message}
        </div>
      ) : null}

      {state.status === "success" && state.suggestions.length === 0 ? (
        <div className="border-border bg-muted/30 mt-4 rounded-xl border p-3 text-sm">
          No matching places were returned for this destination.
        </div>
      ) : null}
      {state.suggestions.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Live suggestions
          </p>
          {state.suggestions.map((place) => {
            const price = formatPriceLevel(place.priceLevel);
            const coordinateMapUrl =
              place.latitude !== null && place.longitude !== null
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${place.latitude},${place.longitude}`,
                  )}`
                : null;
            const mapUrl = place.mapUrl ?? coordinateMapUrl;
            return (
              <div
                key={`${place.provider}-${place.id}`}
                className="border-border bg-background rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="leading-5 font-bold">{place.name}</h4>
                    {place.primaryType ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {place.primaryType}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center"
                    title="Knowledge Nest"
                    aria-label="Knowledge Nest"
                  >
                    <img
                      src="/brand/knowledge-nest-mark-512.png"
                      alt=""
                      aria-hidden="true"
                      className="h-6 w-6 rounded-md object-contain"
                    />
                  </span>
                </div>
                {place.address ? (
                  <p className="text-muted-foreground mt-3 text-sm leading-5">
                    {place.address}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {place.rating !== null ? (
                    <span className="bg-muted rounded-lg px-2.5 py-1">
                      Rating: {place.rating.toFixed(1)}
                    </span>
                  ) : null}
                  {place.reviewCount !== null ? (
                    <span className="bg-muted rounded-lg px-2.5 py-1">
                      Reviews: {place.reviewCount}
                    </span>
                  ) : null}
                  {price ? (
                    <span className="bg-muted rounded-lg px-2.5 py-1">
                      Price: {price}
                    </span>
                  ) : null}
                </div>
                {mapUrl || place.websiteUrl ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border-border hover:bg-muted rounded-lg border px-3 py-2 text-xs font-semibold"
                      >
                        View map
                      </a>
                    ) : null}
                    {place.websiteUrl ? (
                      <a
                        href={place.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border-border hover:bg-muted rounded-lg border px-3 py-2 text-xs font-semibold"
                      >
                        Visit website
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
const TRAVEL_GUIDED_STEPS: readonly GuidedUtilityStep[] = [
  {
    id: "destination",
    eyebrow: "Step 1",
    title: "Choose your destination",
    description:
      "Start with where you want to travel, your trip dates, and how many people are going.",
    helper:
      "Destination context will later power hotel, restaurant, attraction, local-place, transport, and realistic budget suggestions.",
  },
  {
    id: "budget",
    eyebrow: "Step 2",
    title: "Set your spending limits",
    description:
      "Decide your total trip budget and the amounts you are comfortable spending on accommodation, food, transport, activities, and extras.",
    helper:
      "Your own spending limits stay important even after live provider prices are connected.",
  },
  {
    id: "options",
    eyebrow: "Step 3",
    title: "Compare destination options",
    description:
      "Review accommodation, restaurant, attraction, and local travel suggestions against your selected destination and budget.",
    helper:
      "Provider cards are prepared in this phase. Live Google Places, hotel, restaurant, and travel-provider data will be connected through secure server-side APIs later.",
  },
  {
    id: "plan",
    eyebrow: "Step 4",
    title: "Build your final trip plan",
    description:
      "Combine your destination, travelers, budget, selected places, and cost estimates into one understandable trip plan.",
    helper:
      "The existing budget calculator remains available below as the current working calculation engine.",
  },
];
export function TravelTripBudgetPlanner() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [overallBudget, setOverallBudget] = useState(1500);
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(5);
  const [accommodationPerNight, setAccommodationPerNight] = useState(120);
  const [foodPerPersonDay, setFoodPerPersonDay] = useState(45);
  const [transportTotal, setTransportTotal] = useState(300);
  const [activitiesPerPerson, setActivitiesPerPerson] = useState(100);
  const [extrasTotal, setExtrasTotal] = useState(100);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [hotelSearch, setHotelSearch] = useState<TravelSearchState>(() =>
    createTravelSearchState(),
  );
  const [restaurantSearch, setRestaurantSearch] = useState<TravelSearchState>(() =>
    createTravelSearchState(),
  );
  const [attractionSearch, setAttractionSearch] = useState<TravelSearchState>(() =>
    createTravelSearchState(),
  );
  const calculation = useMemo(() => {
    const safeTravelers = Math.max(1, travelers);
    const safeDays = Math.max(1, days);
    const nights = Math.max(1, safeDays - 1);
    const accommodation = accommodationPerNight * nights;
    const food = foodPerPersonDay * safeTravelers * safeDays;
    const activities = activitiesPerPerson * safeTravelers;
    const baseTotal = accommodation + food + transportTotal + activities + extrasTotal;
    const contingency = baseTotal * (Math.max(0, contingencyPercent) / 100);
    const total = baseTotal + contingency;
    return {
      nights,
      accommodation,
      food,
      activities,
      baseTotal,
      contingency,
      total,
      perTraveler: total / safeTravelers,
      perTravelerPerDay: total / safeTravelers / safeDays,
    };
  }, [
    travelers,
    days,
    accommodationPerNight,
    foodPerPersonDay,
    transportTotal,
    activitiesPerPerson,
    extrasTotal,
    contingencyPercent,
  ]);
  const budgetDifference = overallBudget - calculation.total;
  function calculateDateTripLength(
    nextStartDate: string,
    nextEndDate: string,
  ): number | null {
    if (!nextStartDate || !nextEndDate) {
      return null;
    }
    const start = new Date(`${nextStartDate}T00:00:00`);
    const end = new Date(`${nextEndDate}T00:00:00`);
    const difference = end.getTime() - start.getTime();
    if (!Number.isFinite(difference) || difference < 0) {
      return null;
    }
    return Math.max(1, Math.floor(difference / 86_400_000) + 1);
  }
  function updateStartDate(value: string) {
    setStartDate(value);
    const nextDays = calculateDateTripLength(value, endDate);
    if (nextDays !== null) {
      setDays(nextDays);
    }
  }
  function updateEndDate(value: string) {
    setEndDate(value);
    const nextDays = calculateDateTripLength(startDate, value);
    if (nextDays !== null) {
      setDays(nextDays);
    }
  }
  function setTravelSearchState(kind: TravelDiscoveryKind, state: TravelSearchState) {
    switch (kind) {
      case "hotel":
        setHotelSearch(state);
        break;
      case "restaurant":
        setRestaurantSearch(state);
        break;
      case "attraction":
        setAttractionSearch(state);
        break;
      default:
        break;
    }
  }
  async function searchTravel(kind: TravelDiscoveryKind) {
    const cleanDestination = destination.trim();
    if (cleanDestination.length < 2) {
      setTravelSearchState(kind, {
        ...createTravelSearchState(),
        status: "error",
        message: "Enter a destination with at least 2 characters before searching.",
      });
      return;
    }
    setTravelSearchState(kind, {
      ...createTravelSearchState(),
      status: "loading",
    });
    try {
      const searchParams = new URLSearchParams({
        destination: cleanDestination,
        kind,
        limit: "6",
      });
      const response = await fetch(`/api/travel/discover?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const payload = (await response.json()) as TravelDiscoveryResponse & {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || payload.success === false) {
        throw new Error(
          payload.message || `Travel search failed with HTTP ${response.status}.`,
        );
      }
      setTravelSearchState(kind, {
        ...createTravelSearchState(),
        status: "success",
        suggestions: payload.suggestions ?? [],
        providers: payload.providers ?? [],
      });
    } catch (error) {
      setTravelSearchState(kind, {
        ...createTravelSearchState(),
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Travel search could not be completed.",
      });
    }
  }
  // FUNCTIONAL_TRAVEL_STEP_CONTENT
  const functionalStepContent = [
    <section
      key="destination-step"
      className="border-border bg-muted/20 rounded-2xl border p-4 sm:p-5"
    >
      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
        Trip destination and basics
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="border-border bg-background block rounded-xl border p-4 sm:col-span-2">
          <span className="block text-sm font-semibold">Destination country or city</span>
          <input
            type="text"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Example: Paris, France"
            autoComplete="off"
            className="border-border bg-background mt-2 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
          />
          <span className="text-muted-foreground mt-2 block text-xs leading-5">
            This destination is used by the live hotel, restaurant, and attraction
            searches in Step 3.
          </span>
        </label>
        <label className="border-border bg-background block rounded-xl border p-4">
          <span className="block text-sm font-semibold">Trip start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => updateStartDate(event.target.value)}
            className="border-border bg-background mt-2 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
          />
        </label>
        <label className="border-border bg-background block rounded-xl border p-4">
          <span className="block text-sm font-semibold">Trip end date</span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => updateEndDate(event.target.value)}
            className="border-border bg-background mt-2 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
          />
        </label>
        <NumberField
          id="travelers"
          label="Travelers"
          value={travelers}
          min={1}
          max={50}
          onChange={setTravelers}
        />
        <div className="border-border bg-background rounded-xl border p-4">
          <p className="text-sm font-semibold">Trip length</p>
          <p className="mt-2 text-2xl font-bold">
            {days} {days === 1 ? "day" : "days"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            Automatically updated when both dates form a valid trip range.
          </p>
        </div>
      </div>
    </section>,
    <section key="budget-step" className="space-y-5">
      <div className="border-border bg-muted/20 rounded-2xl border p-4 sm:p-5">
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          Set the complete trip budget
        </p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Add the spending limits that should shape your trip. The estimate below updates
          automatically.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField
            id="overall-budget"
            label="Overall trip budget"
            value={overallBudget}
            onChange={setOverallBudget}
          />
          <NumberField
            id="accommodation"
            label="Accommodation per night"
            value={accommodationPerNight}
            onChange={setAccommodationPerNight}
          />
          <NumberField
            id="food"
            label="Food per person / day"
            value={foodPerPersonDay}
            onChange={setFoodPerPersonDay}
          />
          <NumberField
            id="transport"
            label="Transport total"
            value={transportTotal}
            onChange={setTransportTotal}
          />
          <NumberField
            id="activities"
            label="Activities per person"
            value={activitiesPerPerson}
            onChange={setActivitiesPerPerson}
          />
          <NumberField
            id="extras"
            label="Shopping / extras"
            value={extrasTotal}
            onChange={setExtrasTotal}
          />
          <NumberField
            id="contingency"
            label="Contingency buffer"
            value={contingencyPercent}
            min={0}
            max={100}
            suffix="%"
            onChange={setContingencyPercent}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-border bg-background rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Current estimate
          </p>
          <p className="mt-1 text-xl font-bold">{formatAmount(calculation.total)}</p>
        </div>
        <div className="border-border bg-background rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Overall budget
          </p>
          <p className="mt-1 text-xl font-bold">{formatAmount(overallBudget)}</p>
        </div>
        <div className="border-border bg-background rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Budget position
          </p>
          <p className="mt-1 text-xl font-bold">
            {budgetDifference >= 0
              ? `${formatAmount(budgetDifference)} remaining`
              : `${formatAmount(Math.abs(budgetDifference))} over budget`}
          </p>
        </div>
      </div>
    </section>,
    <section key="live-options-step" className="space-y-5">
      <div className="border-border bg-muted/20 rounded-2xl border p-4 sm:p-5">
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          Live destination options
        </p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Search live places around the destination entered in Step 1.
        </p>
        <div className="bg-background mt-4 rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Searching around
          </p>
          <p className="mt-1 font-bold">
            {destination.trim() || "Choose a destination in Step 1"}
          </p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <TravelDiscoveryPanel
          label="Hotels"
          title="Accommodation suggestions"
          description={
            destination.trim()
              ? `Search live accommodation options around ${destination.trim()} and compare them with your nightly spending target.`
              : "Choose a destination in Step 1, then search live accommodation options."
          }
          searchLabel="Search Hotels"
          destination={destination}
          budgetContext={`Nightly target: ${formatAmount(accommodationPerNight)}`}
          state={hotelSearch}
          onSearch={() => void searchTravel("hotel")}
        />
        <TravelDiscoveryPanel
          label="Restaurants"
          title="Food and dining suggestions"
          description={
            destination.trim()
              ? `Search live restaurant options around ${destination.trim()} and review them alongside your daily food budget.`
              : "Choose a destination in Step 1, then search live restaurant options."
          }
          searchLabel="Search Restaurants"
          destination={destination}
          budgetContext={`Per person / day: ${formatAmount(foodPerPersonDay)}`}
          state={restaurantSearch}
          onSearch={() => void searchTravel("restaurant")}
        />
        <TravelDiscoveryPanel
          label="Places & activities"
          title="Attractions and local options"
          description={
            destination.trim()
              ? `Search live attractions and useful places around ${destination.trim()} for your trip.`
              : "Choose a destination in Step 1, then search attractions and local places."
          }
          searchLabel="Search Attractions"
          destination={destination}
          budgetContext={`Activity target / person: ${formatAmount(activitiesPerPerson)}`}
          state={attractionSearch}
          onSearch={() => void searchTravel("attraction")}
        />
      </div>
    </section>,
    <section key="final-plan-step" className="space-y-5">
      <div className="border-border bg-muted/20 rounded-2xl border p-4 sm:p-5">
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          Your final trip summary
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-background rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Destination
            </p>
            <p className="mt-1 font-bold">{destination.trim() || "Not selected"}</p>
          </div>
          <div className="bg-background rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Dates
            </p>
            <p className="mt-1 font-bold">
              {startDate && endDate ? `${startDate} to ${endDate}` : "Not fully selected"}
            </p>
          </div>
          <div className="bg-background rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Travelers
            </p>
            <p className="mt-1 font-bold">{travelers}</p>
          </div>
          <div className="bg-background rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Trip length
            </p>
            <p className="mt-1 font-bold">
              {days} {days === 1 ? "day" : "days"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
        <section className="border-border bg-background rounded-2xl border p-5">
          <h4 className="text-lg font-bold">Cost breakdown</h4>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Accommodation ({calculation.nights} nights)
              </dt>
              <dd className="font-semibold">{formatAmount(calculation.accommodation)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Food</dt>
              <dd className="font-semibold">{formatAmount(calculation.food)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Transport</dt>
              <dd className="font-semibold">{formatAmount(transportTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Activities</dt>
              <dd className="font-semibold">{formatAmount(calculation.activities)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Extras</dt>
              <dd className="font-semibold">{formatAmount(extrasTotal)}</dd>
            </div>
            <div className="border-border flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Base subtotal</dt>
              <dd className="font-semibold">{formatAmount(calculation.baseTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Contingency ({contingencyPercent}%)
              </dt>
              <dd className="font-semibold">{formatAmount(calculation.contingency)}</dd>
            </div>
          </dl>
        </section>
        <aside className="border-border bg-background rounded-2xl border p-5">
          <p className="text-muted-foreground text-sm font-medium">Final budget</p>
          <div className="mt-4 rounded-2xl bg-violet-50 p-5 text-violet-950 dark:bg-violet-950/30 dark:text-violet-100">
            <p className="text-sm font-medium">Estimated total</p>
            <p className="mt-1 text-3xl font-bold break-words">
              {formatAmount(calculation.total)}
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Overall budget
              </p>
              <p className="mt-1 text-lg font-bold">{formatAmount(overallBudget)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Budget position
              </p>
              <p className="mt-1 text-lg font-bold">
                {budgetDifference >= 0
                  ? `${formatAmount(budgetDifference)} remaining`
                  : `${formatAmount(Math.abs(budgetDifference))} over budget`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Per traveler
              </p>
              <p className="mt-1 text-lg font-bold">
                {formatAmount(calculation.perTraveler)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Per traveler / day
              </p>
              <p className="mt-1 text-lg font-bold">
                {formatAmount(calculation.perTravelerPerDay)}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mt-6 text-xs leading-5">
            This is a planning estimate, not a travel quote. Actual prices, taxes,
            exchange rates, provider availability, fees, and unexpected costs can differ.
          </p>
        </aside>
      </div>
    </section>,
  ] as const;
  return (
    <GuidedUtilityShell
      categoryName="Travel & Lifestyle"
      title="Plan the trip around your destination and real budget"
      description="Complete the real trip planner one step at a time: add your destination and dates, set the budget, explore live options, then review the final trip summary."
      steps={TRAVEL_GUIDED_STEPS}
      stepContent={functionalStepContent}
    >
      {null}
    </GuidedUtilityShell>
  );
}
