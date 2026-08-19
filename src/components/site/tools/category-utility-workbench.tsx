"use client";
import { useMemo, useState } from "react";
import {
  GuidedUtilityShell,
  type GuidedUtilityStep,
} from "@/components/site/tools/guided-utility-shell";
type CategoryUtilityWorkbenchProps = {
  categorySlug: string;
};
const GUIDED_UTILITY_STEPS: Record<string, readonly GuidedUtilityStep[]> = {
  "beauty-skincare": [
    {
      id: "goal",
      eyebrow: "Step 1",
      title: "Choose your routine goal",
      description: "Define the general skincare or beauty routine you want to organize.",
      helper:
        "Keep the planner focused on routine organization rather than diagnosis or medical treatment.",
    },
    {
      id: "daily",
      eyebrow: "Step 2",
      title: "Build morning and evening",
      description: "Arrange the steps you want in your morning and evening routines.",
      helper: "Separate AM and PM actions so the routine stays clear and practical.",
    },
    {
      id: "weekly",
      eyebrow: "Step 3",
      title: "Add weekly treatments",
      description: "Place occasional routine steps into suitable days of the week.",
      helper:
        "Use frequency and schedule to keep occasional steps separate from everyday actions.",
    },
    {
      id: "schedule",
      eyebrow: "Step 4",
      title: "Follow your schedule",
      description:
        "Review the routine, completion state, and the actions you want to follow next.",
      helper:
        "Persistent reminders belong to the later public-user reminder architecture.",
    },
  ],
  "food-recipes": [
    {
      id: "meals",
      eyebrow: "Step 1",
      title: "Choose your meals",
      description: "Start with the meals and recipe ideas you want to include.",
      helper:
        "Choose the meal direction first so the rest of the plan has a clear foundation.",
    },
    {
      id: "days",
      eyebrow: "Step 2",
      title: "Build a multi-day plan",
      description: "Arrange your selected meals across the days you want to organize.",
      helper: "A day-by-day structure makes the plan easier to understand and adjust.",
    },
    {
      id: "servings",
      eyebrow: "Step 3",
      title: "Adjust servings",
      description: "Set the number of people so quantities can match your plan.",
      helper: "Keep serving assumptions visible so quantities remain understandable.",
    },
    {
      id: "shopping",
      eyebrow: "Step 4",
      title: "Prepare your shopping plan",
      description:
        "Turn the meal plan into an organized ingredient and shopping workflow.",
      helper:
        "The advanced layer can later consolidate ingredients while keeping meal context visible.",
    },
  ],
  "health-fitness-wellness": [
    {
      id: "goal",
      eyebrow: "Step 1",
      title: "Choose your wellness goal",
      description:
        "Define what you want to organize or improve in your everyday wellness routine.",
      helper:
        "Keep the plan focused on general wellness organization rather than medical diagnosis.",
    },
    {
      id: "schedule",
      eyebrow: "Step 2",
      title: "Build your schedule",
      description: "Add activities and decide where they fit into your routine.",
      helper: "A schedule turns general intentions into actions you can actually follow.",
    },
    {
      id: "daily",
      eyebrow: "Step 3",
      title: "Plan daily habits",
      description:
        "Organize the everyday wellness habits supported by the current planner.",
      helper:
        "The utility remains a planning tool and should not present its output as medical advice.",
    },
    {
      id: "progress",
      eyebrow: "Step 4",
      title: "Review progress",
      description: "Review the plan and identify where your routine may need adjustment.",
      helper:
        "Device integrations and persistent tracking belong to a later dedicated architecture.",
    },
  ],
  "home-dcor-organization": [
    {
      id: "room",
      eyebrow: "Step 1",
      title: "Choose your room",
      description: "Select the room or space you want to improve and define its purpose.",
      helper:
        "Start with the real room goal before deciding on organization or decor changes.",
    },
    {
      id: "goal",
      eyebrow: "Step 2",
      title: "Define the change",
      description: "Choose what you want to improve in the selected space.",
      helper:
        "A clear goal keeps the plan focused on useful changes rather than random suggestions.",
    },
    {
      id: "details",
      eyebrow: "Step 3",
      title: "Add room details",
      description:
        "Use the current planner inputs to describe the practical room context.",
      helper:
        "Room-photo and visual AI capabilities will require their own dedicated media and AI layer.",
    },
    {
      id: "plan",
      eyebrow: "Step 4",
      title: "Build the room plan",
      description: "Turn the room details into an organized set of practical actions.",
      helper:
        "Use the workspace below to calculate and organize the plan supported today.",
    },
  ],
  "money-career": [
    {
      id: "goal",
      eyebrow: "Step 1",
      title: "Set your target",
      description: "Choose the money or career target you want to work toward.",
      helper: "A specific target gives the roadmap something measurable to organize.",
    },
    {
      id: "current",
      eyebrow: "Step 2",
      title: "Add your current position",
      description: "Enter the starting values supported by the current planner.",
      helper: "A starting point helps show the gap between where you are and the target.",
    },
    {
      id: "timeline",
      eyebrow: "Step 3",
      title: "Choose a timeline",
      description: "Set the period in which you want to work toward the target.",
      helper:
        "A timeline turns a large goal into smaller and more understandable checkpoints.",
    },
    {
      id: "roadmap",
      eyebrow: "Step 4",
      title: "Review your roadmap",
      description: "Use the calculated result to understand the practical pace required.",
      helper:
        "Persistent progress tracking will be added only with a dedicated public-user storage architecture.",
    },
  ],
  "relationships-family": [
    {
      id: "activity",
      eyebrow: "Step 1",
      title: "Choose the shared goal",
      description:
        "Define the family, relationship, or shared activity you want to organize.",
      helper: "Give the plan a clear purpose before breaking it into individual actions.",
    },
    {
      id: "tasks",
      eyebrow: "Step 2",
      title: "Create shared tasks",
      description: "Break the goal into clear tasks or activities.",
      helper: "Concrete actions are easier to follow than broad intentions.",
    },
    {
      id: "checkin",
      eyebrow: "Step 3",
      title: "Plan check-ins",
      description:
        "Use the current planner to organize how the shared plan should be followed.",
      helper:
        "Assignments and persistent shared-user state require the later public-user architecture.",
    },
    {
      id: "progress",
      eyebrow: "Step 4",
      title: "Review the plan",
      description: "Review the resulting plan and keep the next shared action clear.",
      helper:
        "Cross-device shared progress is intentionally outside this browser-only phase.",
    },
  ],
  "womens-fashion-style": [
    {
      id: "occasion",
      eyebrow: "Step 1",
      title: "Choose the occasion",
      description:
        "Start with where you are going and the kind of outfit you want to plan.",
      helper: "The occasion gives the outfit planner a practical starting point.",
    },
    {
      id: "conditions",
      eyebrow: "Step 2",
      title: "Add conditions",
      description:
        "Consider the season, setting, or other practical conditions supported by the planner.",
      helper:
        "Practical context helps keep outfit planning useful instead of purely generic.",
    },
    {
      id: "style",
      eyebrow: "Step 3",
      title: "Define your style",
      description:
        "Choose the style direction and preferences you want the outfit to follow.",
      helper: "A clear style direction makes the resulting combination more relevant.",
    },
    {
      id: "outfit",
      eyebrow: "Step 4",
      title: "Build the outfit",
      description:
        "Use the existing workspace to turn those choices into an outfit plan.",
      helper:
        "Wardrobe persistence and image-based clothing analysis belong to later dedicated layers.",
    },
  ],
};
const GUIDED_UTILITY_META: Record<
  string,
  {
    categoryName: string;
    title: string;
    description: string;
  }
> = {
  "beauty-skincare": {
    categoryName: "Beauty & Skincare",
    title: "Build your routine step by step",
    description:
      "Move from your routine goal to a clear schedule while keeping the existing planner available as the practical workspace.",
  },
  "food-recipes": {
    categoryName: "Food & Recipes",
    title: "Build meals into a complete plan",
    description:
      "Choose the meal direction, organize the days and servings, then use the planner to shape the practical food workflow.",
  },
  "health-fitness-wellness": {
    categoryName: "Health, Fitness & Wellness",
    title: "Build a routine you can actually follow",
    description:
      "Organize your general wellness goal into a clearer sequence before using the existing planning workspace.",
  },
  "home-dcor-organization": {
    categoryName: "Home Decor & Organization",
    title: "Turn a room goal into a practical plan",
    description:
      "Start with the space and its purpose, define the change you want, then use the existing planner to organize the result.",
  },
  "money-career": {
    categoryName: "Money & Career",
    title: "Turn your target into a measurable roadmap",
    description:
      "Define the target, starting position, and timeline before using the current calculations to understand the path forward.",
  },
  "relationships-family": {
    categoryName: "Relationships & Family",
    title: "Organize shared goals and responsibilities",
    description:
      "Give a shared goal structure before using the current planner to organize actions and progress.",
  },
  "womens-fashion-style": {
    categoryName: "Women's Fashion & Style",
    title: "Build an outfit around your real day",
    description:
      "Start with the occasion and practical context, define your style direction, then use the existing outfit workspace.",
  },
};
type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
};
function clampNumber(value: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
function NumberField({
  id,
  label,
  value,
  min = 0,
  max,
  step = 1,
  suffix,
  onChange,
}: NumberFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-label={label}
          onChange={(event) =>
            onChange(
              clampNumber(
                Number(event.target.value),
                min,
                max ?? Number.MAX_SAFE_INTEGER,
              ),
            )
          }
          className="border-border bg-background min-w-0 flex-1 rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
        />
        {suffix ? <span className="text-muted-foreground text-sm">{suffix}</span> : null}
      </div>
    </label>
  );
}
function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className="bg-muted mt-3 h-2 overflow-hidden rounded-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
    >
      <div
        className="h-full bg-violet-600 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
function BeautyRoutineBuilder() {
  const [morningSteps, setMorningSteps] = useState(3);
  const [eveningSteps, setEveningSteps] = useState(4);
  const [weeklyTreatments, setWeeklyTreatments] = useState(2);
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const plan = useMemo(() => {
    const dailySteps = morningSteps + eveningSteps;
    const weeklyCore = dailySteps * daysPerWeek;
    const weeklyTotal = weeklyCore + weeklyTreatments;
    return {
      dailySteps,
      weeklyCore,
      weeklyTotal,
      consistencyTarget: daysPerWeek > 0 ? Math.min(100, (daysPerWeek / 7) * 100) : 0,
    };
  }, [morningSteps, eveningSteps, weeklyTreatments, daysPerWeek]);
  return (
    <UtilityShell
      eyebrow="Beauty & Skincare"
      title="Beauty Routine Builder"
      description="Build a simple morning, evening, and weekly skincare routine without overloading your schedule."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="beauty-morning"
          label="Morning routine steps"
          value={morningSteps}
          min={1}
          max={12}
          onChange={setMorningSteps}
        />
        <NumberField
          id="beauty-evening"
          label="Evening routine steps"
          value={eveningSteps}
          min={1}
          max={12}
          onChange={setEveningSteps}
        />
        <NumberField
          id="beauty-weekly"
          label="Weekly treatments"
          value={weeklyTreatments}
          min={0}
          max={14}
          onChange={setWeeklyTreatments}
        />
        <NumberField
          id="beauty-days"
          label="Routine days per week"
          value={daysPerWeek}
          min={1}
          max={7}
          onChange={setDaysPerWeek}
        />
      </div>
      <ResultCard title="Routine summary">
        <ResultRow label="Daily routine steps" value={String(plan.dailySteps)} />
        <ResultRow label="Core steps / week" value={String(plan.weeklyCore)} />
        <ResultRow
          label="Total planned actions / week"
          value={String(plan.weeklyTotal)}
        />
        <p className="text-muted-foreground mt-5 text-sm">
          Weekly consistency target: {Math.round(plan.consistencyTarget)}%
        </p>
        <ProgressBar value={plan.consistencyTarget} />
      </ResultCard>
    </UtilityShell>
  );
}
function FoodMealPlanner() {
  const [originalServings, setOriginalServings] = useState(4);
  const [targetServings, setTargetServings] = useState(6);
  const [ingredientAmount, setIngredientAmount] = useState(250);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [days, setDays] = useState(5);
  const plan = useMemo(() => {
    const scale = originalServings > 0 ? targetServings / originalServings : 0;
    return {
      scale,
      scaledIngredient: ingredientAmount * scale,
      totalMeals: mealsPerDay * days,
    };
  }, [originalServings, targetServings, ingredientAmount, mealsPerDay, days]);
  return (
    <UtilityShell
      eyebrow="Food & Recipes"
      title="Recipe Serving & Meal Planner"
      description="Scale recipe quantities and estimate how many meals you need for a multi-day food plan."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="food-original"
          label="Original recipe servings"
          value={originalServings}
          min={1}
          max={100}
          onChange={setOriginalServings}
        />
        <NumberField
          id="food-target"
          label="Required servings"
          value={targetServings}
          min={1}
          max={200}
          onChange={setTargetServings}
        />
        <NumberField
          id="food-ingredient"
          label="Example ingredient amount"
          value={ingredientAmount}
          min={0}
          max={100000}
          suffix="units"
          onChange={setIngredientAmount}
        />
        <NumberField
          id="food-meals-day"
          label="Meals per day"
          value={mealsPerDay}
          min={1}
          max={10}
          onChange={setMealsPerDay}
        />
        <NumberField
          id="food-days"
          label="Planning days"
          value={days}
          min={1}
          max={31}
          onChange={setDays}
        />
      </div>
      <ResultCard title="Meal planning summary">
        <ResultRow label="Recipe scale multiplier" value={`${plan.scale.toFixed(2)}Ã—`} />
        <ResultRow
          label="Scaled example ingredient"
          value={plan.scaledIngredient.toFixed(1)}
        />
        <ResultRow label="Meals to plan" value={String(plan.totalMeals)} />
      </ResultCard>
    </UtilityShell>
  );
}
function WellnessPlanner() {
  const [bodyWeight, setBodyWeight] = useState(65);
  const [activeMinutes, setActiveMinutes] = useState(30);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(4);
  const [sleepHours, setSleepHours] = useState(8);
  const plan = useMemo(() => {
    const baselineHydrationMl = Math.max(0, bodyWeight) * 30;
    const activityHydrationMl = Math.max(0, activeMinutes) * 12;
    return {
      waterMl: baselineHydrationMl + activityHydrationMl,
      weeklyMinutes: activeMinutes * workoutsPerWeek,
      sleepHoursWeek: sleepHours * 7,
    };
  }, [bodyWeight, activeMinutes, workoutsPerWeek, sleepHours]);
  return (
    <UtilityShell
      eyebrow="Health, Fitness & Wellness"
      title="Wellness & Fitness Planner"
      description="Create a simple activity, hydration, and sleep planning baseline for everyday wellness."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="wellness-weight"
          label="Body weight"
          value={bodyWeight}
          min={20}
          max={300}
          suffix="kg"
          onChange={setBodyWeight}
        />
        <NumberField
          id="wellness-active"
          label="Active minutes / workout"
          value={activeMinutes}
          min={0}
          max={600}
          suffix="min"
          onChange={setActiveMinutes}
        />
        <NumberField
          id="wellness-workouts"
          label="Workouts per week"
          value={workoutsPerWeek}
          min={0}
          max={14}
          onChange={setWorkoutsPerWeek}
        />
        <NumberField
          id="wellness-sleep"
          label="Planned sleep / night"
          value={sleepHours}
          min={1}
          max={14}
          step={0.5}
          suffix="hours"
          onChange={setSleepHours}
        />
      </div>
      <ResultCard title="Planning baseline">
        <ResultRow
          label="Estimated daily hydration planning point"
          value={`${Math.round(plan.waterMl)} ml`}
        />
        <ResultRow label="Planned activity / week" value={`${plan.weeklyMinutes} min`} />
        <ResultRow
          label="Planned sleep / week"
          value={`${plan.sleepHoursWeek.toFixed(1)} hours`}
        />
        <p className="text-muted-foreground mt-5 text-xs leading-5">
          These values are general planning estimates, not medical advice. Personal health
          needs can vary.
        </p>
      </ResultCard>
    </UtilityShell>
  );
}
function HomeOrganizationPlanner() {
  const [rooms, setRooms] = useState(5);
  const [areasPerRoom, setAreasPerRoom] = useState(4);
  const [minutesPerArea, setMinutesPerArea] = useState(20);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5);
  const plan = useMemo(() => {
    const totalAreas = rooms * areasPerRoom;
    const totalMinutes = totalAreas * minutesPerArea;
    const weeklyMinutes =
      sessionsPerWeek > 0 ? totalMinutes / sessionsPerWeek : totalMinutes;
    return {
      totalAreas,
      totalMinutes,
      minutesPerSession: weeklyMinutes,
    };
  }, [rooms, areasPerRoom, minutesPerArea, sessionsPerWeek]);
  return (
    <UtilityShell
      eyebrow="Home Decor & Organization"
      title="Home Organization Planner"
      description="Break your home into manageable areas and estimate a realistic decluttering schedule."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="home-rooms"
          label="Rooms / major spaces"
          value={rooms}
          min={1}
          max={50}
          onChange={setRooms}
        />
        <NumberField
          id="home-areas"
          label="Areas per room"
          value={areasPerRoom}
          min={1}
          max={30}
          onChange={setAreasPerRoom}
        />
        <NumberField
          id="home-minutes"
          label="Minutes per area"
          value={minutesPerArea}
          min={5}
          max={300}
          suffix="min"
          onChange={setMinutesPerArea}
        />
        <NumberField
          id="home-sessions"
          label="Sessions planned"
          value={sessionsPerWeek}
          min={1}
          max={50}
          onChange={setSessionsPerWeek}
        />
      </div>
      <ResultCard title="Organization plan">
        <ResultRow label="Total areas" value={String(plan.totalAreas)} />
        <ResultRow
          label="Estimated total time"
          value={`${Math.round(plan.totalMinutes / 60)} hours`}
        />
        <ResultRow
          label="Average time / session"
          value={`${Math.round(plan.minutesPerSession)} min`}
        />
      </ResultCard>
    </UtilityShell>
  );
}
function MoneyCareerPlanner() {
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2200);
  const [goalAmount, setGoalAmount] = useState(5000);
  const [applicationsPerWeek, setApplicationsPerWeek] = useState(8);
  const [weeks, setWeeks] = useState(12);
  const plan = useMemo(() => {
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const monthsToGoal = monthlySurplus > 0 ? goalAmount / monthlySurplus : null;
    return {
      monthlySurplus,
      monthsToGoal,
      applications: applicationsPerWeek * weeks,
    };
  }, [monthlyIncome, monthlyExpenses, goalAmount, applicationsPerWeek, weeks]);
  return (
    <UtilityShell
      eyebrow="Money & Career"
      title="Money & Career Goal Planner"
      description="Combine a simple savings target with an actionable career-application plan."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="money-income"
          label="Monthly income"
          value={monthlyIncome}
          min={0}
          onChange={setMonthlyIncome}
        />
        <NumberField
          id="money-expenses"
          label="Monthly expenses"
          value={monthlyExpenses}
          min={0}
          onChange={setMonthlyExpenses}
        />
        <NumberField
          id="money-goal"
          label="Savings goal"
          value={goalAmount}
          min={0}
          onChange={setGoalAmount}
        />
        <NumberField
          id="career-applications"
          label="Applications / week"
          value={applicationsPerWeek}
          min={0}
          max={200}
          onChange={setApplicationsPerWeek}
        />
        <NumberField
          id="career-weeks"
          label="Career plan length"
          value={weeks}
          min={1}
          max={104}
          suffix="weeks"
          onChange={setWeeks}
        />
      </div>
      <ResultCard title="Goal summary">
        <ResultRow label="Monthly surplus" value={plan.monthlySurplus.toFixed(2)} />
        <ResultRow
          label="Estimated months to savings goal"
          value={
            plan.monthsToGoal === null
              ? "Increase monthly surplus"
              : plan.monthsToGoal.toFixed(1)
          }
        />
        <ResultRow label="Planned job applications" value={String(plan.applications)} />
        <p className="text-muted-foreground mt-5 text-xs leading-5">
          Financial values are planning estimates and are not financial advice.
        </p>
      </ResultCard>
    </UtilityShell>
  );
}
function RelationshipPlanner() {
  const [sharedTasks, setSharedTasks] = useState(12);
  const [completedTasks, setCompletedTasks] = useState(5);
  const [checkInsPerWeek, setCheckInsPerWeek] = useState(2);
  const [familyActivities, setFamilyActivities] = useState(1);
  const plan = useMemo(() => {
    const completion = sharedTasks > 0 ? (completedTasks / sharedTasks) * 100 : 0;
    return {
      completion: Math.max(0, Math.min(100, completion)),
      remainingTasks: Math.max(0, sharedTasks - completedTasks),
      monthlyCheckIns: checkInsPerWeek * 4,
      monthlyActivities: familyActivities * 4,
    };
  }, [sharedTasks, completedTasks, checkInsPerWeek, familyActivities]);
  return (
    <UtilityShell
      eyebrow="Relationships & Family"
      title="Family & Relationship Planner"
      description="Organize shared responsibilities, check-ins, and quality-time plans without turning the tool into diagnosis or therapy."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="family-tasks"
          label="Shared tasks"
          value={sharedTasks}
          min={0}
          max={200}
          onChange={setSharedTasks}
        />
        <NumberField
          id="family-completed"
          label="Completed tasks"
          value={completedTasks}
          min={0}
          max={200}
          onChange={setCompletedTasks}
        />
        <NumberField
          id="family-checkins"
          label="Check-ins per week"
          value={checkInsPerWeek}
          min={0}
          max={14}
          onChange={setCheckInsPerWeek}
        />
        <NumberField
          id="family-activities"
          label="Shared activities per week"
          value={familyActivities}
          min={0}
          max={14}
          onChange={setFamilyActivities}
        />
      </div>
      <ResultCard title="Shared plan">
        <ResultRow label="Tasks remaining" value={String(plan.remainingTasks)} />
        <ResultRow label="Monthly check-ins" value={String(plan.monthlyCheckIns)} />
        <ResultRow
          label="Monthly shared activities"
          value={String(plan.monthlyActivities)}
        />
        <p className="text-muted-foreground mt-5 text-sm">
          Shared-task completion: {Math.round(plan.completion)}%
        </p>
        <ProgressBar value={plan.completion} />
      </ResultCard>
    </UtilityShell>
  );
}
function FashionStylePlanner() {
  const [tops, setTops] = useState(6);
  const [bottoms, setBottoms] = useState(4);
  const [outerwear, setOuterwear] = useState(2);
  const [shoes, setShoes] = useState(3);
  const plan = useMemo(() => {
    const baseOutfits = tops * bottoms;
    const layeredOutfits =
      outerwear > 0 ? baseOutfits * Math.max(1, outerwear) : baseOutfits;
    return {
      baseOutfits,
      layeredOutfits,
      styledCombinations: layeredOutfits * Math.max(1, shoes),
    };
  }, [tops, bottoms, outerwear, shoes]);
  return (
    <UtilityShell
      eyebrow="Women's Fashion & Style"
      title="Wardrobe Outfit Planner"
      description="Estimate how many outfit combinations your current wardrobe can create and plan a more versatile capsule."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="fashion-tops"
          label="Mix-and-match tops"
          value={tops}
          min={1}
          max={100}
          onChange={setTops}
        />
        <NumberField
          id="fashion-bottoms"
          label="Mix-and-match bottoms"
          value={bottoms}
          min={1}
          max={100}
          onChange={setBottoms}
        />
        <NumberField
          id="fashion-outerwear"
          label="Outer layers"
          value={outerwear}
          min={0}
          max={50}
          onChange={setOuterwear}
        />
        <NumberField
          id="fashion-shoes"
          label="Shoe options"
          value={shoes}
          min={1}
          max={50}
          onChange={setShoes}
        />
      </div>
      <ResultCard title="Wardrobe versatility">
        <ResultRow label="Base top/bottom outfits" value={String(plan.baseOutfits)} />
        <ResultRow label="Layered combinations" value={String(plan.layeredOutfits)} />
        <ResultRow
          label="Styled combinations with shoes"
          value={String(plan.styledCombinations)}
        />
      </ResultCard>
    </UtilityShell>
  );
}
function UtilityShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
      <section className="border-border bg-muted/20 rounded-2xl border p-5 sm:p-6">
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="border-border bg-background mt-7 rounded-2xl border p-5">
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <dl className="mt-4 space-y-3 text-sm">{children}</dl>
    </aside>
  );
}
function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
export function CategoryUtilityWorkbench({
  categorySlug,
}: CategoryUtilityWorkbenchProps) {
  let workspace = null;
  switch (categorySlug) {
    case "beauty-skincare":
      workspace = <BeautyRoutineBuilder />;
      break;
    case "food-recipes":
      workspace = <FoodMealPlanner />;
      break;
    case "health-fitness-wellness":
      workspace = <WellnessPlanner />;
      break;
    case "home-dcor-organization":
      workspace = <HomeOrganizationPlanner />;
      break;
    case "money-career":
      workspace = <MoneyCareerPlanner />;
      break;
    case "relationships-family":
      workspace = <RelationshipPlanner />;
      break;
    case "womens-fashion-style":
      workspace = <FashionStylePlanner />;
      break;
    default:
      return null;
  }
  const guidedSteps = GUIDED_UTILITY_STEPS[categorySlug];
  const guidedMeta = GUIDED_UTILITY_META[categorySlug];
  if (!guidedSteps || !guidedMeta) {
    return workspace;
  }
  return (
    <GuidedUtilityShell
      categoryName={guidedMeta.categoryName}
      title={guidedMeta.title}
      description={guidedMeta.description}
      steps={guidedSteps}
    >
      {workspace}
    </GuidedUtilityShell>
  );
}
