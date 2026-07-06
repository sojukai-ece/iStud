// 1. Define a TypeScript Interface (The strict "blueprint" for a Feature card)
export interface Feature {
  id: string;
  icon: string;
  bgColor: string;
  title: string;
  description: string;
}

// 2. Create the array of data using that exact blueprint
export const featuresData: Feature[] = [
  {
    id: "quick-sessions",
    icon: "⚡",
    bgColor: "bg-yellow-300",
    title: "Quick Sessions",
    description: "Bite-sized study intervals designed to keep your focus razor-sharp without brain burnout.",
  },
  {
    id: "smart-retention",
    icon: "🧠",
    bgColor: "bg-purple-300",
    title: "Smart Retention",
    description: "Active recall tools that help complex formulas and concepts stick in your memory longer.",
  },
  {
    id: "track-mastery",
    icon: "🏆",
    bgColor: "bg-rose-300",
    title: "Track Mastery",
    description: "Watch your progress climb with visual trackers that reward consistency and daily effort.",
  },
];