# UI Overhaul Implementation Plan

This document outlines the plan for implementing the new design system across the application.

## 1. Update Tailwind Configuration

First, we'll update the Tailwind configuration in `index.html` to match the new color palette:

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: {
            light: '#38bdf8', // sky-400
            DEFAULT: '#0ea5e9', // sky-500
            dark: '#0284c7', // sky-600
          },
          secondary: {
            light: '#475569', // slate-600
            DEFAULT: '#334155', // slate-700
            dark: '#1e293b', // slate-800
          },
          accent: {
            light: '#34d399', // emerald-400
            DEFAULT: '#10b981', // emerald-500
            dark: '#059669', // emerald-600
          },
          danger: '#ef4444', // red-500
          sidebar: {
            bg: '#1e293b', // slate-800
            text: '#f1f5f9', // slate-100
            hoverBg: '#334155', // slate-700
            activeBg: '#475569', // slate-600
          },
        },
      },
    },
  };
</script>
```

## 2. Global Styles

Add these global styles to `App.js`:

```javascript
// Add global styles
const globalStyles = document.createElement('style');
globalStyles.innerHTML = `
  .input {
    @apply mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT sm:text-sm;
  }
  .input-sm {
    @apply block w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT text-sm;
  }
  .btn-primary {
    @apply px-4 py-2 text-sm font-medium text-white bg-accent-DEFAULT hover:bg-accent-dark border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-dark;
  }
  .btn-secondary {
    @apply px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500;
  }
  /* Primary buttons INSIDE FORMS using primary color (sky blue) if not the main page CTA */
  form .btn-primary {
      @apply bg-primary-DEFAULT hover:bg-primary-dark focus:ring-primary-dark;
  }
`;
document.head.appendChild(globalStyles);
```

## 3. Layout Components

### 3.1 Sidebar Component

Update or create `src/layouts/components/Sidebar.jsx`:

```jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react'; // Import icons as needed

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-slate-800 text-slate-100 flex flex-col fixed top-0 left-0 shadow-lg print:hidden">
      {/* App Logo/Name */}
      <div className="px-4 py-5 flex items-center">
        <h1 className="text-xl font-bold">Telehealth</h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {/* Navigation items will go here based on SidebarItems.js */}
        {sidebarItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm rounded-lg hover:bg-slate-700"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

// NavItem component
const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-100 hover:bg-slate-700 transition-colors group ${
        isActive ? 'bg-slate-700 font-semibold' : 'hover:bg-opacity-75'
      }`}
    >
      {React.cloneElement(icon, {
        className: `w-5 h-5 mr-3 text-slate-100 group-hover:text-slate-100 ${isActive ? 'text-slate-100' : ''}`,
      })}
      {label}
    </Link>
  );
};

export default Sidebar;
```

### 3.2 TopNavBar Component

Update or create `src/layouts/components/TopNavBar.jsx`:

```jsx
import React from 'react';
import { Search, Bell } from 'lucide-react';

const TopNavBar = () => {
  return (
    <div className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 z-40 print:hidden">
      {/* Search Input */}
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center space-x-4">
        <button className="relative p-1 rounded-full hover:bg-slate-100">
          <Bell className="h-6 w-6 text-slate-600" />
          {/* Notification indicator */}
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center text-white font-medium">
            {/* User initials */}
            {userInitials}
          </div>
          <span className="ml-2 text-sm font-medium text-slate-700">
            {userName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopNavBar;
```

### 3.3 Main Layout

Update `src/layouts/MainLayout.jsx`:

```jsx
import React from 'react';
import Sidebar from './components/Sidebar';
import TopNavBar from './components/TopNavBar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <TopNavBar />

      {/* Main Content */}
      <main className="flex-1 ml-64 pt-16 overflow-y-auto">{children}</main>
    </div>
  );
};

export default MainLayout;
```

## 4. Component Updates

### 4.1 Button Components

Create a standardized button component:

```jsx
// src/components/common/Button.jsx
import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors';

  const variantClasses = {
    primary: 'bg-accent-DEFAULT hover:bg-accent-dark text-white',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    link: 'text-primary-DEFAULT hover:text-primary-dark underline bg-transparent',
    ghost: 'text-slate-700 hover:bg-slate-100 bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const classes = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${sizeClasses[size]} 
    ${className}
  `;

  return (
    <button className={classes} {...props}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Form button that uses primary color instead of accent
export const FormButton = (props) => {
  if (props.variant === 'primary') {
    return (
      <Button
        {...props}
        className={`bg-primary-DEFAULT hover:bg-primary-dark focus:ring-primary-dark ${props.className || ''}`}
      />
    );
  }
  return <Button {...props} />;
};
```

### 4.2 Input Components

Create standardized input components:

```jsx
// src/components/common/Input.jsx
import React from 'react';

export const Input = ({
  label,
  id,
  error,
  helperText,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'input-sm',
    md: 'input',
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${sizeClasses[size]} ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
        {...props}
      />
      {helperText && (
        <p
          className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-slate-500'}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export const Select = ({
  label,
  id,
  options = [],
  error,
  helperText,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'input-sm',
    md: 'input',
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`${sizeClasses[size]} ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p
          className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-slate-500'}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};
```

## 5. Page Component Updates

### 5.1 Standard Page Layout

Create a standard page layout component:

```jsx
// src/components/common/PageLayout.jsx
import React from 'react';

export const PageLayout = ({ title, actions, children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
};

export const Card = ({ title, actions, children, className = '' }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-800">{title}</h3>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
```

## 6. Implementation Strategy

1. **Phase 1: Core Layout & Components**

   - Update Tailwind configuration
   - Implement global styles
   - Update Sidebar and TopNavBar
   - Create common components (Button, Input, Card, etc.)

2. **Phase 2: Page-by-Page Updates**

   - Start with high-visibility pages (Dashboard, Patients, Orders)
   - Update each page to use the new components and styles
   - Ensure consistent page layouts with PageLayout component

3. **Phase 3: Forms & Modals**

   - Update all forms to use the new input components
   - Update modals to match the new design system
   - Ensure form buttons use the correct color scheme

4. **Phase 4: Testing & Refinement**
   - Test all pages for visual consistency
   - Ensure responsive design works correctly
   - Fix any styling issues or inconsistencies

## 7. Key Design Principles to Follow

1. **Button Usage**:

   - Primary page CTAs: Use accent color (emerald green)
   - Form submit buttons: Use primary color (sky blue)
   - Secondary/Cancel buttons: Use light gray

2. **Layout Structure**:

   - Fixed sidebar (w-64, bg-slate-800)
   - Fixed top navbar (h-16, bg-white)
   - Main content with proper spacing (ml-64, pt-16)

3. **Typography**:

   - Page titles: text-2xl font-semibold text-slate-800
   - Card titles: text-lg font-medium text-slate-800
   - Body text: text-sm text-slate-700
   - Secondary text: text-sm text-slate-500

4. **Cards & Containers**:
   - White background (bg-white)
   - Rounded corners (rounded-lg)
   - Subtle shadows (shadow-md)
   - Consistent padding (p-6)

By following this implementation plan, we'll achieve a consistent, modern UI across the entire application.
