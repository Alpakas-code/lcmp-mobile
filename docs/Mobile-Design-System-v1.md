# LCMP Mobile Design System v1

## Objective

Create the official reusable mobile design system for the LCMP Expo application so future Student and Teacher screens can follow one premium, education-focused visual language without redefining UI direction.

## Design Philosophy

LCMP Mobile uses a calm commercial SaaS style for education: generous whitespace, rounded floating cards, readable hierarchy, compact premium headers, and minimal interactions. The visual direction is inspired by the attached learning dashboard, adapted for a professional language center platform rather than copied literally.

The design should feel native on both Android and iPhone while leaning on Apple-style clarity, spacing, typography, and restraint.

## Visual Reference

The attached reference drives the dashboard hierarchy, rounded card language, horizontal KPI cards, course rails, clean spacing, and bottom navigation treatment.

The implementation intentionally excludes cartoon illustrations, heatmaps, streak widgets, watch-now CTAs, and bright orange-heavy styling.

## Color Palette

- Primary: modern blue `#5b6ff6`
- Secondary: soft purple `#9b5cf6`
- Success: green `#12805c`
- Warning: amber `#b7791f`
- Danger: red `#c2413a`
- Neutral: gray `#667085`
- Background: soft light gray `#f5f7fb`
- Cards: white `#ffffff`

Future dark-mode tokens are prepared in `src/theme/colors.ts`.

## Typography

Typography tokens are defined in `src/theme/typography.ts`:

- Greeting
- Page Title
- Section Title
- Card Title
- Body
- Body Strong
- Caption
- Small Label
- Overline

Weights favor clear mobile hierarchy without oversized marketing-style text.

## Spacing

The official spacing scale is:

- 4
- 8
- 12
- 16
- 20
- 24
- 32
- 40
- 48

All new MDS components use these values from `src/theme/spacing.ts`.

## Radius

Radius tokens are defined in `src/theme/radius.ts`:

- Small
- Medium
- Large
- XL
- XXL
- Full

Cards use soft rounded corners to preserve the floating mobile-card feel.

## Shadows

Shadows are intentionally subtle and Apple-inspired. The system provides soft, card, and floating shadow presets in `src/theme/shadows.ts` while avoiding heavy Material-style elevation.

## Components

Reusable components now include:

- `AppScreen` through `Screen`
- `SafeAreaScreen`
- `KeyboardAwareScreen`
- `FormScreen`
- `AppHeader`
- `GreetingHeader`
- `SectionHeader`
- `PrimaryButton`
- `SecondaryButton`
- `TextButton`
- `AppInput`
- `SearchBar`
- `Avatar`
- `AppBadge`
- `Chip`
- `StatCard`
- `CourseCard`
- `ScheduleCard`
- `NotificationCard`
- `MessageCard`
- `DocumentCard`
- `CertificateCard`
- `QuickActionCard`
- `ListItem`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `SkeletonLoader`
- `BottomSheet`
- `ConfirmationDialog`

Existing names such as `Button`, `Card`, and `TextInput` remain compatible.

## Dashboard Template

The official dashboard template is:

- Greeting header with avatar and action button
- Horizontal KPI cards
- Today's class or teaching block
- Horizontal course/group cards
- Recent notifications or key updates
- Quick actions
- Bottom navigation

Student and Teacher dashboards now use the same visual language. Student data comes from existing M2 API-backed dashboard data. Teacher data remains placeholder-only as requested.

## Navigation Rules

- Maximum five bottom tabs.
- Use short labels.
- Use safe-area-aware tab height.
- Use one consistent internal LCMP icon set.
- Keep secondary destinations behind More or dashboard quick actions.

Current Student tabs remain Home, Courses, Schedule, Exams, and More to preserve existing M2 navigation.

## Accessibility

- Buttons and touch targets use comfortable mobile sizes.
- Inputs use large tap areas and clear labels.
- Contrast is maintained against light backgrounds.
- Icon-only controls include accessibility labels.
- Dynamic font support is respected by avoiding fixed-height text containers where content can grow.

## Keyboard Handling

Forms use `KeyboardAwareScreen` or `FormScreen`, which provide:

- Safe area support
- `KeyboardAvoidingView`
- Scrollable content
- Tap-outside keyboard dismissal
- Android and iOS behavior handling
- Accessible submit buttons on small screens

The login screen and Student messages form use this pattern.

## Future Expansion

Future prompts can say: "Follow LCMP Mobile Design System v1.0".

New screens should compose the exported tokens and components from:

- `src/theme/`
- `src/components/ui/`

Avoid one-off colors, spacing, card styles, desktop tables, or page-specific form wrappers.

## Validation Results

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed.
