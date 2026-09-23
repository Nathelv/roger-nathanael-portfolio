/* ============================================================
   PORTFOLIO KNOWLEDGE BASE — single source of truth
   ------------------------------------------------------------
   This is the structured data behind the site content and the
   chatbot. It is consumed today by:
     - initChatbot()  (answers + navigation actions)
     - initSkills()   (skills grid on skills.html)
   and later (Phase 2) by the AI assistant as grounding context.

   RULES:
   - Only contains information that ALREADY exists on the website.
   - Nothing here is invented. Fields that are genuinely unknown
     are omitted or listed under `unavailable` so the assistant
     can say "not available" instead of guessing.
   - Plain global object (no build step / no modules) to match the
     project's static multi-page architecture. Loaded via a
     <script> tag before js/main.js on every page.
   ============================================================ */
(function (global) {
  'use strict';

  var PORTFOLIO = {
    /* -------------------- PROFILE -------------------- */
    profile: {
      name: 'Roger Nathanael',
      title: 'Systems Analyst & Business Intelligence Enthusiast',
      tagline: 'Undergraduate Business Information Technology student at BINUS University (GPA: 3.83/4.00) specializing in system workflow optimization, functional requirements, and data-driven solutions. Experienced in bridging user needs with practical technology through relational database design, interactive Excel BI dashboards, and AI-assisted workflows.',
      positioning: 'Bridging user needs with data-driven systems',
      location: 'Bekasi, Indonesia',
      status: 'Open to internship opportunities',
      highlights: ['BIT Student', 'GPA 3.83', 'IoT Project — 1st Place']
    },

    /* -------------------- ABOUT -------------------- */
    about: {
      summary: [
        'I am an undergraduate Business Information Technology student at BINUS University (GPA 3.83/4.00), focused on a career as a Systems Analyst and in Business Intelligence.',
        'I specialize in system workflow optimization, functional requirements, and data-driven solutions — bridging user needs with practical technology through relational database design, interactive Excel BI dashboards, and AI-assisted workflows.',
        "Through team-based academic projects I've also developed my communication, collaboration, problem-solving, and adaptability skills."
      ],
      journey: ['Curiosity', 'Design', 'Programming', 'Data', 'IoT', 'Business & Technology']
    },

    /* -------------------- EDUCATION -------------------- */
    education: [
      {
        institution: 'BINUS University',
        degree: 'Bachelor of Business Information Technology',
        period: '2024 - Present',
        gpa: '3.83',
        campus: 'Bekasi'
      },
      {
        institution: 'SMAS Yadika 4',
        degree: 'Social Sciences Major',
        period: '2021 - 2024'
      }
    ],
    coursework: [
      'Information Systems Analysis',
      'Programming for Business',
      'Machine Learning',
      'Data Modelling',
      'Project Management',
      'Smart Application',
      'Research Method in Information Systems'
    ],

    /* -------------------- SKILLS -------------------- */
    /* Categories mirror the Skills page exactly. */
    skills: {
      categories: [
        { icon: '📝', title: 'Requirements & Systems Analysis', items: ['Functional & Non-Functional Requirements', 'User Stories', 'Use Case Modeling', 'User Role Access Control (CRUD/Permissions)', 'User Acceptance Testing (UAT)'] },
        { icon: '📊', title: 'Database & Business Intelligence', items: ['SQL / MySQL', 'Relational Schema Design', 'Microsoft Excel (Power Pivot, DAX Measures, Cube Functions, What-If Analysis)', 'Multidimensional Data Modeling'] },
        { icon: '🛠️', title: 'Tools & Frameworks', items: ['Agile Concepts', 'Trello', 'Figma (Prototyping)', 'SAP Signavio (BPMN)', 'Google AI Studio (Gemini API Integration & Prompt Engineering)', 'PHP', 'XAMPP', 'IoT Hardware (ESP32, DHT11)'] }
      ],
      tools: ['MySQL', 'Microsoft Excel', 'Trello', 'Figma', 'SAP Signavio', 'Google AI Studio', 'PHP', 'XAMPP']
    },

    /* -------------------- PROJECTS -------------------- */
    /* `page` is the detail file used by the existing navigation system.
       Fields are populated only with confirmed information; unconfirmed
       fields are omitted rather than guessed. */
    projects: [
      {
        id: 'iot-sawit',
        name: 'Smart Sawit',
        subtitle: 'IoT Smart Palm Oil Plantation',
        category: 'IoT Telemetry & AI Workflow',
        context: 'IoT Telemetry & AI Workflow',
        date: 'May 2026',
        award: '1st Rank across Cohort | Exhibited at SPARK EXPO 2026',
        type: 'Academic Group Project',
        summary: 'An IoT telemetry pipeline for palm oil plantations that streams real-time microclimate data to a Blynk cloud dashboard and uses the Gemini API to turn sensor readings into automated agricultural recommendations.',
        overview: 'A real-time IoT plantation monitoring system. An ESP32 microcontroller with DHT11 and soil hygrometer sensors transmits microclimate data to a Blynk cloud dashboard, and a planned Gemini API integration analyses those readings to generate automated agricultural action recommendations.',
        summaryPoints: [
          'Designed an IoT telemetry pipeline using an ESP32 microcontroller with DHT11 and soil hygrometer sensors to transmit real-time palm oil plantation microclimate data to a Blynk cloud dashboard.',
          'Planned the Gemini API integration flow to analyse sensor telemetry readings and generate automated agricultural action recommendations.',
          'Produced the exhibition assets and pitch presentation materials that helped the team win 1st place in the cohort at SPARK EXPO 2026.'
        ],
        technologies: ['ESP32', 'DHT11', 'Soil Hygrometer', 'Blynk IoT Dashboard', 'Google AI Studio (Gemini API)'],
        tags: ['IoT', 'Telemetry', 'Smart Agriculture', 'AI Workflow', 'Team Project'],
        achievement: '1st Rank across Cohort',
        page: 'project-iot-sawit.html'
      },
      {
        id: 'cpu-dashboard',
        name: 'Smartphone CPU Performance Dashboard',
        category: 'Business Intelligence & Data Modeling',
        context: 'Business Intelligence & Data Modeling',
        date: 'May 2026',
        type: 'Academic Project',
        summary: 'An interactive Business Intelligence dashboard in Microsoft Excel that processes smartphone processor benchmark data, using DAX measures, interactive slicers, and What-If Analysis for multi-variable chipset comparison.',
        overview: 'An interactive Business Intelligence reporting dashboard built in Microsoft Excel to process and evaluate a smartphone processor performance benchmark dataset, with custom DAX measures, interactive slicers, and What-If scenario modelling.',
        summaryPoints: [
          'Built an interactive Business Intelligence reporting dashboard to process and evaluate a smartphone processor performance benchmark dataset.',
          'Developed custom DAX-based measures and interactive slicers to present multi-variable comparisons of chipset performance KPIs.',
          'Applied What-If Analysis simulations to model device performance scenarios as a basis for data-driven decision making.'
        ],
        technologies: ['Microsoft Excel', 'Power Pivot', 'DAX', 'Cube Functions', 'What-If Analysis', 'Interactive Slicers'],
        tags: ['Business Intelligence', 'Data Modeling', 'Excel', 'DAX', 'Dashboard'],
        page: 'project-cpu-dashboard.html'
      },
      {
        id: 'healthylife',
        name: 'HealthyLife Hub',
        subtitle: 'Health & Wellness Information System',
        category: 'Web System & Role-Based Access Control',
        context: 'Web System & Role-Based Access Control',
        date: 'December 2025',
        type: 'Academic Group Project',
        summary: 'A PHP and MySQL health portal with educational articles, lifestyle trackers, and a health quiz, featuring role-based access control and a domain-specific Gemini API chatbot.',
        overview: 'An interactive PHP and MySQL health web portal featuring an educational article catalogue, lifestyle trackers (nutrition and sleep cycle), and a health quiz, with role-based access control and an integrated Gemini API chatbot for automated health information consultation.',
        summaryPoints: [
          'Developed an interactive PHP and MySQL health web portal covering an educational article catalogue, lifestyle trackers (nutrition and sleep cycle), and a health quiz.',
          'Implemented Role-Based Access Control separating general users (activity tracking) from administrators (full CRUD for articles).',
          'Integrated a virtual chatbot using the Gemini API from Google AI Studio with health-domain-specific prompt techniques for automated information consultation.'
        ],
        aiFlow: 'PHP \u2192 Gemini API \u2192 AI response \u2192 Chatbot UI',
        technologies: ['PHP', 'MySQL', 'XAMPP', 'Google AI Studio (Gemini API)', 'Bootstrap/CSS'],
        tags: ['Web System', 'Database', 'RBAC', 'PHP', 'MySQL', 'AI Chatbot'],
        links: { demo: 'https://healthylife-hub.infinityfree.io/' },
        page: 'project-healthylife.html'
      },
      {
        id: 'kompas',
        name: 'KOMPAS',
        subtitle: 'Project Management Information System',
        category: 'Systems Requirements & Workflow Design',
        context: 'Systems Requirements & Workflow Design',
        date: 'March 2026',
        type: 'Academic Group Project',
        role: 'Business Analyst / Secretary',
        summary: 'A project management information system for tracking student academic projects, defined through functional requirements and user workflow mapping, with collaborative task boards and milestone tracking in Trello.',
        overview: 'A project management information system for tracking student academic projects. The work focused on defining functional requirements and mapping user workflows, and on organising collaborative task boards and milestone-tracking workflows in Trello.',
        summaryPoints: [
          'Prepared functional requirements and user workflow mapping for a student academic project tracking system.',
          'Organised collaborative task boards and milestone-tracking workflows in Trello to distribute team roles in a structured way.'
        ],
        technologies: ['Trello', 'Agile Concepts', 'Workflow Mapping'],
        tags: ['Systems Requirements', 'Workflow Design', 'Agile', 'Business Analysis'],
        links: { trello: 'https://trello.com/b/8cxGP8X5' },
        page: 'project-kompas.html'
      },
      {
        id: 'carenest',
        name: 'CareNest Business Proposal',
        category: 'Business Analysis & Product Concept',
        context: 'Business Analysis & Product Concept',
        date: 'April 2026',
        type: 'Academic Project',
        summary: 'A business analysis and product concept for an on-demand concierge and apartment care platform, mapping user personas and a value proposition canvas from market research.',
        overview: 'A business analysis and product concept for an on-demand concierge and apartment care platform. The work defined the business needs analysis and service specification, and mapped user personas and a value proposition canvas from market research.',
        summaryPoints: [
          'Formulated the business needs analysis and service specification for an on-demand concierge and apartment care platform.',
          'Mapped user personas and a Value Proposition Canvas from market research to identify apartment residents\u2019 pain points.'
        ],
        technologies: ['Market Research', 'Value Proposition Canvas', 'User Persona'],
        tags: ['Business Analysis', 'Product Concept', 'User Persona', 'Value Proposition'],
        page: 'project-carenest.html'
      }
    ],

    /* -------------------- EXPERIENCE -------------------- */
    experience: [
      {
        role: 'Multimedia Team Volunteer',
        organization: 'GBI Pondok Gede Plaza',
        period: '2023 - Present',
        points: [
          'Support multimedia operations during worship services and various church events.',
          'Coordinate with team members to ensure smooth execution of events.',
          'Work in time-sensitive situations while maintaining focus, accuracy, and responsibility.'
        ]
      }
    ],

    /* -------------------- RESEARCH -------------------- */
    research: [
      {
        title: 'AI Literacy, Academic Integrity & Digital Trust',
        kind: 'Academic Exploration',
        summary: 'Exploring the relationship between AI literacy, academic integrity, and digital trust among students in the context of the AI era, focused on students in Bekasi City.',
        tags: ['Research Method', 'AI Literacy', 'Information Systems']
      }
    ],

    /* -------------------- ACHIEVEMENTS -------------------- */
    achievements: [
      {
        title: '1st Rank across Cohort',
        project: 'Smart Sawit (IoT Smart Palm Oil Plantation)',
        context: 'Exhibited at SPARK EXPO 2026'
      }
    ],

    /* -------------------- CAREER INTERESTS -------------------- */
    interests: {
      statement: 'Open to internship opportunities and collaborations in systems analysis, business intelligence, data, and information systems.',
      fields: ['Systems Analysis', 'Business Intelligence', 'Data & Databases', 'Information Systems', 'Business Analysis']
    },

    /* -------------------- CONTACT -------------------- */
    contact: {
      email: 'naelnathel@gmail.com',
      linkedin: 'https://www.linkedin.com/in/rogernathanael',
      linkedinLabel: 'linkedin.com/in/rogernathanael',
      portfolio: 'https://rogernath-portfolio.vercel.app',
      location: 'Bekasi, Indonesia',
      cv: 'assets/CV Roger Nathanael.pdf'
    },

    /* -------------------- SITE MAP (for navigation) -------------------- */
    /* Maps friendly section names to the files the existing navigation
       system (navTo/goToPage/PAGES) already understands. */
    sections: {
      home:       { file: 'index.html',      label: 'Home' },
      about:      { file: 'about.html',       label: 'About' },
      skills:     { file: 'skills.html',      label: 'Skills' },
      projects:   { file: 'projects.html',    label: 'Projects' },
      experience: { file: 'experience.html',  label: 'Experience' },
      education:  { file: 'education.html',    label: 'Education' },
      research:   { file: 'research.html',     label: 'Research' },
      contact:    { file: 'contact.html',      label: 'Contact' }
    },

    /* -------------------- KNOWN GAPS --------------------
       Information NOT currently on the site. The assistant must treat
       these as unavailable and never invent them. */
    unavailable: [
      'Certifications (none listed on the site yet)',
      'Professional/internship work experience (only volunteer experience is listed)',
      'A general GitHub profile (only the HealthyLife Hub project repository is confirmed)',
      'Phone number (not shown on the current Contact page)'
    ]
  };

  // Browser: expose on window for the frontend (existing behavior).
  if (global) global.PORTFOLIO = PORTFOLIO;

  // Node / Vercel Serverless: expose via CommonJS so the backend can reuse
  // the SAME single source of truth (api/chat.js require()s this file).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PORTFOLIO;
  }
})(typeof window !== 'undefined' ? window : undefined);
