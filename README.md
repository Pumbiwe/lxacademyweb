<h1 align="center">LXAcademy</h1>

<p align="center">
  <img src="./public/next.svg" width="120" alt="LXAcademy Logo" />
</p>

<p align="center"> 
  Full-stack educational platform built with Next.js (App UI + API routes + Auth + DB)
</p>

<!-- Badges -->
<p align="center">
  <a href="https://vercel.com">
    <img alt="Vercel Deployment" src="https://img.shields.io/github/deployments/Pumbiwe/lxacademyweb/Production?label=vercel&logo=vercel" />
  </a>
  <a href="https://github.com/Pumbiwe/lxacademyweb/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/Pumbiwe/lxacademyweb" />
  </a>
  <img alt="Last commit" src="https://img.shields.io/github/last-commit/Pumbiwe/lxacademyweb" />
  <img alt="Repo size" src="https://img.shields.io/github/repo-size/Pumbiwe/lxacademyweb" />
  <img alt="Status" src="https://img.shields.io/badge/status-active-success" />
</p>

<!-- Quick links -->
<p align="center">
  <a href="#demo">Demo</a>
  &nbsp;•&nbsp;
  <a href="#features">Features</a>
  &nbsp;•&nbsp;
  <a href="#architecture">Architecture</a>
  &nbsp;•&nbsp;
  <a href="#tech-stack">Tech Stack</a>
  &nbsp;•&nbsp;
  <a href="#getting-started">Getting Started</a>
  &nbsp;•&nbsp;
  <a href="#environment">Environment</a>
</p>

<hr/>

<h2 id="overview">Overview</h2>

<p>
  <b>LXAcademy</b> is a full-stack web application built with <b>Next.js</b>.
  The repository contains the complete system: UI, backend logic (API routes), authentication,
  and database integration. The project is structured with production-oriented conventions and is suitable for portfolio showcase.
</p>

<h2 id="demo">Demo</h2>

<ul>
  <li><b>Local:</b> <code>http://localhost:3000</code></li>
  <li><b>Live:</b> <code>https://lxacademyweb.vercel.app/</code></li>
</ul>

<h2 id="features">Features</h2>

<h3>Authentication & Authorization</h3>
<ul>
  <li>User registration and login</li>
  <li>Session/JWT-based authentication (depending on implementation)</li>
  <li>Role-based access control (RBAC)</li>
  <li>Protected routes and server-side guards</li>
</ul>

<h3>User Roles</h3>
<ul>
  <li>Student</li>
  <li>Administrator</li>
</ul>

<h3>Core Functionality</h3>
<ul>
  <li>Course management</li>
  <li>User management</li>
  <li>Database-driven content</li>
  <li>API-based data communication</li>
</ul>

<h2 id="architecture">Architecture</h2>

<pre>
Client (Next.js / React)
        ↓
API Routes (Next.js / Node.js)
        ↓
Database (Relational)
</pre>

<ul>
  <li>Separation of UI and server logic via API routes / service modules</li>
  <li>Modular code organization</li>
  <li>Secure auth flow and protected endpoints</li>
  <li>Database-backed persistence layer</li>
</ul>

<h2 id="tech-stack">Tech Stack</h2>

<ul>
  <li><b>Frontend:</b> Next.js, React</li>
  <li><b>Backend:</b> Next.js API Routes (Node.js runtime)</li>
  <li><b>Database:</b> Relational DB (MySQL / PostgreSQL)</li>
  <li><b>Auth:</b> Session/JWT-based auth + password hashing</li>
</ul>

<h2 id="project-structure">Project Structure</h2>

<pre>
lxacademyweb/
├── pages/               # Next.js pages
├── pages/api/           # API routes (backend)
├── components/          # UI components
├── lib/                 # DB + utilities
├── public/              # Static assets
├── styles/              # Styles
├── middleware/          # Route protection (if used)
├── package.json
└── README.md
</pre>

<h2 id="getting-started">Getting Started</h2>

<h3>1) Install</h3>

<pre><code>git clone https://github.com/Pumbiwe/lxacademyweb.git
cd lxacademyweb
npm install
</code></pre>

<h3>2) Run (development)</h3>

<pre><code>npm run dev
</code></pre>

<p>Open: <code>http://localhost:3000</code></p>

<h3>3) Build (production)</h3>

<pre><code>npm run build && npm start
</code></pre>

<h2 id="environment">Environment</h2>

<p>Create <code>.env.local</code> in the repository root.</p>

<pre><code>DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
</code></pre>

<p>
  Note: adjust env vars according to your auth/database implementation (Prisma/Sequelize/custom driver).
</p>

<h2 id="screenshots">Screenshots</h2>

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/3fea7f48-0e91-41f7-a839-40c91fbf4d4a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c5b6663f-f9ac-464b-84e7-795570c098b6" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7c06daab-b98c-47c7-960c-a782b9a286b4" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a550fad1-0421-4576-bc4b-3c0afd8c0e8e" />



<hr/>

<h2 id="license">License</h2>

<p>MIT</p>
