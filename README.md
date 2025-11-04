# Manager Data Entry

A Next.js application for address validation and mapping with a wizard-based workflow, built with Tailwind CSS.

## Features

- **Address Management**: List, search, and manage multiple addresses
- **Progress Tracking**: Visual progress bars for overall completion and category progress
- **Wizard Workflow**: Step-by-step process with 4 categories:
  - **Validation**: Select validated address from search results
  - **Place Door**: Interactive door placement on maps with confirmation UI
  - **Scenarios**: Select scenario types (taxi, car/truck, bicycle, ambulance)
  - **Parking Spot**: Set parking spot location
- **Multi-Map View**: Three simultaneous map views (outline, satellite, street)
- **Interactive Maps**: Click-to-place functionality with confirmation dialogs
- **Door Placement Confirmation**: Check/Close icons for confirming door placement

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Mapbox access token (optional but recommended for outline map):
   - Get your access token from [Mapbox](https://account.mapbox.com/access-tokens/)
   - Create a `.env.local` file in the root directory
   - Add your token:
   ```
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```
   - Note: If no token is provided, the outline map will fall back to OpenStreetMap tiles
   - Note: The satellite map uses Google Maps satellite imagery (no API key required)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles with Tailwind
├── components/
│   ├── LeftSection.tsx     # Left panel container
│   ├── AddressListView.tsx # Address list view
│   ├── WizardView.tsx      # Wizard steps view
│   ├── ProgressBar.tsx     # Progress bar component
│   ├── RightSection.tsx    # Right panel with maps
│   ├── MapContainer.tsx    # Individual map component
│   └── DoorConfirmation.tsx # Door placement confirmation UI
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   └── addressUtils.ts     # Utility functions
└── tailwind.config.js      # Tailwind CSS configuration
```

## Usage

1. **View Addresses**: The left panel shows a list of all addresses with their status
2. **Search**: Use the search bar to filter addresses
3. **Select Address**: Click on an address to start/continue the wizard
4. **Complete Steps**:
   - Select a validated address from the dropdown
   - Click on any map to place the door (door icon follows cursor)
   - Confirm or cancel door placement using the check/close icons
   - Select scenario types (multiple selection allowed)
   - Click on map to set parking spot
5. **Navigate**: Use Previous/Next buttons to move between addresses

## Door Placement Flow

1. User clicks on map after selecting an address
2. Orange door icon appears at clicked location
3. Check (✓) and Close (✗) icons appear near the door icon
4. User confirms by clicking check icon, or cancels by clicking close icon
5. On confirmation, door is set and scenarios step becomes enabled

## Technology Stack

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Leaflet**: Interactive maps
- **React Leaflet**: React bindings for Leaflet
- **Mapbox**: Map tiles for outline view (optional - falls back to OpenStreetMap)
- **Google Maps**: Satellite imagery for satellite view

## Styling

All components use Tailwind CSS utility classes for efficient and maintainable styling. The design follows a clean, modern interface with:
- Consistent spacing and colors
- Responsive hover states
- Smooth transitions
- Clear visual hierarchy

## Notes

- The door icon cursor appears when the "Place Door" step is active (only when mouse is over map areas)
- Maps are enabled/disabled based on wizard step completion
- The outline map uses Mapbox Light style (requires access token) or falls back to OpenStreetMap
- The satellite map uses Google Maps satellite imagery for high-quality aerial views
- Sample addresses are provided for demonstration - replace with real data source in production

