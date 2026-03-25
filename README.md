# Tomato Plan

A Pomodoro-style daily task planner built with Lit and TypeScript. Plan your day by assigning "tomatoes" (pomodoro sessions) to tasks and tracking your progress.

## Features

- **Daily Planning**: Configure how many pomodoro sessions (tomatoes) you have for the day
- **Task Management**: Create, edit, and delete tasks with titles and descriptions
- **Tomato Assignment**: Allocate tomatoes to tasks and track completion
- **Progress Tracking**: Mark tomatoes as finished and visualize your daily progress
- **Persistent Storage**: State automatically saves to localStorage and persists across sessions
- **Day Reset**: Start fresh each day with automatic stale data detection

## Tech Stack

- **[Lit 3](https://lit.dev/)** - Fast, lightweight web components
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest** - Vite-native testing framework

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

### Build

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Testing

Run tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Type checking:

```bash
npm run typecheck
```

## Available Scripts

| Script               | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start Vite development server       |
| `npm run build`      | Type-check and build for production |
| `npm run preview`    | Preview production build locally    |
| `npm run typecheck`  | Run TypeScript type checking        |
| `npm run lint`       | Run linter (currently skipped)      |
| `npm test`           | Run tests with Vitest               |
| `npm run test:watch` | Run tests in watch mode             |

## Project Structure

```
tomatoplan/
├── src/
│   ├── components/      # UI components (Lit elements)
│   │   ├── app/         # Root application component
│   │   ├── layout/      # Shell and header
│   │   ├── pool/        # Tomato pool panel
│   │   ├── shared/      # Reusable UI elements
│   │   ├── task/        # Task list, form, and items
│   │   └── tomato/      # Tomato visualization and controls
│   ├── models/          # Data models and types
│   ├── state/           # State management and persistence
│   ├── utils/           # Utility functions
│   ├── constants/       # Configuration defaults
│   └── styles/          # Global styles (Tailwind)
├── tests/               # Test files
├── index.html           # Entry HTML
├── vite.config.ts       # Vite configuration
├── vitest.config.ts     # Test configuration
└── tailwind.config.ts   # Tailwind configuration
```

## License

MIT License - see [LICENSE](LICENSE) for details.
