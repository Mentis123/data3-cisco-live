export type StandStat = {
  label: string;
  value: string;
  helper?: string;
};

export type StandInstruction = {
  title: string;
  detail: string;
};

export const standMessaging = {
  side1: {
    title: "Stand Snapshot",
    description: "Live pulse of today's Solution Sprint activity",
    stats: [
      { label: "Visitors engaged", value: "128" },
      { label: "Problems captured", value: "46" },
      { label: "Rapid solutions scoped", value: "18" },
      { label: "Avg. impact score", value: "4.8/5" },
    ] as StandStat[],
    footer: "Figures update with every coaching session."
  },
  side2: {
    title: "Solutions Delivered",
    subtitle: "Real outcomes co-created with attendees in under 15 minutes.",
    highlight: "From pain point to solution storyboard while you wait.",
    pillars: [
      "Map the business impact in minutes",
      "Match the right Cisco innovation",
      "Showcase a path to measurable outcomes",
    ],
    shoutOutLabel: "Spotlight slide",
    shoutOutHint: "Drop today's PowerPoint shout-out or keynote teaser here.",
  },
  side3: {
    title: "Jump In",
    hook: "Scan the code or visit sprint.data3.com/play",
    instructions: [
      {
        title: "Share the challenge",
        detail: "Tell us what slows your team down or introduces risk.",
      },
      {
        title: "Quantify the cost",
        detail: "Estimate the lost hours, dollars, or customer experience impact.",
      },
      {
        title: "Co-design a fix",
        detail: "Work with our coaches to align Cisco tech with your outcomes.",
      },
    ] as StandInstruction[],
    footer: "Leaderboard updates live. Top scores win daily bragging rights.",
  },
  side4: {
    title: "Inspiration",
    quote: "There's a way to do it better — find it.",
    attribution: "Thomas Edison",
    context: "Keep experimenting until the answer appears.",
  },
} as const;

export type StandMessagingConfig = typeof standMessaging;
