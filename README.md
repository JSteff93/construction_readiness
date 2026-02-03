# Construction Readiness Tracker

A modern web application for tracking construction readiness tasks. Create templates with categorized tasks, then generate packages with countdown timers to track progress before construction commences.

## Features

- **Template Management**: Create reusable templates with tasks organized by categories
- **Package Tracking**: Generate packages from templates with expected start dates
- **Countdown Timer**: Visual countdown showing days remaining until expected start date
- **Task Categories**: Organize tasks into color-coded categories
- **Progress Tracking**: Track completion percentage and individual task status
- **Data Persistence**: Data stored in Supabase (with localStorage fallback)
- **Excel Import/Export**: Download templates as Excel files and upload them back

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Optional: Set Up Supabase for Persistent Storage

By default, the app uses localStorage (browser storage). To enable persistent cloud storage across devices:

1. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions
2. Create a Supabase project
3. Run the database migration
4. Add your credentials to `.env` file

The app will automatically use Supabase if configured, otherwise it falls back to localStorage.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Creating Templates

1. Navigate to the "Templates" page
2. Click "Create Template"
3. Enter a template name and optional description
4. Add categories (e.g., "Permits", "Materials", "Site Preparation")
5. Add tasks to each category
6. Save the template

### Creating Packages

1. Navigate to the "Packages" page
2. Click "Create Package"
3. Enter package details:
   - Package name
   - Select a template
   - Set expected start date
   - Optional description
4. The package will be created with all tasks from the template

### Tracking Progress

- View packages on the main page with countdown timers
- Click on a package to see detailed task list
- Check off tasks as they are completed
- Monitor progress percentage and days remaining

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Vite** - Build tool
- **date-fns** - Date utilities
- **Supabase** - Database and data persistence
- **xlsx** - Excel file import/export

## Project Structure

```
src/
  ├── pages/          # Page components
  ├── types/          # TypeScript type definitions
  ├── utils/          # Utility functions (storage, dates, etc.)
  ├── App.tsx         # Main app component with routing
  └── main.tsx        # Entry point
```

## License

MIT





