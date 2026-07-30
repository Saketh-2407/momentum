import { Sparkles, Flame, LayoutDashboard, Users } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI planner",
    description:
      "Dump everything on your mind. Momentum orders your day by urgency, importance, and energy — with a plain-language reason for every call.",
  },
  {
    icon: Flame,
    title: "Streaks that forgive",
    description:
      "Miss a day and your streak decays instead of shattering. Earn streak freezes for the days life gets in the way.",
  },
  {
    icon: LayoutDashboard,
    title: "A dashboard worth opening",
    description:
      "A completion ring, a live streak flame, an animated XP bar, and insights into when and what you actually get done.",
  },
  {
    icon: Users,
    title: "Friends keep you honest",
    description:
      "A weekly leaderboard, shareable routines you can clone, and co-op quests you tackle together.",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {FEATURES.map((feature, index) => (
        <ScrollReveal key={feature.title} delay={index * 0.08}>
          <div className="flex h-full flex-col gap-3 rounded-xl border border-border/60 bg-card p-6">
            <feature.icon className="size-6 text-primary" />
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
