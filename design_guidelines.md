# Healthcare Medicine Reminder System - Design Guidelines

## Design Approach: Reference-Based (Healthcare/Medical)
Drawing inspiration from modern healthcare platforms like Practo, Apollo Health, and Telemedicine apps, with emphasis on trust, clarity, and accessibility.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Light Mode: 210 85% 45% (Medical blue - trustworthy, professional)
- Dark Mode: 210 70% 35% (Darker medical blue)

**Secondary Colors:**
- Success/Compliance: 142 76% 36% (Medical green)
- Warning/Overdue: 38 92% 50% (Alert orange)
- Critical/Emergency: 0 84% 60% (Medical red)

**Neutral Colors:**
- Light backgrounds: 210 20% 98%
- Dark backgrounds: 210 15% 8%
- Text primary: 210 15% 20% / 210 10% 90%

### Typography
- **Primary Font:** Inter (Google Fonts) - excellent readability for medical data
- **Headings:** 600-700 weight for clear hierarchy
- **Body:** 400-500 weight for comfortable reading
- **Medical Data:** 500 weight with slightly increased letter-spacing

### Layout System
Using Tailwind spacing units: **2, 4, 6, 8, 12, 16**
- Cards: p-6, gap-4
- Sections: py-8, px-4
- Component spacing: mb-4, mt-6
- Grid gaps: gap-6

### Component Library

**Navigation:**
- Role-based sidebar with medical iconography
- Clean top bar with user profile and hospital context
- Breadcrumb navigation for deep sections

**Cards & Data Display:**
- Medicine cards with dosage, timing, and status indicators
- Patient compliance cards with progress bars
- Prescription cards with clear medication hierarchy
- Dashboard widgets with health metrics

**Forms:**
- Clean, spacious prescription entry forms
- Multi-step patient registration
- Accessible time/date pickers for dosage schedules
- Toggle switches for reminder preferences

**Status Indicators:**
- Color-coded pill icons for medication status
- Progress rings for compliance tracking
- Badge system for urgency levels
- Timeline components for medication history

**Overlays:**
- Modal dialogs for prescription details
- Slide-over panels for patient quick actions
- Toast notifications for reminders and alerts

### Specialized Healthcare Elements

**Medication Visual System:**
- Pill-shaped status indicators
- Color-coded dosage timing (morning/afternoon/evening)
- Visual medication schedules with time blocks
- Compliance percentage circles

**Dashboard Layouts:**
- Doctor: Patient grid with compliance overview
- Patient: Today's medications prominently displayed
- Admin: Hospital-wide statistics and alerts
- Clean data tables with sorting and filtering

**Mobile-First Considerations:**
- Large touch targets for elderly patients
- High contrast mode toggle
- Simple navigation patterns
- Emergency contact buttons prominently placed

### Accessibility Features
- WCAG AA compliance with 4.5:1 contrast ratios
- Clear focus indicators for keyboard navigation
- Screen reader optimized medical terminology
- Multi-language support indicators (for future AI integration)

### Visual Hierarchy
- Critical medications: Bold borders, prominent placement
- Overdue items: Warm color treatment without being alarming
- Completed items: Subtle green checkmarks, reduced opacity
- Upcoming: Clear time indicators with countdown elements

This design framework prioritizes medical safety, user trust, and clear information hierarchy while maintaining modern web aesthetics appropriate for a healthcare environment.