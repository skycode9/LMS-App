/**
 * The demo catalog — written content only. `lib/demo/seed.ts` turns it into
 * rows (ids, dates, prices, enrolments, orders); `lib/demo/media.ts` holds the
 * images and videos.
 *
 * Lessons are written compactly:
 *  - `v` a video lesson, with minutes;
 *  - `a` an article, with minutes and its paragraphs (a missing body gets a
 *    short generated one from the course's outcomes);
 *  - `q` a quiz, with its questions — option 0 is NOT assumed correct, the
 *    `answer` index says which one is.
 */

export type CategorySpec = {
  slug: string
  name: string
  description: string
  accentColor: "blue" | "violet" | "cyan" | "green" | "amber" | "red"
}

export const CATEGORIES: CategorySpec[] = [
  {
    slug: "development",
    name: "Development",
    description: "Web, backend and full-stack engineering.",
    accentColor: "blue",
  },
  {
    slug: "design",
    name: "Design",
    description: "Product, UI and visual design.",
    accentColor: "violet",
  },
  {
    slug: "data-ai",
    name: "Data & AI",
    description: "Analysis, machine learning and working with LLMs.",
    accentColor: "cyan",
  },
  {
    slug: "business",
    name: "Business",
    description: "Product management, strategy and leadership.",
    accentColor: "amber",
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "Growth, content and brand.",
    accentColor: "red",
  },
  {
    slug: "finance",
    name: "Finance",
    description: "Money skills for people who build things.",
    accentColor: "green",
  },
  {
    slug: "personal-development",
    name: "Personal Development",
    description: "Focus, habits and career growth.",
    accentColor: "green",
  },
]

export type InstructorSpec = {
  key: string
  name: string
  username: string
  title: string
  bio: string
  about: string[]
  skills: string[]
  teachingSince: number
  country: string
}

/** The first one is the demo instructor account (`instructor@lumen.demo`). */
export const INSTRUCTORS: InstructorSpec[] = [
  {
    key: "maya",
    name: "Maya Chen",
    username: "mayachen",
    title: "Senior Frontend Engineer",
    bio: "Frontend engineer who has shipped React apps used by millions. I teach the way I wish I had been taught: small steps, real projects.",
    about: [
      "I have spent eleven years building web products, most recently leading the frontend platform team at a fintech scale-up where our Next.js app served four million monthly users.",
      "My courses are built around one idea: you learn a tool by shipping something with it. Every section ends with a working feature you can put in your portfolio.",
      "When I'm not teaching I contribute to open source design systems and mentor bootcamp graduates making their first move into engineering.",
    ],
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Design systems"],
    teachingSince: 2019,
    country: "CA",
  },
  {
    key: "daniel",
    name: "Daniel Okafor",
    username: "danielokafor",
    title: "Staff Backend Engineer",
    bio: "Backend engineer focused on APIs, Postgres and systems that stay fast at scale.",
    about: [
      "I build and operate APIs for a living — payments, search and messaging systems that handle thousands of requests a second.",
      "I teach backend fundamentals with a production mindset: validation, error handling, migrations and observability from day one.",
    ],
    skills: ["Node.js", "PostgreSQL", "API design", "Docker"],
    teachingSince: 2020,
    country: "GB",
  },
  {
    key: "sofia",
    name: "Sofia Marquez",
    username: "sofiamarquez",
    title: "Principal Product Designer",
    bio: "Product designer who has led design at two startups. I help engineers and new designers make interfaces people enjoy.",
    about: [
      "Twelve years in product design, from agency work to leading a design team of fifteen.",
      "I believe good design is teachable: a handful of principles about hierarchy, spacing and colour gets you most of the way.",
    ],
    skills: ["UI design", "Figma", "Design systems", "User research"],
    teachingSince: 2018,
    country: "ES",
  },
  {
    key: "ethan",
    name: "Ethan Brooks",
    username: "ethanbrooks",
    title: "Lead Data Scientist",
    bio: "Data scientist turning messy data into decisions. Python, statistics and applied machine learning.",
    about: [
      "I lead a data science team working on forecasting and recommendation systems.",
      "I teach practical data work — the 80% of the job that happens before and after the model.",
    ],
    skills: ["Python", "pandas", "scikit-learn", "LLMs", "Statistics"],
    teachingSince: 2021,
    country: "US",
  },
  {
    key: "hannah",
    name: "Hannah Weiss",
    username: "hannahweiss",
    title: "Product Lead & Coach",
    bio: "Product lead and coach. I teach the non-code skills that make builders effective.",
    about: [
      "I have managed products from zero to millions in revenue and now coach product teams.",
      "My courses cover product thinking, growth, money and focus — the skills nobody teaches in a CS degree.",
    ],
    skills: ["Product management", "Growth", "Personal finance", "Coaching"],
    teachingSince: 2020,
    country: "DE",
  },
]

export type QuizQuestionSpec = {
  prompt: string
  options: string[]
  answer: number
  explanation?: string
}

export type LessonSpec =
  | ["v", string, number, { preview?: boolean }?]
  | ["a", string, number, string[]?]
  | ["q", string, QuizQuestionSpec[]]

export type SectionSpec = { title: string; lessons: LessonSpec[] }

export type CourseSpec = {
  slug: string
  title: string
  subtitle: string
  instructor: string
  category: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS"
  priceCents: number
  listPriceCents: number
  status: "PUBLISHED" | "IN_REVIEW" | "DRAFT"
  /** Relative demand, which shapes how many generated learners enrol. */
  popularity: number
  description: string[]
  outcomes: string[]
  requirements: string[]
  audience: string
  sections: SectionSpec[]
}

export const COURSES: CourseSpec[] = [
  {
    slug: "modern-react-and-nextjs",
    title: "Modern React & Next.js: Build Production Apps",
    subtitle:
      "Master React 19 and the Next.js App Router by building a full-stack app from scratch.",
    instructor: "maya",
    category: "development",
    level: "INTERMEDIATE",
    priceCents: 1999,
    listPriceCents: 8999,
    status: "PUBLISHED",
    popularity: 10,
    description: [
      "This is the course I wish existed when I moved from jQuery to React. We start with components and state, then build a real full-stack product with the Next.js App Router: server components, server actions, authentication, a database and deployment.",
      "Every section ends with a working feature. By the end you will have a portfolio-ready app and a mental model of how modern React actually works — not just the syntax.",
    ],
    outcomes: [
      "Build React components with state, effects and context the idiomatic way",
      "Structure a Next.js App Router project with layouts, loading and error states",
      "Fetch data in Server Components and mutate it with Server Actions",
      "Add authentication and protect routes",
      "Deploy a full-stack app to production",
    ],
    requirements: [
      "Comfortable with modern JavaScript (arrow functions, promises, modules)",
      "Basic HTML and CSS",
    ],
    audience:
      "Developers who know JavaScript and want to build and ship real React applications.",
    sections: [
      {
        title: "Getting started",
        lessons: [
          ["v", "Welcome and what we'll build", 4, { preview: true }],
          [
            "a",
            "How this course works",
            5,
            [
              "Every section of this course ends with a feature you can demo. We build one app — a small learning platform — from an empty folder to a deployed product.",
              "Watch each video once end-to-end, then rebuild the feature yourself with the video paused. Rebuilding from memory is where the learning happens.",
              "## What you need",
              "- Node.js 20 or newer\n- A code editor (VS Code is what I use on screen)\n- A free GitHub account for deployment",
              "If you get stuck, post in the course Q&A with the lesson name and what you tried. I answer questions most weekdays.",
            ],
          ],
          ["v", "Setting up your environment", 9],
        ],
      },
      {
        title: "React fundamentals",
        lessons: [
          ["v", "Components and JSX", 12, { preview: true }],
          ["v", "Props and composition", 11],
          ["v", "State with useState", 14],
          [
            "a",
            "Thinking in React",
            8,
            [
              "The single most useful habit in React is to design your UI as a tree of components *before* you write any code.",
              "## The four steps",
              "1. Break the UI into a component hierarchy.\n2. Build a static version with props only.\n3. Find the minimal state the UI needs.\n4. Decide which component owns each piece of state.",
              "Most bugs in React apps come from duplicated state. If a value can be computed from props or other state, **compute it** instead of storing it.",
            ],
          ],
          ["v", "Effects and when not to use them", 13],
        ],
      },
      {
        title: "The Next.js App Router",
        lessons: [
          ["v", "Routes, layouts and pages", 15],
          ["v", "Server and Client Components", 16],
          ["v", "Data fetching on the server", 14],
          ["v", "Loading and error states", 10],
        ],
      },
      {
        title: "Full-stack features",
        lessons: [
          ["v", "Server Actions and forms", 17],
          ["v", "Authentication and protected routes", 19],
          ["a", "Caching and revalidation explained", 9],
          ["v", "Deploying to production", 12],
          [
            "q",
            "React & Next.js checkpoint",
            [
              {
                prompt:
                  "Which kind of component can read from the database directly?",
                options: [
                  "A Client Component",
                  "A Server Component",
                  "Any component using useEffect",
                  "Only API routes",
                ],
                answer: 1,
                explanation:
                  "Server Components run only on the server, so they can query data sources directly.",
              },
              {
                prompt: "What does the `\"use client\"` directive do?",
                options: [
                  "Makes a component render faster",
                  "Marks the boundary where components start running in the browser",
                  "Disables server rendering for the whole app",
                  "Enables Server Actions",
                ],
                answer: 1,
              },
              {
                prompt:
                  "A value can be computed from existing props. Where should it live?",
                options: [
                  "In new state, updated by an effect",
                  "In a ref",
                  "Computed during render",
                  "In context",
                ],
                answer: 2,
                explanation:
                  "Derived values should be computed during render — storing them duplicates state.",
              },
              {
                prompt: "Which file shows a fallback while a route segment loads?",
                options: ["error.tsx", "layout.tsx", "loading.tsx", "template.tsx"],
                answer: 2,
              },
              {
                prompt: "Server Actions are best suited for…",
                options: [
                  "Animations",
                  "Mutating data from forms and buttons",
                  "Reading browser storage",
                  "Styling components",
                ],
                answer: 1,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "typescript-from-zero-to-confident",
    title: "TypeScript: From Zero to Confident",
    subtitle:
      "Learn the type system properly — generics, narrowing and real-world patterns.",
    instructor: "maya",
    category: "development",
    level: "BEGINNER",
    priceCents: 1499,
    listPriceCents: 6999,
    status: "PUBLISHED",
    popularity: 8,
    description: [
      "TypeScript is now the default for serious JavaScript projects. This course takes you from your first type annotation to writing generic, reusable utilities with confidence.",
      "We focus on the 20% of the type system you'll use 80% of the time, with plenty of exercises from real codebases.",
    ],
    outcomes: [
      "Annotate functions, objects and arrays correctly",
      "Use union types and narrowing to model real data",
      "Write generic functions and components",
      "Configure tsconfig for a modern project",
    ],
    requirements: ["Basic JavaScript knowledge"],
    audience: "JavaScript developers who want to write safer, clearer code.",
    sections: [
      {
        title: "Foundations",
        lessons: [
          ["v", "Why TypeScript?", 6, { preview: true }],
          ["v", "Basic types and annotations", 12],
          [
            "a",
            "Type inference: let the compiler work",
            6,
            [
              "You do not need to annotate everything. TypeScript infers the type of most variables from their initial value.",
              "## A good rule of thumb",
              "- Annotate function **parameters** and **public return types**.\n- Let inference handle local variables.\n- Add an annotation when inference gives you something too wide, like `string` where you wanted a union.",
              "Over-annotating makes code noisy and harder to change. Trust inference, and check what it inferred by hovering in your editor.",
            ],
          ],
        ],
      },
      {
        title: "Modelling data",
        lessons: [
          ["v", "Objects, interfaces and type aliases", 13],
          ["v", "Union types and narrowing", 15],
          ["v", "Discriminated unions", 12],
          ["a", "Optional values and strict null checks", 7],
        ],
      },
      {
        title: "Generics and patterns",
        lessons: [
          ["v", "Generic functions", 14],
          ["v", "Utility types you'll actually use", 11],
          ["v", "Typing React components", 13],
          [
            "q",
            "TypeScript fundamentals quiz",
            [
              {
                prompt: "What does narrowing do?",
                options: [
                  "Removes properties from an object",
                  "Refines a wide type to a more specific one inside a branch",
                  "Converts types at runtime",
                  "Makes a type readonly",
                ],
                answer: 1,
              },
              {
                prompt: "Which utility type makes every property optional?",
                options: ["Required<T>", "Pick<T, K>", "Partial<T>", "Record<K, T>"],
                answer: 2,
              },
              {
                prompt: "In `function first<T>(items: T[]): T`, what is T?",
                options: [
                  "A runtime value",
                  "A type parameter chosen by the caller",
                  "Always `unknown`",
                  "A class",
                ],
                answer: 1,
              },
              {
                prompt:
                  "What field makes a discriminated union easy to narrow?",
                options: [
                  "A shared literal field like `kind`",
                  "An optional field",
                  "A method",
                  "An index signature",
                ],
                answer: 0,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "tailwind-css-in-practice",
    title: "Tailwind CSS in Practice",
    subtitle:
      "Build beautiful, responsive interfaces fast with utility-first CSS and Tailwind v4.",
    instructor: "maya",
    category: "development",
    level: "ALL_LEVELS",
    priceCents: 1299,
    listPriceCents: 4999,
    status: "PUBLISHED",
    popularity: 6,
    description: [
      "Tailwind changed how I write CSS. In this course we rebuild five real interfaces — a landing page, a dashboard, a pricing table, a settings page and a mobile nav — using Tailwind v4.",
    ],
    outcomes: [
      "Build responsive layouts with flexbox and grid utilities",
      "Create a consistent design system with theme tokens",
      "Add dark mode the right way",
      "Keep large Tailwind codebases readable",
    ],
    requirements: ["Basic HTML and CSS"],
    audience: "Developers who want to style interfaces quickly and consistently.",
    sections: [
      {
        title: "Utility-first basics",
        lessons: [
          ["v", "The utility-first mindset", 7, { preview: true }],
          ["v", "Spacing, typography and colour", 12],
          ["a", "Tailwind v4: what changed", 6],
        ],
      },
      {
        title: "Layouts and components",
        lessons: [
          ["v", "Responsive layouts with grid", 14],
          ["v", "Building a dashboard shell", 16],
          ["v", "Dark mode with theme tokens", 11],
          [
            "q",
            "Tailwind checkpoint",
            [
              {
                prompt: "Which prefix applies a utility from the `md` breakpoint up?",
                options: ["md:", "@md", "max-md:", "screen-md-"],
                answer: 0,
              },
              {
                prompt: "Where do you define design tokens in Tailwind v4?",
                options: [
                  "In tailwind.config.js only",
                  "With @theme in your CSS",
                  "In package.json",
                  "Tokens are not supported",
                ],
                answer: 1,
              },
              {
                prompt: "Which utility makes a flex item grow to fill space?",
                options: ["flex-none", "shrink-0", "flex-1", "basis-0"],
                answer: 2,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "advanced-nextjs-patterns",
    title: "Advanced Next.js Patterns",
    subtitle:
      "Streaming, caching, parallel routes and the architecture of large Next.js apps.",
    instructor: "maya",
    category: "development",
    level: "ADVANCED",
    priceCents: 2499,
    listPriceCents: 9999,
    status: "IN_REVIEW",
    popularity: 0,
    description: [
      "For developers who already ship Next.js apps and want to understand what's happening underneath: rendering strategies, the caching layers, streaming with Suspense and patterns for large teams.",
    ],
    outcomes: [
      "Choose the right rendering strategy per route",
      "Reason about every caching layer in Next.js",
      "Stream UI with Suspense boundaries",
      "Use parallel and intercepting routes",
    ],
    requirements: [
      "Completed Modern React & Next.js or equivalent experience",
    ],
    audience: "Experienced Next.js developers.",
    sections: [
      {
        title: "Rendering in depth",
        lessons: [
          ["v", "Static, dynamic and partial prerendering", 16, { preview: true }],
          ["v", "Streaming with Suspense", 14],
          ["a", "The four caching layers", 10],
        ],
      },
      {
        title: "Routing patterns",
        lessons: [
          ["v", "Parallel routes", 13],
          ["v", "Intercepting routes and modals", 15],
          [
            "q",
            "Advanced patterns quiz",
            [
              {
                prompt: "What do parallel routes let you do?",
                options: [
                  "Render multiple pages in the same layout at once",
                  "Run routes on multiple servers",
                  "Load routes in parallel threads",
                  "Nothing — they are deprecated",
                ],
                answer: 0,
              },
              {
                prompt: "What does a Suspense boundary provide while streaming?",
                options: ["An error page", "A fallback UI", "A cache", "A redirect"],
                answer: 1,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "testing-react-applications",
    title: "Testing React Applications",
    subtitle: "Unit, integration and end-to-end tests that give you confidence to ship.",
    instructor: "maya",
    category: "development",
    level: "INTERMEDIATE",
    priceCents: 1799,
    listPriceCents: 7499,
    status: "DRAFT",
    popularity: 0,
    description: [
      "A practical testing course: Vitest, Testing Library and Playwright, and how to decide what to test.",
    ],
    outcomes: [
      "Write component tests with Testing Library",
      "Mock network requests",
      "Write end-to-end tests with Playwright",
    ],
    requirements: ["Comfortable with React"],
    audience: "React developers who want to start testing.",
    sections: [
      {
        title: "Testing foundations",
        lessons: [
          ["v", "What to test (and what not to)", 9],
          ["v", "Your first Vitest test", 11],
        ],
      },
    ],
  },
  {
    slug: "node-apis-with-postgres",
    title: "Build REST APIs with Node.js & PostgreSQL",
    subtitle:
      "Design, build and deploy a production-grade API with validation, auth and migrations.",
    instructor: "daniel",
    category: "development",
    level: "INTERMEDIATE",
    priceCents: 1799,
    listPriceCents: 8499,
    status: "PUBLISHED",
    popularity: 7,
    description: [
      "Learn backend development the way it's done in production. We design a REST API, model it in PostgreSQL, add validation, authentication and tests, and deploy it with Docker.",
    ],
    outcomes: [
      "Design clean, consistent REST endpoints",
      "Model relational data and write migrations",
      "Validate input and handle errors properly",
      "Secure an API with token-based auth",
    ],
    requirements: ["JavaScript fundamentals", "Basic command-line use"],
    audience: "Frontend developers moving into full-stack, and new backend developers.",
    sections: [
      {
        title: "API design",
        lessons: [
          ["v", "What makes a good API", 8, { preview: true }],
          ["a", "Resources, verbs and status codes", 9],
          ["v", "Setting up the project", 10],
        ],
      },
      {
        title: "Data with PostgreSQL",
        lessons: [
          ["v", "Tables, keys and relations", 15],
          ["v", "Migrations that don't break production", 13],
          ["v", "Querying efficiently with indexes", 14],
        ],
      },
      {
        title: "Production concerns",
        lessons: [
          ["v", "Validation and error handling", 12],
          ["v", "Authentication with tokens", 16],
          ["v", "Deploying with Docker", 14],
          [
            "q",
            "Backend checkpoint",
            [
              {
                prompt: "Which status code fits a successful resource creation?",
                options: ["200", "201", "204", "302"],
                answer: 1,
              },
              {
                prompt: "Why add an index to a column?",
                options: [
                  "To make writes faster",
                  "To speed up lookups that filter or sort by it",
                  "To enforce a data type",
                  "To encrypt it",
                ],
                answer: 1,
              },
              {
                prompt: "Where should input validation happen?",
                options: [
                  "Only in the browser",
                  "On the server, for every request",
                  "In the database only",
                  "Nowhere if you use TypeScript",
                ],
                answer: 1,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "ui-design-foundations",
    title: "UI Design Foundations for Developers",
    subtitle:
      "Hierarchy, spacing, colour and typography — make your interfaces look professional.",
    instructor: "sofia",
    category: "design",
    level: "BEGINNER",
    priceCents: 1599,
    listPriceCents: 7999,
    status: "PUBLISHED",
    popularity: 9,
    description: [
      "You don't need to be an artist to design good interfaces. This course teaches the small set of principles that separate amateur UIs from professional ones, with before-and-after redesigns of real screens.",
    ],
    outcomes: [
      "Create clear visual hierarchy on any screen",
      "Use a spacing scale and a type scale",
      "Build a colour palette that works in light and dark mode",
      "Critique and improve existing interfaces",
    ],
    requirements: ["No design experience needed"],
    audience: "Developers and new designers who want their interfaces to look polished.",
    sections: [
      {
        title: "Seeing like a designer",
        lessons: [
          ["v", "Why most developer UIs look 'off'", 7, { preview: true }],
          [
            "a",
            "Hierarchy is everything",
            6,
            [
              "Every screen has one job. Visual hierarchy is how you make that job obvious at a glance.",
              "## Three levers",
              "- **Size**: bigger things are read first.\n- **Weight and colour**: bold and high-contrast text beats light and grey.\n- **Space**: things with room around them feel important.",
              "Before adding a new colour or border, try de-emphasising the secondary content instead. Often the fix is making less important things quieter, not making important things louder.",
            ],
          ],
          ["v", "Spacing scales", 11],
        ],
      },
      {
        title: "Type and colour",
        lessons: [
          ["v", "Choosing and pairing fonts", 12],
          ["v", "A type scale that works", 10],
          ["v", "Building a colour palette", 14],
          ["a", "Designing for dark mode", 7],
        ],
      },
      {
        title: "Putting it together",
        lessons: [
          ["v", "Redesign: a settings page", 16],
          ["v", "Redesign: a pricing table", 15],
          [
            "q",
            "Design foundations quiz",
            [
              {
                prompt: "What is the quickest way to make a primary action stand out?",
                options: [
                  "Add more colours",
                  "De-emphasise the secondary actions",
                  "Add a border to everything",
                  "Use a bigger font everywhere",
                ],
                answer: 1,
              },
              {
                prompt: "Why use a spacing scale?",
                options: [
                  "It limits choices so layouts feel consistent",
                  "Browsers require it",
                  "It makes pages load faster",
                  "It is only for mobile",
                ],
                answer: 0,
              },
              {
                prompt: "In dark mode, pure black backgrounds are often…",
                options: [
                  "Required by accessibility rules",
                  "Softened to a dark grey to reduce harsh contrast",
                  "Replaced with blue",
                  "Never used",
                ],
                answer: 1,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "figma-for-product-teams",
    title: "Figma for Product Teams",
    subtitle: "Components, auto layout, variables and handoff that engineers love.",
    instructor: "sofia",
    category: "design",
    level: "INTERMEDIATE",
    priceCents: 1499,
    listPriceCents: 5999,
    status: "PUBLISHED",
    popularity: 5,
    description: [
      "Go beyond drawing rectangles. Learn how professional product teams use Figma: component libraries, auto layout, variables for theming, and a handoff process that saves everyone time.",
    ],
    outcomes: [
      "Build responsive components with auto layout",
      "Create a themeable library with variables",
      "Prototype realistic flows",
      "Hand off designs developers can build from",
    ],
    requirements: ["A free Figma account"],
    audience: "Designers, PMs and developers working with Figma.",
    sections: [
      {
        title: "Figma essentials",
        lessons: [
          ["v", "The Figma workspace", 8, { preview: true }],
          ["v", "Auto layout from scratch", 15],
          ["v", "Components and variants", 14],
        ],
      },
      {
        title: "Systems and handoff",
        lessons: [
          ["v", "Variables and theming", 13],
          ["a", "A handoff checklist", 5],
          ["v", "Prototyping flows", 12],
          [
            "q",
            "Figma quiz",
            [
              {
                prompt: "What does auto layout do?",
                options: [
                  "Automatically names layers",
                  "Makes frames resize and space children like CSS flexbox",
                  "Exports code",
                  "Aligns everything to the centre",
                ],
                answer: 1,
              },
              {
                prompt: "Variants are used to…",
                options: [
                  "Group states of one component, like hover or disabled",
                  "Store colours",
                  "Share files",
                  "Create prototypes",
                ],
                answer: 0,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "python-for-data-analysis",
    title: "Python for Data Analysis",
    subtitle: "Clean, explore and visualise real datasets with pandas and matplotlib.",
    instructor: "ethan",
    category: "data-ai",
    level: "BEGINNER",
    priceCents: 1799,
    listPriceCents: 8999,
    status: "PUBLISHED",
    popularity: 9,
    description: [
      "Learn the data analysis workflow used by analysts and data scientists every day. We work with real datasets — from loading and cleaning to answering questions and presenting results.",
    ],
    outcomes: [
      "Load and clean messy data with pandas",
      "Group, aggregate and join datasets",
      "Create clear charts with matplotlib",
      "Communicate findings to non-technical people",
    ],
    requirements: ["No prior Python required — we start from the basics"],
    audience: "Anyone who works with spreadsheets and wants to go further.",
    sections: [
      {
        title: "Python essentials",
        lessons: [
          ["v", "Why Python for data", 6, { preview: true }],
          ["v", "Variables, lists and dictionaries", 13],
          ["a", "Setting up Jupyter", 5],
        ],
      },
      {
        title: "pandas in practice",
        lessons: [
          ["v", "DataFrames and Series", 14],
          ["v", "Cleaning messy data", 16],
          ["v", "Grouping and aggregation", 15],
          ["v", "Joining datasets", 12],
        ],
      },
      {
        title: "Visualise and communicate",
        lessons: [
          ["v", "Charts with matplotlib", 14],
          ["a", "Choosing the right chart", 7],
          [
            "q",
            "Data analysis quiz",
            [
              {
                prompt: "Which pandas method summarises a column by group?",
                options: ["merge", "groupby", "pivot_table only", "concat"],
                answer: 1,
              },
              {
                prompt: "What's the best chart for comparing categories?",
                options: ["Pie chart", "Bar chart", "Scatter plot", "Line chart"],
                answer: 1,
              },
              {
                prompt: "What does `df.dropna()` do?",
                options: [
                  "Drops rows with missing values",
                  "Drops duplicate rows",
                  "Deletes the DataFrame",
                  "Renames columns",
                ],
                answer: 0,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "machine-learning-essentials",
    title: "Machine Learning Essentials",
    subtitle: "Understand and build ML models with scikit-learn — no PhD required.",
    instructor: "ethan",
    category: "data-ai",
    level: "INTERMEDIATE",
    priceCents: 2299,
    listPriceCents: 9999,
    status: "PUBLISHED",
    popularity: 7,
    description: [
      "A practical introduction to machine learning: regression, classification, model evaluation and the pitfalls that trip up beginners, all with scikit-learn.",
    ],
    outcomes: [
      "Frame a problem as supervised learning",
      "Train and evaluate regression and classification models",
      "Avoid overfitting and data leakage",
      "Explain model results to stakeholders",
    ],
    requirements: ["Python basics", "High-school maths"],
    audience: "Developers and analysts curious about machine learning.",
    sections: [
      {
        title: "How machine learning works",
        lessons: [
          ["v", "What a model actually learns", 9, { preview: true }],
          ["a", "Training, validation and test sets", 7],
        ],
      },
      {
        title: "Building models",
        lessons: [
          ["v", "Linear regression", 15],
          ["v", "Classification with decision trees", 16],
          ["v", "Evaluating models", 13],
          [
            "q",
            "ML essentials quiz",
            [
              {
                prompt: "A model scores 99% on training data but 60% on test data. This is…",
                options: ["Underfitting", "Overfitting", "Perfect", "Data cleaning"],
                answer: 1,
              },
              {
                prompt: "Which metric suits an imbalanced classification problem better than accuracy?",
                options: ["F1 score", "Mean squared error", "R²", "Row count"],
                answer: 0,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "prompt-engineering-for-builders",
    title: "Prompt Engineering for Builders",
    subtitle: "Design reliable LLM features: prompts, evaluation, tools and structured output.",
    instructor: "ethan",
    category: "data-ai",
    level: "ALL_LEVELS",
    priceCents: 1999,
    listPriceCents: 7999,
    status: "PUBLISHED",
    popularity: 8,
    description: [
      "Large language models are a new kind of building block. This course shows you how to design prompts that work reliably, test them properly and wire models into real product features.",
    ],
    outcomes: [
      "Write clear, structured prompts",
      "Get reliable structured output",
      "Evaluate prompts with test sets",
      "Build a tool-using assistant feature",
    ],
    requirements: ["Basic programming in any language"],
    audience: "Developers and product people building with AI.",
    sections: [
      {
        title: "Prompting fundamentals",
        lessons: [
          ["v", "How LLMs read your prompt", 10, { preview: true }],
          ["a", "Anatomy of a good prompt", 8],
          ["v", "Examples and structured output", 13],
        ],
      },
      {
        title: "From prompt to product",
        lessons: [
          ["v", "Evaluating prompts", 14],
          ["v", "Tool use and agents", 16],
          [
            "q",
            "Prompting quiz",
            [
              {
                prompt: "What is the most reliable way to know a prompt change helped?",
                options: [
                  "Try it once and see",
                  "Run it against a test set and compare",
                  "Make the prompt longer",
                  "Ask the model",
                ],
                answer: 1,
              },
              {
                prompt: "Giving the model a few worked examples is called…",
                options: ["Few-shot prompting", "Fine-tuning", "Tokenising", "Embedding"],
                answer: 0,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "product-management-101",
    title: "Product Management 101",
    subtitle: "Discover what to build, prioritise ruthlessly and ship with your team.",
    instructor: "hannah",
    category: "business",
    level: "BEGINNER",
    priceCents: 1499,
    listPriceCents: 6999,
    status: "PUBLISHED",
    popularity: 6,
    description: [
      "An honest introduction to product management: customer discovery, prioritisation, writing specs people read, and working with engineers and designers.",
    ],
    outcomes: [
      "Run customer discovery interviews",
      "Prioritise with a clear framework",
      "Write lightweight specs",
      "Measure whether a feature worked",
    ],
    requirements: ["None"],
    audience: "Aspiring PMs, engineers and founders.",
    sections: [
      {
        title: "Discovery",
        lessons: [
          ["v", "What a PM actually does", 8, { preview: true }],
          ["v", "Customer interviews", 13],
          ["a", "Turning interviews into insights", 6],
        ],
      },
      {
        title: "Delivery",
        lessons: [
          ["v", "Prioritisation frameworks", 12],
          ["v", "Writing a one-page spec", 10],
          [
            "q",
            "PM basics quiz",
            [
              {
                prompt: "In a discovery interview you should mostly…",
                options: [
                  "Pitch your idea",
                  "Ask about past behaviour and listen",
                  "Ask what features they want",
                  "Show designs",
                ],
                answer: 1,
              },
              {
                prompt: "RICE prioritisation scores Reach, Impact, Confidence and…",
                options: ["Effort", "Revenue", "Risk", "Engagement"],
                answer: 0,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "growth-marketing-playbook",
    title: "The Growth Marketing Playbook",
    subtitle: "Acquisition, activation and retention experiments for early-stage products.",
    instructor: "hannah",
    category: "marketing",
    level: "INTERMEDIATE",
    priceCents: 1699,
    listPriceCents: 6999,
    status: "PUBLISHED",
    popularity: 4,
    description: [
      "Growth isn't hacks — it's a system. Learn to find your growth loops, run experiments and measure what matters.",
    ],
    outcomes: [
      "Map your funnel and find the biggest leak",
      "Design and run growth experiments",
      "Improve activation and retention",
    ],
    requirements: ["A product or idea to apply it to helps"],
    audience: "Founders, marketers and PMs.",
    sections: [
      {
        title: "Growth fundamentals",
        lessons: [
          ["v", "Funnels and loops", 11, { preview: true }],
          ["a", "Metrics that matter", 7],
        ],
      },
      {
        title: "Experiments",
        lessons: [
          ["v", "Designing an experiment", 12],
          ["v", "Activation and onboarding", 13],
          [
            "q",
            "Growth quiz",
            [
              {
                prompt: "Which metric best reflects long-term product value?",
                options: ["Page views", "Retention", "Sign-ups", "Followers"],
                answer: 1,
              },
              {
                prompt: "A growth experiment should start with…",
                options: ["A hypothesis", "A redesign", "A bigger ad budget", "A new logo"],
                answer: 0,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "personal-finance-for-developers",
    title: "Personal Finance for Developers",
    subtitle: "Budgeting, investing and negotiating your salary — money basics for tech careers.",
    instructor: "hannah",
    category: "finance",
    level: "BEGINNER",
    priceCents: 999,
    listPriceCents: 4999,
    status: "PUBLISHED",
    popularity: 5,
    description: [
      "Tech salaries can be great — if you know what to do with them. A practical, jargon-free course on budgeting, emergency funds, index investing, equity and salary negotiation.",
    ],
    outcomes: [
      "Build a simple budget you'll stick to",
      "Understand index funds and compound growth",
      "Evaluate stock options and equity offers",
      "Negotiate your next salary",
    ],
    requirements: ["None"],
    audience: "Developers early in their careers.",
    sections: [
      {
        title: "Money basics",
        lessons: [
          ["v", "Where your money goes", 8, { preview: true }],
          ["a", "The emergency fund", 5],
          ["v", "Investing with index funds", 13],
        ],
      },
      {
        title: "Career money",
        lessons: [
          ["v", "Understanding equity offers", 12],
          ["v", "Negotiating your salary", 14],
          [
            "q",
            "Finance quiz",
            [
              {
                prompt: "An emergency fund typically covers…",
                options: ["1 week", "3–6 months of expenses", "10 years", "Only rent"],
                answer: 1,
              },
              {
                prompt: "Index funds are popular because they are…",
                options: [
                  "Guaranteed to beat the market",
                  "Diversified and low-cost",
                  "Tax-free everywhere",
                  "Only for experts",
                ],
                answer: 1,
              },
            ],
          ],
        ],
      },
    ],
  },
  {
    slug: "deep-work-and-focus",
    title: "Deep Work & Focus for Makers",
    subtitle: "Protect your attention and do your best work in less time.",
    instructor: "hannah",
    category: "personal-development",
    level: "ALL_LEVELS",
    priceCents: 999,
    listPriceCents: 3999,
    status: "PUBLISHED",
    popularity: 6,
    description: [
      "A short, practical course on focus: planning your week, blocking distractions, and building the habits that let you do deep, creative work consistently.",
    ],
    outcomes: [
      "Plan a week around deep work blocks",
      "Reduce context switching",
      "Build sustainable focus habits",
    ],
    requirements: ["None"],
    audience: "Developers, designers and anyone doing creative work.",
    sections: [
      {
        title: "Focus fundamentals",
        lessons: [
          ["v", "Why focus is a superpower", 6, { preview: true }],
          [
            "a",
            "The cost of context switching",
            5,
            [
              "Every time you switch tasks, part of your attention stays on the previous one. Researchers call this *attention residue*.",
              "## What to do about it",
              "- Batch shallow work like email into two or three fixed slots a day.\n- Keep a 'parking lot' note for stray thoughts so you can return to them later.\n- Protect at least one 90-minute block per day with notifications off.",
              "Small changes compound. One protected block a day is over 300 hours of focused work a year.",
            ],
          ],
          ["v", "Planning your week", 9],
        ],
      },
      {
        title: "Habits that stick",
        lessons: [
          ["v", "Designing your environment", 8],
          ["a", "Recovering from a bad week", 4],
          [
            "q",
            "Focus quiz",
            [
              {
                prompt: "What is 'attention residue'?",
                options: [
                  "Tiredness after exercise",
                  "Attention left on a previous task after switching",
                  "A productivity app",
                  "Leftover to-do items",
                ],
                answer: 1,
              },
              {
                prompt: "A good way to handle email is to…",
                options: [
                  "Check it every few minutes",
                  "Batch it into fixed slots",
                  "Never read it",
                  "Keep it open all day",
                ],
                answer: 1,
              },
            ],
          ],
        ],
      },
    ],
  },
]

/** First names and surnames the generated learners are drawn from. */
export const FIRST_NAMES = [
  "Liam", "Olivia", "Noah", "Emma", "Arjun", "Sara", "Kenji", "Amara", "Lucas",
  "Zara", "Mateo", "Chloe", "Ravi", "Isla", "Omar", "Mia", "Tom", "Ananya",
  "Leo", "Grace", "Ivan", "Fatima", "Ben", "Hana", "Diego", "Nora", "Sam",
  "Priya", "Jonas", "Elena", "Kai", "Aisha", "Felix", "Yuki", "Max", "Lina",
  "Aditya", "Clara", "Hugo", "Maya", "Rohan", "Sophie", "Ali", "Ella", "Nikhil",
  "Julia", "Theo", "Rina", "Oscar", "Leila",
]

export const LAST_NAMES = [
  "Smith", "Patel", "Kim", "Garcia", "Nguyen", "Müller", "Rossi", "Santos",
  "Tanaka", "Khan", "Silva", "Novak", "Andersen", "Dubois", "Sharma", "Ito",
  "Brown", "Lopez", "Wilson", "Okoro", "Hansen", "Costa", "Rahman", "Moreau",
  "Kowalski", "Singh", "Park", "Fischer", "Ahmed", "Evans",
]

export const COUNTRIES = ["US", "IN", "GB", "DE", "CA", "BR", "JP", "FR", "ES", "AU", "NG", "NL"]

/** Review text by star rating. */
export const REVIEWS: Record<number, { title: string; body: string }[]> = {
  5: [
    { title: "Best course I've taken", body: "Clear explanations, great pacing and a real project at the end. I finally understand how the pieces fit together." },
    { title: "Worth every penny", body: "The instructor explains the 'why', not just the 'how'. I used what I learned at work the very next week." },
    { title: "Exactly what I needed", body: "Well structured and practical. The quizzes helped me check I'd actually understood each section." },
    { title: "Fantastic", body: "Short, focused lessons that respect your time. I'd buy anything else this instructor makes." },
    { title: "Great for beginners and beyond", body: "Starts gently but gets to real-world material quickly. The Q&A answers were fast and helpful." },
    { title: "Superb production quality", body: "Crisp videos, clean examples and no filler. Highly recommended." },
  ],
  4: [
    { title: "Very good, a few rough edges", body: "Great content overall. A couple of lessons felt rushed, but the project tied everything together." },
    { title: "Solid and practical", body: "Good balance of theory and hands-on work. Would love a bonus section on advanced topics." },
    { title: "Learned a lot", body: "Clear teaching. Some videos could be a bit shorter, but I'm happy with it." },
    { title: "Recommended", body: "Helped me get unstuck on concepts I'd struggled with for months." },
  ],
  3: [
    { title: "Good but basic", body: "Useful introduction, though I expected more depth in the later sections." },
    { title: "Okay", body: "Decent material, but the pace was a little slow for me." },
  ],
  2: [
    { title: "Not for me", body: "The content was fine but it assumed more background than the description suggested." },
  ],
}

/** Instructor replies to reviews. */
export const REVIEW_REPLIES = [
  "Thank you so much — this made my day! Good luck with your project.",
  "Really appreciate the detailed feedback. I'm recording an extra section on exactly that.",
  "Thanks for taking the time to write this. Let me know in the Q&A if you get stuck on anything.",
]

/** Q&A threads on the demo instructor's courses. */
export const QUESTIONS: { title: string; body: string; answer?: string }[] = [
  {
    title: "When should I use a Server Action vs an API route?",
    body: "In the forms section you used a Server Action. When would you still reach for a route handler instead?",
    answer: "Great question! Use Server Actions for mutations triggered by your own UI (forms, buttons). Reach for a route handler when something outside your app calls you — a webhook, a mobile app, or a third-party integration.",
  },
  {
    title: "Hydration error after adding a date",
    body: "I'm rendering `new Date().toLocaleString()` and getting a hydration mismatch warning. What am I doing wrong?",
    answer: "The server and browser render at different times (and possibly time zones), so the text differs. Render the date on the client only, or pass a fixed timestamp from the server and format it consistently.",
  },
  {
    title: "Is useEffect needed for fetching data here?",
    body: "In the data fetching lesson you fetched directly in the component. Don't we need useEffect?",
    answer: "Not in a Server Component — it's async and runs on the server, so you can simply await your data. useEffect fetching is for Client Components, and even there a library like SWR or React Query is usually nicer.",
  },
  {
    title: "Generic constraint not working",
    body: "I wrote `function getId<T>(item: T) { return item.id }` and TypeScript complains. Why?",
    answer: "TypeScript doesn't know T has an `id`. Add a constraint: `function getId<T extends { id: string }>(item: T)`.",
  },
  {
    title: "Dark mode flickers on first load",
    body: "My page flashes light before switching to dark. Any tips?",
  },
  {
    title: "Can I use this with the Pages Router?",
    body: "My company project still uses the Pages Router. How much of this section applies?",
  },
]

/** Community topics and discussions. */
export const TOPICS = [
  { slug: "general", name: "General", description: "Say hello and talk about anything learning-related.", accentColor: "blue" },
  { slug: "web-development", name: "Web Development", description: "React, Next.js, backend and everything web.", accentColor: "violet" },
  { slug: "design-critique", name: "Design Critique", description: "Share your work and get feedback.", accentColor: "amber" },
  { slug: "careers", name: "Careers & Jobs", description: "Job hunting, interviews and career growth.", accentColor: "green" },
]

export const DISCUSSIONS: {
  topic: string
  course?: string
  title: string
  body: string
  tags: string[]
  replies: string[]
  pinned?: boolean
}[] = [
  {
    topic: "general",
    title: "Welcome to the Lumen community 👋",
    body: "Introduce yourself! Tell us what you're learning and what you want to build this year.",
    tags: ["introductions"],
    replies: [
      "Hi all! Frontend dev from Toronto, working through the React course.",
      "Hello from Berlin — learning data analysis to move into an analyst role.",
      "Designer here, finally learning to code. Excited!",
    ],
    pinned: true,
  },
  {
    topic: "web-development",
    course: "modern-react-and-nextjs",
    title: "Show your final project from the React course",
    body: "Finished the Next.js project? Drop a link and one thing you'd do differently.",
    tags: ["projects", "nextjs"],
    replies: [
      "Mine's a habit tracker — I'd add optimistic updates next time.",
      "Built a recipe app. Server Actions made forms so much simpler.",
    ],
  },
  {
    topic: "web-development",
    title: "Server Components finally clicked for me",
    body: "Thinking of them as 'components that run where the data is' made everything make sense. What analogy helped you?",
    tags: ["react"],
    replies: ["For me it was 'HTML templates that can await'."],
  },
  {
    topic: "design-critique",
    title: "Feedback on my portfolio landing page?",
    body: "I applied the hierarchy lesson from UI Design Foundations. Does the hero read clearly?",
    tags: ["feedback", "portfolio"],
    replies: [
      "Much clearer than before! Maybe reduce the subtitle weight a bit.",
      "The CTA stands out nicely. Try more space above the fold section.",
    ],
  },
  {
    topic: "careers",
    title: "How I landed my first dev job after 8 months of learning",
    body: "Sharing my timeline, the projects I built and what actually got me interviews.",
    tags: ["career", "story"],
    replies: [
      "This is so motivating, thank you for writing it up.",
      "Did you apply to startups or bigger companies?",
      "Saving this. The portfolio tips are gold.",
    ],
  },
  {
    topic: "careers",
    title: "Salary negotiation — what worked for you?",
    body: "After the finance course I negotiated for the first time and got 12% more. Curious about others' experience.",
    tags: ["salary"],
    replies: ["Always ask for the full range first — it anchors the conversation."],
  },
]

/** Direct messages between the demo student and the demo instructor. */
export const STUDENT_THREAD = [
  { from: "student", body: "Hi Maya! Loving the React course. Quick question — do you have any tips for structuring folders in a larger Next.js app?" },
  { from: "instructor", body: "Hi Alex, thanks so much! Group by feature rather than by file type — a `components/dashboard/` folder beats one giant `components/` folder. Route groups help too." },
  { from: "student", body: "That makes sense. I'll refactor my project this weekend." },
  { from: "instructor", body: "Great! Share it in the community when it's done — I'd love to see it. The advanced patterns course covers this in depth too, it's coming soon." },
]
