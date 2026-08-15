"use client";
import { useMemo, useState } from "react";
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
export function TravelTripBudgetPlanner() {
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(5);
  const [accommodationPerNight, setAccommodationPerNight] = useState(120);
  const [foodPerPersonDay, setFoodPerPersonDay] = useState(45);
  const [transportTotal, setTransportTotal] = useState(300);
  const [activitiesPerPerson, setActivitiesPerPerson] = useState(100);
  const [extrasTotal, setExtrasTotal] = useState(100);
  const [contingencyPercent, setContingencyPercent] = useState(10);
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
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
      <section className="border-border bg-muted/20 rounded-2xl border p-5 sm:p-6">
        <p className="text-muted-foreground text-sm font-medium">Plan your trip</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Trip details</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Use one currency for all money fields. This planner does not fetch exchange
          rates.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NumberField
            id="travelers"
            label="Travelers"
            value={travelers}
            min={1}
            max={50}
            onChange={setTravelers}
          />
          <NumberField
            id="days"
            label="Trip length"
            value={days}
            min={1}
            max={365}
            suffix="days"
            onChange={setDays}
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
      </section>
      <aside className="border-border bg-background h-fit rounded-2xl border p-5 sm:p-6 lg:sticky lg:top-24">
        <p className="text-muted-foreground text-sm font-medium">Estimated budget</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Budget summary</h2>
        <div className="mt-6 rounded-2xl bg-violet-50 p-5 text-violet-950 dark:bg-violet-950/30 dark:text-violet-100">
          <p className="text-sm font-medium">Estimated total</p>
          <p className="mt-1 text-3xl font-bold break-words">
            {formatAmount(calculation.total)}
          </p>
        </div>
        <dl className="mt-6 space-y-3 text-sm">
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
            <dt className="text-muted-foreground">Contingency ({contingencyPercent}%)</dt>
            <dd className="font-semibold">{formatAmount(calculation.contingency)}</dd>
          </div>
        </dl>
        <div className="border-border mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
          This is a planning estimate, not a travel quote. Actual prices, taxes, exchange
          rates, fees, and unexpected expenses can differ.
        </p>
      </aside>
    </div>
  );
}
