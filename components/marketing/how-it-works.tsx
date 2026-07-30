import { ScrollReveal } from "@/components/marketing/scroll-reveal";

const STEPS = [
  {
    step: "01",
    title: "Dump your day",
    description: "Type your tasks in order, or brain-dump everything at once and let the AI sort it.",
  },
  {
    step: "02",
    title: "Get an ordered plan",
    description: "Momentum scores urgency, importance, and effort, then hands back a plan you can tweak.",
  },
  {
    step: "03",
    title: "Level up",
    description: "Check things off, watch your XP and streak climb, and come back tomorrow to keep it going.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-8 sm:grid-cols-3">
      {STEPS.map((item, index) => (
        <ScrollReveal key={item.step} delay={index * 0.1}>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-primary">{item.step}</span>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
