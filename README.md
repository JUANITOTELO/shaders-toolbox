# Graphics & Shader Math Toolbox

An interactive, web-based Shader IDE and academic learning platform designed to take you from graphics mathematics fundamentals to advanced 3D raymarching.

---

## 🌟 Overview

**Graphics & Shader Math Toolbox** is a modern visual programming and educational environment built with React 19, Vite, Tailwind CSS, and WebGL. It pairs real-time GLSL fragment shader rendering with formal mathematical theory (rendered via KaTeX), step-by-step challenges, and preset organization.

Whether you are learning coordinate normalization, procedural noise, signed distance functions (SDFs), or raymarching 3D scenes with lighting, this toolbox provides an intuitive sandbox to experiment and build intuition.

---

## ✨ Features

- **Live GLSL Shader Editor**: Built-in CodeMirror IDE with GLSL/C++ syntax highlighting, live compilation, and precise error indicators.
- **Interactive WebGL Viewport**: Real-time rendering with continuous time progression (`u_time`), mouse coordinate tracking (`u_mouse`), and resolution scaling (`u_resolution`).
- **Structured Curriculum ("From Zero to Hero")**:
  - `00-fundamentals`: Basic color synthesis, `step()`, `smoothstep()`, and fractional arithmetic.
  - `01-coordinates`: Coordinate spaces, UV normalization, centering, and aspect ratio correction.
  - `02-transformations`: 2D matrices, affine transformations, rotation, and scaling.
  - `03-shaping`: Shaping functions, easing curves, and pulse modulations.
  - `04-noise`: Value noise, gradient noise, Perlin noise, and Fractal Brownian Motion (fBm).
  - `05-warping`: Domain warping and fluid-like visual distortion.
  - `06-sdf`: Signed Distance Functions for 2D primitives, boolean operations, and smooth blending.
  - `07-tiling`: Modulo repetition, polar coordinates, and infinite grids.
  - `08-color`: Inigo Quilez cosine palettes, HSV-to-RGB color space conversions, and tonemapping.
  - `09-lighting`: Normal calculation, diffuse lambertian, and Blinn-Phong specular models.
  - `10-raymarching`: 3D ray setup, sphere tracing, surface normals, and ambient occlusion.
- **Academic Math Documentation**: In-depth explanations of the underlying mathematical principles, equations rendered with KaTeX, and algorithmic intuition.
- **Interactive Challenges**: Embedded exercises with hints and expandable solutions to test shader intuition.
- **Preset & Folder Management**: Organize shaders into custom categories and persistent presets backed by an SQLite/MySQL REST API.
- **Responsive Split-Pane Workspace**: Resizable panes for code editing, real-time preview, and documentation with multiple layout presets (`Code`, `Docs`, `Split`).
- **Progress Tracking**: Tracks completed lessons and learning milestones locally.

---

## 🛠️ Tech Stack

- **Frontend**:
  - [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
  - [Vite 6](https://vitejs.dev/) with [@tailwindcss/vite](https://tailwindcss.com/)
  - [@uiw/react-codemirror](https://uiwjs.github.io/react-codemirror/) (VS Code theme)
  - [KaTeX](https://katex.org/) & [react-markdown](https://github.com/remarkjs/react-markdown) for academic TeX rendering
  - [Lucide React](https://lucide.dev/) icons
- **Backend**:
  - PHP 8+ with PDO (supports SQLite out-of-the-box and MySQL)
  - Lightweight RESTful API for category and preset CRUD operations
- **Testing**:
  - [Playwright](https://playwright.dev/) for end-to-end testing

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **pnpm**
- **PHP**: v8.0 or later with `pdo_sqlite` or `pdo_mysql` extension enabled

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd shaders-toolbox
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

---

## 💻 Running the Application

### Option 1: Unified Development Script (Recommended)

Run the included `./dev.sh` script to launch both the PHP backend and the Vite frontend dev server:

```bash
chmod +x dev.sh
./dev.sh
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

*(Press `Ctrl+C` to terminate both servers simultaneously).*

### Option 2: Running Servers Separately

If you prefer to run services in separate terminal windows:

1. **Start the PHP Backend Server:**
   ```bash
   php -S localhost:8000 -t backend/
   ```

2. **Start the Vite Frontend Server:**
   ```bash
   npm run dev
   ```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite development server at `http://localhost:5173` |
| `npm run build` | Type-checks with TypeScript (`tsc`) and builds production assets into `dist/` |
| `npm run preview` | Locally preview the production build |
| `npm run test:e2e` | Runs Playwright end-to-end test suite |

---

## 📂 Project Structure

```text
shaders-toolbox/
├── backend/                  # PHP backend
│   ├── api/                  # REST endpoints (categories.php, presets.php)
│   ├── config/               # Database connection and table migration/seeding
│   └── database.sqlite       # Local SQLite database (gitignored)
├── e2e/                      # Playwright end-to-end test specs
├── src/
│   ├── components/           # UI components structured by Atomic Design
│   │   ├── atoms/            # Basic buttons, badges, splitters
│   │   ├── molecules/        # Form inputs, stat widgets, search bars
│   │   └── organisms/        # Viewport, editor, doc viewer, modals, navigation
│   ├── core/                 # WebGL renderer & GLSL standard library helpers
│   ├── pages/                # Main application page (ToolboxPage.tsx)
│   ├── services/             # API client services
│   ├── tools/                # Shader tool modules and curriculum registry (00 - 10)
│   ├── types.ts              # TypeScript interfaces and data models
│   ├── index.css             # Tailwind CSS entrypoint
│   └── main.tsx              # React application entrypoint
├── dev.sh                    # All-in-one local dev environment runner
├── index.html                # HTML entry point
├── package.json              # Project scripts & dependencies
├── playwright.config.ts      # Playwright test configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite build configuration and API reverse proxy
```

---

## 🧪 Testing

Run the full end-to-end test suite using Playwright:

```bash
npm run test:e2e
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
