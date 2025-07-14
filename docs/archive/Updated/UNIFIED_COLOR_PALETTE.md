# Unified Color Palette for Zappy Health

To address the inconsistency in colors across different pages, this document establishes a standardized color palette for the entire application. This unified approach will ensure visual coherence and brand consistency throughout the user experience.

## Primary Brand Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Zappy Blue | #2D7FF9 | Primary brand color, main CTA buttons, active states, links |
| Zappy Yellow | #FFD100 | Accent color, alerts, priority actions, highlights |

## Neutral Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Background Gray | #F9FAFB | Page backgrounds, section backgrounds |
| Card White | #FFFFFF | Card backgrounds, content areas |
| Border Gray | #E5E7EB | Dividers, borders, separators |
| Dark Gray | #111827 | Primary text |
| Medium Gray | #6B7280 | Secondary text, labels |
| Light Gray | #9CA3AF | Placeholder text, disabled states |

## Status Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Success Green | #10B981 | Success states, completed actions, positive indicators |
| Warning Amber | #F59E0B | Warning states, attention required |
| Error Red | #EF4444 | Error states, destructive actions |
| Info Blue | #2D7FF9 | Information, help (same as primary blue) |

## Category/Section Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Weight Blue | #DBEAFE | Weight management section backgrounds, indicators |
| Hair Purple | #EDE9FE | Hair treatment section backgrounds, indicators |
| Wellness Green | #D1FAE5 | Wellness section backgrounds, indicators |
| Sexual Health Pink | #FEE2E2 | Sexual health section backgrounds, indicators |

## Color Opacity Standards

| Opacity | Usage |
|---------|-------|
| 100% | Primary buttons, text, icons |
| 70% | Secondary buttons, hover states |
| 30% | Background highlights, banners |
| 10% | Subtle backgrounds, disabled states |

## Implementation Guidelines

### 1. Page Backgrounds
- All pages should use the standard Background Gray (#F9FAFB)
- Section headers should use the same Background Gray (#F9FAFB)

### 2. Cards and Containers
- All cards should have white backgrounds (#FFFFFF)
- Card shadows should be consistent: shadow-sm
- Card borders should be subtle: border border-gray-100

### 3. Buttons
- Primary buttons: bg-[#2D7FF9] text-white
- Secondary buttons: bg-white border border-gray-200 text-gray-600
- Danger buttons: bg-[#EF4444] text-white
- All buttons should use rounded-full for consistency

### 4. Text Colors
- Headings: text-[#111827]
- Body text: text-[#6B7280]
- Links and interactive text: text-[#2D7FF9]

### 5. Status Indicators
- Success badges: bg-[#D1FAE5] text-[#10B981]
- Warning badges: bg-[#FEF3C7] text-[#F59E0B]
- Error badges: bg-[#FEE2E2] text-[#EF4444]
- Info badges: bg-[#DBEAFE] text-[#2D7FF9]

### 6. Section-Specific Styling
- Weight management sections: Use Weight Blue (#DBEAFE) for section backgrounds
- Hair treatment sections: Use Hair Purple (#EDE9FE) for section backgrounds
- Wellness sections: Use Wellness Green (#D1FAE5) for section backgrounds
- Sexual health sections: Use Sexual Health Pink (#FEE2E2) for section backgrounds

## Page-Specific Color Corrections

### HomePageV2
- Change message preview card background to white (currently inconsistent)
- Standardize treatment card header backgrounds to use category colors
- Ensure all buttons use the standard Zappy Blue (#2D7FF9)

### ProgramsPage
- Update video card backgrounds to use category colors consistently
- Standardize "To Do" badges to use Zappy Yellow (#FFD100)
- Ensure "Done" badges use Success Green (#10B981)

### ShopPage
- Update product card backgrounds to use category colors
- Ensure all "Add" buttons use Zappy Blue (#2D7FF9)
- Standardize badge colors based on their meaning

### PatientServicesPageV3
- Update treatment card headers to use category colors
- Ensure consistent use of Zappy Blue (#2D7FF9) for all primary actions
- Standardize trending indicators to use Success Green (#10B981)

## Implementation Plan

1. Create a Tailwind theme extension with these color variables
2. Update all hardcoded color values to reference the theme variables
3. Audit all pages for color consistency
4. Apply corrections to standardize the color usage

By implementing this unified color palette, we'll create a visually cohesive experience across all pages of the application, strengthening brand identity and improving user experience.
