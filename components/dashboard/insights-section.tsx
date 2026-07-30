"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import type { TrendPoint, TimeOfDayBucket, CategoryCount } from "@/lib/gamification/insights";

const trendDayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });

export function InsightsSection({
  trend,
  bestTimes,
  categories,
}: {
  trend: TrendPoint[];
  bestTimes: TimeOfDayBucket[];
  categories: CategoryCount[];
}) {
  const trendData = trend.map((point) => ({
    label: trendDayFormatter.format(new Date(`${point.date}T00:00:00`)),
    value: point.count,
  }));
  const bestTimesData = bestTimes.map((bucket) => ({ label: bucket.label, value: bucket.count }));

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle render={<h3 />} className="text-sm">
            Completion trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniBarChart
            data={trendData}
            emptyMessage="Complete a task to start your trend."
            formatValue={(value) => `${value} done`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle render={<h3 />} className="text-sm">
            Best times of day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniBarChart
            data={bestTimesData}
            emptyMessage="Complete a task to see your best times."
            formatValue={(value) => `${value} done`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle render={<h3 />} className="text-sm">
            By category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown data={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
