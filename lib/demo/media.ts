/**
 * Every image and video the demo seed points at, in one place.
 *
 * Paste a URL into any slot and re-run `npm run db:seed:demo` — the seed reads
 * this file, so the new picture shows up everywhere that record is drawn
 * (catalog card, sale page, player, dashboards, admin review queue).
 *
 * Leaving a slot empty is always safe:
 *  - a course without a cover falls back to its category's gradient + icon;
 *  - a person without an avatar falls back to their initials;
 *  - a video lesson without a video shows the player's "no video yet" state.
 *
 * Any public https URL works (Neon/S3 bucket, Cloudinary, Unsplash, YouTube is
 * NOT supported — the player needs a direct .mp4/.webm file). Images are drawn
 * with a plain `<img>`, so no `next.config.ts` change is needed for a new host.
 */

/** Course cover images, keyed by course slug (see `lib/demo/content.ts`). 16:9 works best. */
export const COURSE_COVERS: Record<string, string> = {
  "modern-react-and-nextjs": "",
  "typescript-from-zero-to-confident": "",
  "node-apis-with-postgres": "",
  "ui-design-foundations": "",
  "figma-for-product-teams": "",
  "python-for-data-analysis": "",
  "machine-learning-essentials": "",
  "prompt-engineering-for-builders": "",
  "product-management-101": "",
  "growth-marketing-playbook": "",
  "personal-finance-for-developers": "",
  "deep-work-and-focus": "",
  "advanced-nextjs-patterns": "",
  "tailwind-css-in-practice": "",
  "testing-react-applications": "",
}

/**
 * Lesson videos. Every VIDEO lesson in the demo catalog takes the next URL from
 * this list in turn, so even two or three short clips cover the whole catalog.
 * Direct file URLs only (.mp4 / .webm).
 */
export const LESSON_VIDEOS: { url: string; durationSeconds: number }[] = [
  // Served from `public/videos/` (H.264 + AAC, faststart). Add more clips
  // here and the video lessons will rotate through them.
  { url: "/videos/react_demo.mp4", durationSeconds: 69 },
]

/**
 * Avatars for the people in the demo. Local files in `public/` are used by
 * default; replace any of them with a URL.
 */
export const AVATARS = {
  student: "/avatars/learner-1.png",
  instructor: "/testimonials/priya-nadar.png",
  admin: "/testimonials/marco-devine.png",
  /** The other instructors, in the order `lib/demo/content.ts` lists them. */
  instructors: [
    "/testimonials/simon-simorangkir.png",
    "/testimonials/nadia-rahman.png",
    "/avatars/learner-2.png",
    "/avatars/learner-3.png",
  ],
  /** Recycled across the generated learners; the rest show initials. */
  learners: ["/avatars/learner-4.png"],
}
