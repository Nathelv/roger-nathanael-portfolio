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
      title: 'Business Information Technology Student',
      tagline: 'I explore the intersection of technology, business, and user-centered solutions through projects in information systems, UI/UX, data, machine learning, and IoT.',
      positioning: 'Bridging business, technology & people',
      location: 'Bekasi, West Java',
      status: 'Open to internship opportunities',
      highlights: ['BIT Student', 'GPA 3.81', 'IoT Project — 1st Place']
    },

    /* -------------------- ABOUT -------------------- */
    about: {
      summary: [
        'I am a Business Information Technology student at BINUS University Bekasi with an interest in how technology can be applied to solve real-world problems.',
        'My academic journey has let me explore information systems, UI/UX design, programming, data modelling, machine learning, and IoT.',
        "I enjoy working on projects that combine technical thinking with business and user perspectives. Through team-based projects I've also developed my communication, collaboration, problem-solving, and adaptability skills."
      ],
      journey: ['Curiosity', 'Design', 'Programming', 'Data', 'IoT', 'Business & Technology']
    },

    /* -------------------- EDUCATION -------------------- */
    education: [
      {
        institution: 'BINUS University',
        degree: 'Bachelor of Business Information Technology',
        period: '2024 - Present',
        gpa: '3.81',
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
        { icon: '💻', title: 'Technology',        items: ['Basic Programming', 'Database', 'Data Modelling', 'Machine Learning Fundamentals', 'IoT'] },
        { icon: '🎨', title: 'Design & Product',   items: ['UI/UX Design', 'User Research', 'User Journey', 'Wireframing', 'Product Development'] },
        { icon: '📊', title: 'Business & Systems', items: ['Information Systems Analysis', 'Project Management', 'Problem-Solving', 'Analytical Thinking'] },
        { icon: '🤝', title: 'Professional',       items: ['Teamwork & Collaboration', 'Communication', 'Adaptability', 'Fast Learning'] }
      ],
      tools: ['Figma', 'PHP', 'MySQL', 'XAMPP', 'Python']
    },

    /* -------------------- PROJECTS -------------------- */
    /* `page` is the detail file used by the existing navigation system.
       Fields are populated only with confirmed information; unconfirmed
       fields are omitted rather than guessed. */
    projects: [
      {
        id: 'iot-sawit',
        name: 'IoT Smart Sawit Plantation',
        context: 'Smart Application',
        semester: 4,
        period: 'Even Semester 2025/2026',
        course: 'Smart Apps',
        type: 'Academic Group Project',
        teamSize: 6,
        role: 'Project Initiator / AI Integration Contributor',
        summary: 'An IoT and AI plant-monitoring system that tracks soil moisture and air humidity, supports automated watering, and uses generative AI to summarise sensor data and suggest care actions — demonstrated on palm oil plantations.',
        overview: 'A plant monitoring and maintenance system that reads environmental sensor data, supports automated watering, and uses generative AI to turn that data into natural-language summaries and recommendations. Palm oil plantations were used as the example use case.',
        objective: 'Monitor and maintain plants by tracking soil moisture and air humidity, automate watering, and help users understand plant conditions through AI-generated summaries and recommendations.',
        contribution: 'Initiated the plant monitoring system concept and proposed introducing AI into the project. Contributed to AI integration, reviewed teammates\' code and results, and took part in testing and integration.',
        process: 'Reviewed teammates\' code and results, then participated in collaborative testing and integration of the hardware and software.',
        features: [
          'Soil moisture detection at intervals',
          'Air humidity detection',
          'Automated watering system',
          'Generative AI summary and recommendation based on sensor data'
        ],
        technologies: ['ESP32', 'DHT11', 'Soil Hygrometer', '5V 2-Channel Relay', 'LCD1602', 'I2C Module', 'Blynk API', 'Gemini API'],
        tags: ['IoT', 'Sensors', 'Smart Agriculture', 'Generative AI', 'Team Project'],
        challenge: 'Integrating the hardware and software required extensive trial and error.',
        solutionToChallenge: 'Collaborative testing and code review with the team.',
        outcome: 'A working prototype was successfully operated and produced the expected data.',
        achievement: '1st Place',
        page: 'project-iot-sawit.html'
      },
      {
        id: 'healthylife',
        name: 'HealthyLife Hub',
        context: 'Programming for Business',
        semester: 3,
        period: 'Odd Semester 2025/2026',
        course: 'Programming for Business',
        type: 'Academic Group Project',
        teamSize: 6,
        role: 'Team Member',
        summary: 'A web-based digital health education and monitoring platform with articles, a login-gated health quiz, and an AI chatbot that answers health-related questions within defined constraints.',
        overview: 'A digital health education and monitoring website offering articles, a health quiz for logged-in users, and an AI chatbot for health-related questions, along with admin tools for managing article content.',
        objective: 'Provide digital health education and monitoring through accessible articles, an interactive quiz, and an AI assistant.',
        contribution: 'Implemented the AI chatbot and the login functionality, and worked on several pages of the website.',
        process: 'Concept development, layout and design, coding, and trial-and-error testing.',
        features: [
          'User Login',
          'Admin Login',
          'Articles',
          'Health Quiz (restricted to logged-in users)',
          'Health Quiz Result',
          'AI Chatbot',
          'Admin Article Management'
        ],
        aiFlow: 'PHP \u2192 Gemini API \u2192 AI response \u2192 Chatbot UI',
        technologies: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'XAMPP', 'Gemini API', 'Visual Studio Code'],
        tags: ['Web Development', 'Database', 'PHP', 'MySQL', 'AI Chatbot'],
        challenge: 'CSS styling and layout.',
        solutionToChallenge: 'Iterative trial and error and adjustment.',
        outcome: 'Core functionality was successfully implemented, though article content was still incomplete.',
        learning: ['API integration', 'AI integration', 'Teamwork'],
        links: { github: 'https://github.com/Nathelv/HealthyLife-Hub' },
        page: 'project-healthylife.html'
      },
      {
        id: 'aqquas',
        name: 'Aqquas',
        context: 'User Research & Design',
        semester: 1,
        period: 'Odd Semester 2024/2025',
        course: 'User Research & Design',
        type: 'Academic Group Project',
        teamSize: 2,
        role: 'Participated across the project and design process',
        summary: 'A digital product concept for freshwater and saltwater fish hobbyists, designed from a campus-provided case through concept development, wireframing, and prototyping.',
        overview: 'A digital product concept for freshwater and saltwater fish hobbyists. The case was provided by the campus and developed into a product concept and prototype.',
        contribution: 'Participated across the project and design process, from concept development to prototyping.',
        process: 'Understanding the provided case, developing the concept, creating layouts and wireframes, prototyping, and iteration.',
        features: ['Home', 'Video', 'Shop', 'Forum', 'Profile'],
        technologies: ['Figma', 'Canva'],
        tags: ['UI/UX', 'Wireframe', 'Prototyping', 'Product Design'],
        outcome: 'Successfully created the prototype.',
        learning: ['UX research concepts', 'User-centered design', 'UI design', 'Wireframing', 'Prototyping', 'Collaboration'],
        links: { figma: 'https://www.figma.com/design/zfz1muUuciCpyDbQZ02i2c/Kel-8-Aqquas?node-id=0-1&t=AKGGoeojSuLo9Tc1-1' },
        page: 'project-aqquas.html'
      },
      {
        id: 'churn',
        name: 'Customer Churn Prediction',
        context: 'Machine Learning',
        type: 'Academic Group Project',
        role: 'Machine Learning & Data Analysis Team Member',
        summary: 'A machine learning project predicting e-commerce customer churn, where Random Forest with SMOTE achieved the strongest results (about 90% test accuracy, 0.92 ROC-AUC).',
        overview: 'A machine learning project focused on predicting customer churn in e-commerce using the E-Commerce Customer Behavior Dataset from Kaggle (originally 50,000 customers and 25 features, with a 28.9% churn rate).',
        objective: 'Predict which e-commerce customers are likely to churn and identify the factors most associated with churn.',
        contribution: 'Contributed as a Machine Learning & Data Analysis team member across the modelling and analysis workflow.',
        process: 'Preprocessing (missing-value handling, outlier removal, duplicate removal, feature engineering, categorical encoding, standardization, feature selection); applying SMOTE only on the training data after the train-test split to avoid data leakage; then training and evaluating models.',
        models: ['Logistic Regression', 'Decision Tree', 'Random Forest'],
        evaluation: '80:20 hold-out split with stratified 5-fold cross-validation. Random Forest with SMOTE was the best overall approach — Testing Accuracy 90.34%, Precision 85.24%, Recall 80.52%, F1-Score 82.81%, ROC-AUC 92.27%.',
        keyFeatures: ['Customer Service Calls', 'Lifetime Value', 'Cart Abandonment Rate'],
        technologies: ['Python', 'Machine Learning', 'Data Analysis'],
        tags: ['Machine Learning', 'Python', 'Data Analysis'],
        challenge: 'Class imbalance and ensuring reliable model evaluation.',
        solutionToChallenge: 'Applied SMOTE only to the training set while keeping the test set in its original distribution.',
        outcome: 'Random Forest achieved the strongest overall result (about 90% test accuracy and 0.92 ROC-AUC).',
        limitation: 'High training accuracy for Random Forest and Decision Tree indicated possible overfitting.',
        futureWork: 'Model calibration and more advanced explainability such as SHAP.',
        page: 'project-churn.html'
      },
      {
        id: 'kompas',
        name: 'KOMPAS — Kolaborasi Mahasiswa Proyek Akademis',
        context: 'Information Systems Project Management',
        course: 'Information Systems Project Management (ISPM)',
        institution: 'BINUS University',
        period: 'January – June 2026',
        type: 'Academic Group Project',
        teamSize: 7,
        role: 'Business Analyst / Secretary',
        summary: 'A concept for a web-based academic project management platform for BINUS students, enabling real-time collaboration across tasks, group projects, and exam schedules using Kanban and Agile Scrum.',
        overview: 'A web-based academic project management platform concept for BINUS students, providing a unified dashboard to track daily tasks, group projects, and exam schedules, with Kanban boards and Agile Scrum methodology and improved lecturer visibility into individual contributions.',
        objective: 'Develop a web-based academic project management platform for BINUS students; enable real-time collaboration across individual tasks, group projects, and exam schedules; implement Kanban and Agile Scrum; improve lecturer visibility into individual contributions within group work; and provide a unified dashboard for task tracking across courses.',
        contribution: 'Served as Business Analyst / Secretary — focused on business analysis, project documentation, coordination, requirements and project-planning support, and secretary responsibilities.',
        methodology: 'Agile Scrum with 2-week sprints.',
        trackingCategories: ['Daily Tasks', 'Group Projects', 'Exam Schedules'],
        pmActivities: ['Project Charter', 'Work Breakdown Structure', 'Project Scheduling', 'Gantt Chart', 'Critical Path', 'Risk Management', 'Procurement Management', 'Quality Assurance', 'Documentation'],
        riskManagement: 'Identified 35 risks, including Scope Creep, Critical Defects at Late Stage, Real-Time Sync Failure, Sprint Schedule Delay, and Academic Data Security Breach.',
        businessCase: 'Project business-case projections (not realized performance): initial investment Rp 15,000,000, projected 5-year ROI approximately 451%, payback period 1.5 years.',
        technologies: ['WebSocket (planned real-time synchronization)'],
        tags: ['Project Management', 'Information Systems', 'Agile Scrum', 'Business Analysis'],
        page: 'project-kompas.html'
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
        title: '1st Place',
        project: 'IoT Smart Sawit Plantation',
        context: 'Smart Application Project'
      }
    ],

    /* -------------------- CAREER INTERESTS -------------------- */
    interests: {
      statement: 'Open to internship opportunities and collaborations in technology, information systems, data, and related fields.',
      fields: ['Technology', 'Information Systems', 'Data', 'UI/UX', 'Machine Learning', 'IoT']
    },

    /* -------------------- CONTACT -------------------- */
    contact: {
      email: 'naelnathel@gmail.com',
      linkedin: 'https://www.linkedin.com/in/roger-nathanael',
      linkedinLabel: 'linkedin.com/in/roger-nathanael',
      location: 'Bekasi, West Java',
      cv: 'assets/Roger-Nathanael-CV.pdf'
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
