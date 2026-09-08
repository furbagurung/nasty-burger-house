export type HomepageReview = {
  id: string;
  name: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Profile image for the entry; preview entries use fictional illustrations. */
  avatar: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

// These fictional entries are approved for design preview only. Replace the full
// collection with genuine, approved reviews before switching off the preview label.
export const homepageReviewsArePreview = true;

export const homepageReviews: HomepageReview[] = [
  {
    id: "preview-alex",
    name: "Alex Morgan",
    quote: "The burger is stacked, juicy and properly messy. Exactly the kind of feed you want when you’re seriously hungry.",
    rating: 5,
    avatar: "/images/review-previews/alex.svg",
  },
  {
    id: "preview-jamie",
    name: "Jamie Chen",
    quote: "Ordered the Beast Box for a night in with friends. Burgers, crispy fries and plenty to share. We were all very happy.",
    rating: 5,
    avatar: "/images/review-previews/jamie.svg",
  },
  {
    id: "preview-sarah",
    name: "Sarah Bennett",
    quote: "Quick pickup, big portions and the burger was still hot when we got home. The loaded fries were the first thing to disappear.",
    rating: 5,
    avatar: "/images/review-previews/sarah.svg",
  },
  {
    id: "preview-daniel",
    name: "Daniel Brooks",
    quote: "Went for the OG Nasty and it hit the spot. A proper juicy burger, a soft bun and just the right amount of sauce.",
    rating: 5,
    avatar: "/images/review-previews/daniel.svg",
  },
];
