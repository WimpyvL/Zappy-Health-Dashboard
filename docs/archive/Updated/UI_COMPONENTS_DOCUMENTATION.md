# Zappy Health UI Components Documentation

This document provides an overview of the standardized UI components available in the Zappy Health design system. These components are designed to provide a consistent user experience across the application while ensuring accessibility and responsiveness.

## Table of Contents

1. [Button](#button)
2. [PageHeader](#pageheader)
3. [Container](#container)
4. [Grid](#grid)
5. [AccessibleModal](#accessiblemodal)
6. [ProductCard](#productcard)
7. [TreatmentCard](#treatmentcard)
8. [TabNavigation](#tabnavigation)
9. [StatusBadge](#statusbadge)
10. [ReferralBanner](#referralbanner)

## Color System

The Zappy Health design system uses a consistent color palette defined in `tailwind.config.js` and `src/theme.js`. The color utilities in `src/utils/colorUtils.js` provide functions for working with these colors.

### Primary Brand Colors

- `zappy-blue`: #2D7FF9 - Primary brand color, used for main actions and brand elements
- `zappy-yellow`: #FFD100 - Secondary brand color, used for accents and highlights

### Status Colors

- `success`: #10B981 - Used for success states, confirmations, and positive actions
- `warning`: #F59E0B - Used for warnings and cautionary states
- `error`: #EF4444 - Used for errors and destructive actions
- `info`: #2D7FF9 - Used for informational states (same as zappy-blue)

### Category/Section Colors

- `weight-blue`: #DBEAFE - Used for weight management related content
- `hair-purple`: #EDE9FE - Used for hair treatment related content
- `wellness-green`: #D1FAE5 - Used for wellness related content
- `sexual-health-pink`: #FEE2E2 - Used for sexual health related content

### Neutral Colors

- `bg-gray`: #F9FAFB - Used for page backgrounds
- `card-white`: #FFFFFF - Used for card backgrounds
- `border-gray`: #E5E7EB - Used for borders
- `text-dark`: #111827 - Used for primary text
- `text-medium`: #6B7280 - Used for secondary text
- `text-light`: #9CA3AF - Used for tertiary text

## Components

### Button

A versatile button component with various styles, sizes, and states.

#### Import

```jsx
import Button from '../components/ui/redesign/Button';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | node | (required) | Button content |
| variant | string | 'primary' | Button style variant ('primary', 'secondary', 'success', 'warning', 'danger', 'ghost') |
| size | string | 'medium' | Button size ('small', 'medium', 'large') |
| fullWidth | boolean | false | Whether button should take full width |
| icon | node | undefined | Icon to display in button |
| iconPosition | string | 'left' | Position of icon ('left' or 'right') |
| onClick | function | undefined | Click handler |
| className | string | '' | Additional CSS classes |
| disabled | boolean | false | Whether button is disabled |

#### Examples

```jsx
// Primary button
<Button onClick={handleClick}>Submit</Button>

// Secondary button with icon
<Button 
  variant="secondary" 
  icon={<Save />} 
  onClick={handleSave}
>
  Save
</Button>

// Small success button
<Button 
  variant="success" 
  size="small" 
  onClick={handleConfirm}
>
  Confirm
</Button>

// Full width warning button
<Button 
  variant="warning" 
  fullWidth 
  onClick={handleWarning}
>
  Warning
</Button>

// Disabled button
<Button 
  disabled 
  onClick={handleSubmit}
>
  Submit
</Button>
```

### PageHeader

A standardized header component for pages with consistent styling.

#### Import

```jsx
import PageHeader from '../components/ui/redesign/PageHeader';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | (required) | The page title |
| subtitle | string | undefined | Optional subtitle text |
| rightContent | node | undefined | Optional content to display on the right side |
| showUserIcon | boolean | true | Whether to show the user icon |
| onUserIconClick | function | undefined | Function to call when user icon is clicked |
| subtitleColor | string | 'text-zappy-blue' | Color class for the subtitle text |
| className | string | '' | Additional CSS classes |

#### Examples

```jsx
// Basic header
<PageHeader title="Dashboard" />

// Header with subtitle
<PageHeader 
  title="Patient Services" 
  subtitle="Manage your treatments and services"
/>

// Header with custom right content
<PageHeader 
  title="Shop" 
  subtitle="Browse products and services"
  rightContent={
    <div className="relative">
      <ShoppingCart className="h-6 w-6" />
      <span className="absolute -top-2 -right-2 bg-zappy-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
        3
      </span>
    </div>
  }
/>
```

### Container

A responsive container component that centers content and applies consistent padding.

#### Import

```jsx
import Container from '../components/ui/redesign/Container';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | node | (required) | Container content |
| maxWidth | string | 'xl' | Maximum width of the container ('sm', 'md', 'lg', 'xl', '2xl', 'full') |
| padding | boolean | true | Whether to apply padding |
| className | string | '' | Additional CSS classes |

#### Examples

```jsx
// Default container
<Container>
  <h1>Page Content</h1>
  <p>This content will be centered and have responsive padding.</p>
</Container>

// Medium width container without padding
<Container maxWidth="md" padding={false}>
  <div className="bg-white p-6 rounded-lg">
    <h2>Custom Content</h2>
    <p>This content will be centered with a medium max width.</p>
  </div>
</Container>
```

### Grid

A responsive grid component that adapts to different screen sizes.

#### Import

```jsx
import Grid from '../components/ui/redesign/Grid';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | node | (required) | Grid content |
| columns | object | { xs: 1, sm: 2, md: 3, lg: 4 } | Number of columns at different breakpoints |
| gap | number or string | 4 | Gap size between grid items |
| className | string | '' | Additional CSS classes |

#### Examples

```jsx
// Default grid
<Grid>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</Grid>

// Custom columns and gap
<Grid 
  columns={{ 
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3 
  }}
  gap={6}
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

### AccessibleModal

An accessible modal dialog with proper focus management and keyboard navigation.

#### Import

```jsx
import AccessibleModal from '../components/ui/redesign/AccessibleModal';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | boolean | (required) | Whether the modal is open |
| onClose | function | (required) | Function to call when modal is closed |
| title | string | (required) | Modal title |
| children | node | (required) | Modal content |
| className | string | '' | Additional CSS classes for the modal |
| size | string | 'medium' | Modal size ('small', 'medium', 'large', 'xl', '2xl', 'full') |
| closeOnEsc | boolean | true | Whether to close modal on ESC key |
| closeOnOutsideClick | boolean | true | Whether to close modal when clicking outside |

#### Examples

```jsx
// Basic modal
const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>Open Modal</Button>

<AccessibleModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Example Modal"
>
  <p>This is an accessible modal dialog.</p>
  <Button onClick={() => setIsOpen(false)}>Close</Button>
</AccessibleModal>

// Large modal with custom behavior
<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Settings"
  size="large"
  closeOnEsc={false}
  closeOnOutsideClick={false}
>
  <div className="space-y-4">
    <h3>User Settings</h3>
    <p>Configure your account settings.</p>
    <div className="flex justify-end space-x-2">
      <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </div>
  </div>
</AccessibleModal>
```

### ProductCard

A card component for displaying product information in the Shop page and cross-sell sections.

#### Import

```jsx
import ProductCard from '../components/ui/redesign/ProductCard';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | (required) | The product title |
| description | string | (required) | The product description |
| imageUrl | string | undefined | URL to the product image |
| price | number | (required) | The product price |
| originalPrice | number | undefined | The original price (for displaying discounts) |
| badge | string | undefined | Optional badge text (e.g., "Works with Wegovy®") |
| badgeVariant | string | 'info' | The color variant for the badge |
| tag | string | undefined | Optional tag text (e.g., "Weight", "Hair") |
| tagVariant | string | 'info' | The color variant for the tag |
| onAddToCart | function | undefined | Function to call when the Add button is clicked |
| onViewDetails | function | undefined | Function to call when the product card is clicked for details |

#### Examples

```jsx
// Basic product card
<ProductCard
  title="Protein Powder"
  description="High-quality protein supplement"
  imageUrl="/images/products/protein.jpg"
  price={49.99}
  onAddToCart={() => handleAddToCart(product)}
  onViewDetails={() => handleViewDetails(product)}
/>

// Product card with discount and badge
<ProductCard
  title="Electrolytes Plus"
  description="Essential electrolytes for hydration"
  imageUrl="/images/products/electrolytes.jpg"
  price={19.99}
  originalPrice={24.99}
  badge="Best Seller"
  badgeVariant="success"
  tag="Weight"
  tagVariant="weight"
  onAddToCart={() => handleAddToCart(product)}
  onViewDetails={() => handleViewDetails(product)}
/>
```

### TreatmentCard

A card component for displaying treatment information with color-coded headers based on treatment type.

#### Import

```jsx
import TreatmentCard from '../components/ui/redesign/TreatmentCard';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | string | 'weight' | The treatment type ('weight', 'hair', 'wellness', 'sexual') |
| title | string | (required) | The title of the treatment |
| subtitle | string | (required) | The subtitle or description of the treatment |
| status | string | 'active' | The status of the treatment (active, paused, etc.) |
| nextTask | object | undefined | The next task for this treatment (with title and description) |
| details | array | [] | Array of detail objects with label and value |
| primaryAction | object | undefined | The primary action button (with text and onClick) |
| secondaryAction | object | undefined | The secondary action button (with text and onClick) |
| resourceLinks | array | [] | Array of resource link objects (with icon, text, and onClick) |

#### Examples

```jsx
// Weight management treatment card
<TreatmentCard
  type="weight"
  title="Semaglutide 0.5mg"
  subtitle="Weekly injection for weight management"
  status="active"
  nextTask={{
    title: "Next dose: Today by 8:00 PM",
    description: "Take your medication on time for best results"
  }}
  details={[
    { label: "Dosage", value: "0.5mg weekly injection" },
    { label: "Storage", value: "Refrigerate (36-46°F)" },
    { label: "Progress", value: "-8 lbs in 5 weeks" }
  ]}
  primaryAction={{
    text: "Check-in",
    onClick: () => handleCheckIn('weight')
  }}
  secondaryAction={{
    text: "Message",
    onClick: () => handleMessageProvider('weight')
  }}
  resourceLinks={[
    {
      icon: <FileText className="h-4 w-4 text-blue-600" />,
      text: "Medication Guide",
      onClick: () => showModal('weight-instructions')
    },
    {
      icon: <Calendar className="h-4 w-4 text-green-600" />,
      text: "Subscription Details",
      onClick: () => showModal('subscription-details')
    }
  ]}
/>
```

### TabNavigation

A component for navigating between different tabs or sections of content.

#### Import

```jsx
import TabNavigation from '../components/ui/redesign/TabNavigation';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | array | (required) | Array of tab objects with id, label, and optional icon |
| activeTab | string | (required) | ID of the currently active tab |
| onTabChange | function | (required) | Function to call when a tab is clicked |
| className | string | '' | Additional CSS classes |

#### Examples

```jsx
// Basic tabs
const [activeTab, setActiveTab] = useState('treatments');

<TabNavigation
  tabs={[
    { id: 'treatments', label: 'Treatments' },
    { id: 'notes', label: 'Notes' },
    { id: 'history', label: 'History' }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

// Tabs with icons
<TabNavigation
  tabs={[
    { id: 'treatments', label: 'Treatments', icon: <Pill className="h-4 w-4" /> },
    { id: 'notes', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'insights', label: 'Insights', icon: <Info className="h-4 w-4" /> }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

### StatusBadge

A component for displaying status information with appropriate colors.

#### Import

```jsx
import StatusBadge from '../components/ui/redesign/StatusBadge';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| status | string | (required) | The status text to display |
| variant | string | 'info' | The color variant for the badge |
| className | string | '' | Additional CSS classes |

#### Examples

```jsx
// Active status
<StatusBadge status="Active" variant="success" />

// Pending status
<StatusBadge status="Pending" variant="warning" />

// Inactive status
<StatusBadge status="Inactive" variant="gray" />

// Custom status
<StatusBadge status="In Review" variant="info" />
```

### ReferralBanner

A banner component for promoting referrals.

#### Import

```jsx
import ReferralBanner from '../components/ui/redesign/ReferralBanner';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | (required) | The banner title |
| subtitle | string | undefined | Optional subtitle text |
| buttonText | string | 'Invite' | Text for the action button |
| onButtonClick | function | undefined | Function to call when the button is clicked |
| referralCount | number | undefined | Number of successful referrals to display |
| icon | node | undefined | Icon to display in the banner |
| className | string | '' | Additional CSS classes |

#### Examples

```jsx
// Basic referral banner
<ReferralBanner
  title="Share with a buddy, get $20 credit"
  buttonText="Share"
  onButtonClick={handleReferral}
/>

// Detailed referral banner
<ReferralBanner
  title="Tell a buddy, both get $20 credit"
  subtitle="You've helped 3 friends already!"
  buttonText="Share"
  onButtonClick={handleReferral}
  referralCount={3}
  icon={
    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
      <Plus className="h-4 w-4 text-zappy-blue" />
    </div>
  }
  className="bg-weight-blue"
/>
```

## Utility Functions

### Color Utilities

The `src/utils/colorUtils.js` file provides utility functions for working with colors:

```jsx
import { 
  hexToRgb, 
  getColorWithOpacity, 
  lightenColor, 
  darkenColor,
  isLightColor,
  getContrastTextColor
} from '../utils/colorUtils';

// Convert hex to RGB
const rgbValue = hexToRgb('#2D7FF9'); // "45, 127, 249"

// Get color with opacity
const blueWithOpacity = getColorWithOpacity('zappy-blue', 0.5); // "rgba(45, 127, 249, 0.5)"

// Lighten a color
const lightBlue = lightenColor('#2D7FF9', 0.3); // Lightened blue color

// Darken a color
const darkBlue = darkenColor('#2D7FF9', 0.2); // Darkened blue color

// Check if a color is light
const isLight = isLightColor('#DBEAFE'); // true

// Get contrasting text color
const textColor = getContrastTextColor('#2D7FF9'); // "#FFFFFF"
```

### Asset Management

The `src/utils/assetManager.js` file provides utility functions for managing assets and images:

```jsx
import { 
  getWeightManagementImage, 
  getHairTreatmentImage, 
  getWellnessImage, 
  getSexualHealthImage,
  getProductImage,
  getImageByServiceType,
  getAssetUrl
} from '../utils/assetManager';

// Get a weight management image
const weightImage = getWeightManagementImage(300, 200, 0);

// Get a hair treatment image
const hairImage = getHairTreatmentImage(300, 200, 1);

// Get a wellness image
const wellnessImage = getWellnessImage(300, 200, 0);

// Get a sexual health image
const sexualHealthImage = getSexualHealthImage(300, 200, 2);

// Get an image by service type (recommended approach)
const edImage = getImageByServiceType('ed-treatment', 300, 200, 0);

// Get an asset by category (backward compatibility)
const productImage = getAssetUrl('products', 0, 300);
```

## Best Practices

1. **Use Theme Colors**: Always use the theme colors defined in the design system rather than hardcoded hex values.

2. **Responsive Design**: Use the Container and Grid components to create responsive layouts that work well on all device sizes.

3. **Accessibility**: Ensure all interactive elements are keyboard accessible and have appropriate ARIA attributes.

4. **Consistent Spacing**: Use Tailwind's spacing scale consistently (e.g., `p-4`, `mb-6`, etc.) to maintain visual harmony.

5. **Component Composition**: Compose complex UIs from smaller, reusable components rather than creating monolithic components.

6. **Prop Validation**: Always define PropTypes for your components to ensure they are used correctly.

7. **Semantic HTML**: Use semantic HTML elements appropriately (e.g., `<button>` for buttons, `<nav>` for navigation, etc.).

8. **Performance**: Be mindful of performance implications, especially when using complex components or animations.
