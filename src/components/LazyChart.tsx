"use client";

import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the heavy chart component
const AreaChart = lazy(() => 
  import("recharts").then(module => ({ default: module.AreaChart }))
);

const Area = lazy(() => 
  import("recharts").then(module => ({ default: module.Area }))
);

const CartesianGrid = lazy(() => 
  import("recharts").then(module => ({ default: module.CartesianGrid }))
);

const XAxis = lazy(() => 
  import("recharts").then(module => ({ default: module.XAxis }))
);

const YAxis = lazy(() => 
  import("recharts").then(module => ({ default: module.YAxis }))
);

const Tooltip = lazy(() => 
  import("recharts").then(module => ({ default: module.Tooltip }))
);

const Legend = lazy(() => 
  import("recharts").then(module => ({ default: module.Legend }))
);

const ResponsiveContainer = lazy(() => 
  import("recharts").then(module => ({ default: module.ResponsiveContainer }))
);

interface LazyChartProps {
  data: any[];
  timeRange: string;
}

export default function LazyChart({ data, timeRange }: LazyChartProps) {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} tickMargin={8} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              }}
            />
            <Tooltip labelFormatter={(value) => new Date(value as any).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
            <Legend />
            <Area dataKey="present" type="monotone" fill="url(#fillPresent)" stroke="#16a34a" name="Check-ins" stackId="a" />
            <Area dataKey="hours" type="monotone" fill="url(#fillHours)" stroke="#2563eb" name="Hours" stackId="a" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Suspense>
  );
}
