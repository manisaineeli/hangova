/* ============================================================
   All content transcribed from the project presentation
   "AI Trip Planning & Booking System" (Review-1)
   ============================================================ */

export const meta = {
  title: 'AI Trip Planning & Booking System',
  name: 'Hangova',
  tagline: 'Find your place in the wild',
  dept: 'Department of AI & ML',
  guide: {
    name: 'Mrs. Ch.D.V.P. Kumari',
    role: 'Assistant Professor',
    dept: 'Department of AI&ML',
  },
  team: [
    { name: 'P. Srinadh', roll: '24B11AI318', role: 'Backend & AI Services', av: '#4ade80', av2: '#0ea5e9' },
    { name: 'N. Mani Sai', roll: '24B11AI295', role: 'Frontend & UI/3D', av: '#7dd3fc', av2: '#818cf8' },
    { name: 'N. Narayana', roll: '24B11AI298', role: 'APIs & Integration', av: '#fbbf24', av2: '#fb923c' },
    { name: 'K. Nikhil Varma', roll: '24B11AI201', role: 'Database & Auth', av: '#34d399', av2: '#4ade80' },
  ],
  stats: [
    { v: '4', l: 'Modules' },
    { v: '6+', l: 'Live APIs' },
    { v: '3', l: 'AI Services' },
    { v: '1', l: 'Platform' },
  ],
}

export const nav = [
  { id: 'places', label: 'Places' },
  { id: 'why', label: 'Why Hangova' },
  { id: 'features', label: 'Capabilities' },
  { id: 'compare', label: 'Before / After' },
  { id: 'modules', label: 'Modules' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'tech', label: 'Tech' },
  { id: 'team', label: 'Team' },
  { id: 'results', label: 'Results' },
]

/* ============================================================
   Trip templates — ready-made "place" presets.
   Selecting one loads the AI planner in the hero.
   ============================================================ */
export const templates = [
  {
    id: 'himalaya',
    name: 'Himalayan Escape',
    place: 'Manali · Solang · Kufri',
    tag: 'Mountains',
    ic: '🏔️',
    days: 5,
    travellers: 2,
    budget: 95000,
    interest: 'Mountains',
    c: '#7dd3fc',
    c2: '#0ea5e9',
    blurb: 'Snowline viewpoints, pine forest trails and a river valley picnic above 2,000 m.',
    days_plan: [
      ['Day 1', 'Arrive Manali · Mall Road evening walk', 14000],
      ['Day 2', 'Solang Valley · ridge sunrise viewpoint', 22000],
      ['Day 3', 'Hadagani waterfall · forest trail', 16000],
      ['Day 4', 'Kufri · snow-dance and valley picnic', 21000],
      ['Day 5', 'Departure · local market souvenirs', 12000],
    ],
  },
  {
    id: 'coast',
    name: 'Coastal Serenity',
    place: 'Goa · Palolem · Agonda',
    tag: 'Beaches',
    ic: '🏝️',
    days: 4,
    travellers: 2,
    budget: 70000,
    interest: 'Beaches',
    c: '#5eead4',
    c2: '#0d9488',
    blurb: 'Quiet southern beaches, a lagoon snorkelling trip and a sunset seafood evening.',
    days_plan: [
      ['Day 1', 'Palolem beach · sunset walk', 16000],
      ['Day 2', 'Agonda · Coco Beach sunrise', 15000],
      ['Day 3', 'Netravali lagoon snorkelling', 19000],
      ['Day 4', 'Old Goa churches · seafood dinner', 18000],
    ],
  },
  {
    id: 'heritage',
    name: 'Heritage Trail',
    place: 'Jaipur · Jodhpur · Udaipur',
    tag: 'Heritage',
    ic: '🏛️',
    days: 6,
    travellers: 4,
    budget: 140000,
    interest: 'Heritage',
    c: '#fbbf24',
    c2: '#d97706',
    blurb: 'Forts, stepwells and old-city bazaars stitched into one Rajasthan circuit.',
    days_plan: [
      ['Day 1', 'Amber Fort ramparts · light show', 24000],
      ['Day 2', 'Hawa Mahal · City Palace bazaar', 22000],
      ['Day 3', 'Jodhpur · Mehrangarh and blue lanes', 26000],
      ['Day 4', 'Udaipur · lake palace at dusk', 28000],
      ['Day 5', 'Ranakpur Jain temple circuit', 22000],
      ['Day 6', 'Return · handicraft market', 18000],
    ],
  },
  {
    id: 'wild',
    name: 'Wildlife Safari',
    place: 'Ranthambore · Ranthambore · Bundi',
    tag: 'Wildlife',
    ic: '🐅',
    days: 4,
    travellers: 2,
    budget: 85000,
    interest: 'Wildlife',
    c: '#4ade80',
    c2: '#15803d',
    blurb: 'Forest safaris at dawn, a birdwatching hide and a village nature walk.',
    days_plan: [
      ['Day 1', 'Ranthambore fort gate · forest buffer', 20000],
      ['Day 2', 'Dawn safari drive · core zone', 26000],
      ['Day 3', 'Birdwatching hide · Padmavati area', 18000],
      ['Day 3', 'Village nature walk · local cuisine', 15000],
      ['Day 4', 'Dawn drive and departure', 16000],
    ],
  },
  {
    id: 'garden',
    name: 'Tea Garden Trail',
    place: 'Munnar · Kolukkumalai · Thekkady',
    tag: 'Hills',
    ic: '🍵',
    days: 5,
    travellers: 2,
    budget: 60000,
    interest: 'Mountains',
    c: '#a3e635',
    c2: '#4d7c0f',
    blurb: 'Rolling tea terraces, misty viewpoints and a spice plantation walk in the Western Ghats.',
    days_plan: [
      ['Day 1', 'Munnar town · evening market', 11000],
      ['Day 2', 'Tea museum · terrace walk', 12000],
      ['Day 3', 'Kolukkumalai sunrise viewpoint', 14000],
      ['Day 4', 'Spice plantation and cooking class', 13000],
      ['Day 5', 'Departure · local handicrafts', 10000],
    ],
  },
  {
    id: 'island',
    name: 'Island & Reef',
    place: 'Port Blair · Havelock · Neil',
    tag: 'Islands',
    ic: '🐚',
    days: 5,
    travellers: 2,
    budget: 110000,
    interest: 'Beaches',
    c: '#67e8f9',
    c2: '#0e7490',
    blurb: 'Radhanagar Beach, a glass-bottom boat reef ride and island-hopping to Neil Island.',
    days_plan: [
      ['Day 1', 'Port Blair · Cellular Jail light show', 22000],
      ['Day 2', 'Havelock · Radhanagar Beach', 24000],
      ['Day 3', 'Elephant Beach · snorkelling', 21000],
      ['Day 4', 'Neil Island · natural bridge', 23000],
      ['Day 5', 'Departure', 18000],
    ],
  },
]

export const INTERESTS = ['Heritage', 'Beaches', 'Mountains', 'Food', 'Wildlife', 'Nightlife']

export const intro = {
  eyebrow: 'Introduction',
  lead: 'is an intelligent travel application designed to make trip planning easy, fast and personalised.',
  body: [
    'In traditional trip planning, users need to search different websites and applications for destinations, hotels, transportation, tourist places, weather, maps and travel costs.',
    'The system also integrates travel-related APIs to provide information such as weather, maps, hotels, transportation and booking services in one platform. AI is used to understand the user’s destination, budget, travel duration, interests, number of travellers and preferences.',
  ],
  goal: 'The main goal of our project is to reduce travel-planning effort and provide a smart, convenient and personalised travel experience.',
  abstract: {
    title: 'Abstract',
    body: 'The AI Trip Planning & Booking System is an intelligent travel application developed to make trip planning easier, faster and more personalised. Traditional travel planning requires users to visit multiple websites and applications to search for weather information, hotel and transport options, and travel costs. The system uses Artificial Intelligence to understand the user’s destination, budget, travel duration, interests, number of travellers and preferences. The application also integrates different REST APIs to obtain real-time or current travel-related information such as weather conditions, maps and locations, hotels, transportation and booking services.',
  },
}

export const problems = [
  {
    ic: '⏳',
    t: 'Time consuming',
    d: 'Users must search across many websites and applications before a single trip can be planned.',
  },
  {
    ic: '🧩',
    t: 'Fragmented information',
    d: 'Hotels, transport, weather and tourist spots are not available together in one place.',
  },
  {
    ic: '🎯',
    t: 'No personal itinerary',
    d: 'Difficult to create a personal itinerary based on individual interests and preferences.',
  },
  {
    ic: '⚖️',
    t: 'Confusing comparison',
    d: 'Comparing multiple hotels and transport options across sites is confusing and tedious.',
  },
  {
    ic: '💸',
    t: 'Budget management',
    d: 'Difficult to manage the budget and estimate the total expenses of a complete trip.',
  },
  {
    ic: '🌦️',
    t: 'Weather uncertainty',
    d: 'Unpredictable weather changes can affect and invalidate the entire travel plan.',
  },
  {
    ic: '🚫',
    t: 'No single platform',
    d: 'There is no single platform that provides all these travel services together.',
  },
  {
    ic: '🔁',
    t: 'Repetitive effort',
    d: 'Every new trip forces the user to repeat the same research from scratch again.',
  },
]

export const features = [
  { ic: '🤖', t: 'AI-Based Trip Planning', d: 'Creates a personalised day-by-day travel plan automatically.', c: '#4ade80' },
  { ic: '🧭', t: 'Destination Recommendations', d: 'Suggests places and activities based on the user’s interests.', c: '#7dd3fc' },
  { ic: '🏨', t: 'Hotel & Transportation', d: 'Provides suitable accommodation and travel options for the trip.', c: '#c4b5fd' },
  { ic: '🌦️', t: 'Weather Information', d: 'Displays weather details according to the selected destination.', c: '#7dd3fc' },
  { ic: '💰', t: 'Budget Estimation', d: 'Calculates approximate trip expenses from the chosen budget.', c: '#fbbf24' },
  { ic: '📋', t: 'Booking Management', d: 'Helps users manage hotel and transportation bookings end to end.', c: '#5eead4' },
  { ic: '✨', t: 'Personalised Experience', d: 'Plans trips around destination, budget, duration and preferences.', c: '#a3e635' },
  { ic: '💳', t: 'Travel Financing', d: 'Borrowing option for trips, processed by the admin as nominee.', c: '#fb923c' },
]

export const comparison = [
  ['Manual trip planning', 'AI-based trip planning'],
  ['Information from multiple websites', 'Information in one platform'],
  ['Generic recommendations', 'Personalised recommendations'],
  ['Manual itinerary creation', 'Automatic itinerary generation'],
  ['Difficult budget management', 'Estimated trip cost'],
  ['Separate travel services', 'Integrated booking services'],
  ['Limited personalisation', 'User preference-based planning'],
]

export const modules = [
  {
    no: '01',
    ic: '🔐',
    name: 'User & Admin',
    tag: 'Identity · Access · Trust',
    c: '#4ade80',
    purpose:
      'The User Management Module is responsible for securely managing user accounts and controlling access to the travel application. It stores user details and travel preferences, which can later be used by the AI system to provide personalised trip recommendations.',
    keys: [
      'User registration and login',
      'JWT-based authentication',
      'User and Admin profiles',
      'Store user and admin data',
      'Secure data management',
    ],
    foot: 'Securely manage users, authentication, profiles and preferences.',
  },
  {
    no: '02',
    ic: '🧠',
    name: 'AI Trip Planning',
    tag: 'The Intelligence Core',
    c: '#c4b5fd',
    purpose:
      'The AI Trip Planning Module is the core module of the system. It analyses the user’s destination, budget, travel duration, interests and preferences to automatically generate a personalised and optimised day-wise travel itinerary.',
    keys: [
      'Destination, budget and duration input',
      'AI-generated day-wise itinerary',
      'Tourist place recommendations',
      'Activity recommendations',
      'Budget-based suggestions',
      'Personalised trip planning',
    ],
    foot: 'Create personalised travel plans using AI.',
  },
  {
    no: '03',
    ic: '🎟️',
    name: 'Borrow & Booking',
    tag: 'Reserve · Finance',
    c: '#fbbf24',
    purpose:
      'The Borrow & Booking Module provides a money borrowing option through the admin acting as nominee for the users, and booking helps users to select suitable hotels and transportation options. It integrates external APIs to collect the related information.',
    keys: [
      'Hotel recommendations',
      'Flight / train / bus information',
      'Borrowing money option',
      'Weather information',
      'Booking and cancellation',
    ],
    foot: 'Provide travel information and manage bookings.',
  },
  {
    no: '04',
    ic: '🗂️',
    name: 'Travel Information',
    tag: 'Trips · Admin · Records',
    c: '#5eead4',
    purpose:
      'The Trip Information Management module allows admin and users to manage their complete trip on a single platform, while providing administrators with control over users, destinations, bookings and system activities.',
    keys: [
      'View and modify trip plans',
      'Booking history',
      'Expense summary',
      'Save and update itineraries',
      'Manage users and destinations',
      'Monitor bookings',
      'Summarised trip data',
    ],
    foot: 'Manage trips, bookings, users and overall system administration.',
  },
]

export const archNodes = [
  {
    id: 'react',
    label: 'React.js',
    lvl: 'Client · Presentation',
    d: 'Single-page travel dashboard with the 3D trip planner, itinerary timeline, booking screens and admin console.',
    c: '#7dd3fc',
  },
  {
    id: 'gateway',
    label: 'API Gateway',
    lvl: 'Edge · Routing',
    d: 'Single entry point that routes every client request to the correct microservice, with rate limiting and CORS handling.',
    c: '#4ade80',
  },
  {
    id: 'user',
    label: 'User Service',
    lvl: 'Microservice 01',
    d: 'Registration, JWT authentication, user and admin profiles, stored preferences and secure data management.',
    c: '#c4b5fd',
  },
  {
    id: 'trip',
    label: 'Trip Service',
    lvl: 'Microservice 02',
    d: 'Consumes the Gemini API to generate personalised day-wise itineraries, place and activity suggestions.',
    c: '#5eead4',
  },
  {
    id: 'booking',
    label: 'Booking Service',
    lvl: 'Microservice 03',
    d: 'Hotel and transport selection, booking, cancellation, history and the travel borrowing workflow.',
    c: '#fbbf24',
  },
  {
    id: 'db',
    label: 'Database',
    lvl: 'Persistence',
    d: 'MongoDB or PostgreSQL stores users, preferences, itineraries, bookings, expenses and admin activity logs.',
    c: '#a3e635',
  },
  {
    id: 'gemini',
    label: 'Gemini API',
    lvl: 'AI Provider',
    d: 'Google Gemini generates the itinerary, destination recommendations and budget-aware activity suggestions.',
    c: '#7dd3fc',
  },
  {
    id: 'travel',
    label: 'Travel APIs',
    lvl: 'External',
    d: 'Aggregated gateway for Google Maps / Places, Weather, Hotel and Transportation providers.',
    c: '#fb923c',
  },
  {
    id: 'maps',
    label: 'Maps',
    lvl: 'Provider',
    d: 'Google Maps / Places API — location search, nearby attractions, distance and route data.',
    c: '#4ade80',
  },
  {
    id: 'weather',
    label: 'Weather',
    lvl: 'Provider',
    d: 'Live weather conditions and forecast for the selected destination and travel dates.',
    c: '#5eead4',
  },
  {
    id: 'hotels',
    label: 'Hotels / Transport',
    lvl: 'Provider',
    d: 'Hotel availability and pricing, plus flight, train and bus schedules with live fares.',
    c: '#fbbf24',
  },
]

/* Graph wiring for the interactive 3D architecture view */
export const archEdges = [
  ['react', 'gateway'],
  ['gateway', 'user'],
  ['gateway', 'trip'],
  ['gateway', 'booking'],
  ['user', 'db'],
  ['trip', 'gemini'],
  ['booking', 'travel'],
  ['travel', 'maps'],
  ['travel', 'weather'],
  ['travel', 'hotels'],
]

/* Layer grouping used by the architecture legend */
export const archLayers = [
  { t: 'Client', ids: ['react'], c: '#7dd3fc' },
  { t: 'Edge', ids: ['gateway'], c: '#4ade80' },
  { t: 'Microservices', ids: ['user', 'trip', 'booking'], c: '#c4b5fd' },
  { t: 'Backends & AI', ids: ['db', 'gemini', 'travel'], c: '#fbbf24' },
  { t: 'External APIs', ids: ['maps', 'weather', 'hotels'], c: '#fb923c' },
]

export const stack = [
  {
    l: 'Frontend',
    c: '#7dd3fc',
    items: ['React.js', 'HTML', 'CSS', 'JavaScript'],
  },
  {
    l: 'Backend',
    c: '#4ade80',
    items: ['Java', 'Spring Boot', 'REST APIs'],
  },
  {
    l: 'Artificial Intelligence',
    c: '#c4b5fd',
    items: ['Google Gemini API'],
  },
  {
    l: 'Database',
    c: '#a3e635',
    items: ['MongoDB', 'PostgreSQL'],
  },
  {
    l: 'External APIs',
    c: '#fbbf24',
    items: ['Google Maps / Places', 'Weather API', 'Hotel & Transport APIs'],
  },
  {
    l: 'Authentication',
    c: '#5eead4',
    items: ['Spring Security', 'JWT'],
  },
  {
    l: 'API Testing',
    c: '#fb923c',
    items: ['Postman'],
  },
  {
    l: 'Development Tools',
    c: '#7dd3fc',
    items: ['VS Code', 'IntelliJ IDEA', 'Maven'],
  },
  {
    l: 'Version Control',
    c: '#c084fc',
    items: ['Git', 'GitHub'],
  },
  {
    l: 'Architecture',
    c: '#4ade80',
    items: ['Microservices', 'API Gateway'],
  },
  {
    l: 'Deployment',
    c: '#34d399',
    items: ['Render', 'Vercel'],
  },
]

export const flow = ['React.js', 'API Gateway', 'Spring Boot Microservices', 'MongoDB / PostgreSQL', 'AI & External APIs']

export const outcomes = [
  { n: '01', t: 'Personalised trip plans', d: 'Generate day-wise itineraries based on user preferences, budget and duration.', c: '#4ade80' },
  { n: '02', t: 'AI recommendations', d: 'Suggest suitable destinations, tourist places and activities per interest.', c: '#7dd3fc' },
  { n: '03', t: 'Integrated travel information', d: 'Provide hotel, transportation and weather details using live REST APIs.', c: '#c4b5fd' },
  { n: '04', t: 'Booking support', d: 'Simplify hotel and transportation booking management with cancellation.', c: '#5eead4' },
  { n: '05', t: 'Budget estimation', d: 'Calculate approximate trip expenses based on the user’s selected budget.', c: '#fbbf24' },
  { n: '06', t: 'Time saving', d: 'Reduce the effort and time required for manual trip planning.', c: '#a3e635' },
  { n: '07', t: 'Better user experience', d: 'A simple, smart and convenient platform for planning a whole trip.', c: '#fb923c' },
  { n: '08', t: 'Scalable system', d: 'Microservices architecture supports future expansion and new travel services.', c: '#7dd3fc' },
]

export const conclusion =
  'The AI Trip Planning & Booking System replaces scattered manual research with one intelligent platform that plans, prices and books an entire trip. AI understands who the traveller is and what they care about, live APIs supply real-world availability, and microservices keep every capability independently scalable.'

