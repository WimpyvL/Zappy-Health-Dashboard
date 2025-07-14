# Glassmorphic Design System - Setup Guide

## Quick Start (5 Minutes)

### 1. Copy Files to Your Project

Copy all the created files to your project structure:

```bash
# CSS Files
src/styles/glassmorphic/base.css
src/styles/glassmorphic/components.css

# React Components
src/components/ui/glass/GlassCard.jsx
src/components/ui/glass/GlassButton.jsx
src/components/ui/glass/GlassModal.jsx
src/components/ui/glass/GlassNavigation.jsx
src/components/ui/glass/GlassProvider.jsx
src/components/ui/glass/index.js

# Utilities & Hooks
src/hooks/useGlassmorphicSupport.js
src/utils/glassPerformance.js
src/types/glassmorphic.ts

# Tests
src/components/ui/glass/__tests__/GlassCard.test.jsx

# Integration Files
src/index.glassmorphic.css
```

### 2. Update Your Main CSS File

Add these imports to your `src/index.css` or main stylesheet:

```css
/* Add to the top of your src/index.css */
@import './styles/glassmorphic/base.css';
@import './styles/glassmorphic/components.css';
```

### 3. Wrap Your App with GlassProvider

Update your main App component:

```jsx
// src/App.jsx
import React from 'react';
import { GlassProvider } from './components/ui/glass';

function App() {
  return (
    <GlassProvider
      settings={{
        enableAnimations: true,
        enableBlur: true,
        performanceMode: 'auto'
      }}
    >
      {/* Your existing app content */}
    </GlassProvider>
  );
}

export default App;
```

### 4. Start Using Components

Replace existing glassmorphic elements:

```jsx
// Before
<div className="bg-white/90 backdrop-blur-sm rounded-lg p-6">
  <button className="bg-blue-500 text-white px-4 py-2 rounded">
    Click Me
  </button>
</div>

// After
import { GlassCard, GlassButton } from './components/ui/glass';

<GlassCard>
  <GlassButton variant="primary">
    Click Me
  </GlassButton>
</GlassCard>
```

## Migration Examples

### Program Tabs Navigation
```jsx
// Before
<div className="program-tabs">
  {programs.map((program) => (
    <button
      key={program.id}
      className={`program-tab ${activeProgram === program.id ? 'active' : ''}`}
      onClick={() => setActiveProgram(program.id)}
    >
      {program.name}
    </button>
  ))}
</div>

// After
import { GlassNavigation } from './components/ui/glass';

<GlassNavigation
  items={programs.map(p => ({ id: p.id, label: p.name }))}
  activeItem={activeProgram}
  onItemClick={(item) => setActiveProgram(item.id)}
/>
```

### Hero Cards
```jsx
// Before
<div className="hero-card">
  <h2 className="hero-title">12 lbs lost</h2>
  <button className="cta-primary">Log Weight</button>
</div>

// After
<GlassCard variant="hero">
  <h2 className="text-xl font-bold text-gray-900 mb-2">12 lbs lost</h2>
  <GlassButton variant="primary">Log Weight</GlassButton>
</GlassCard>
```

### Modals
```jsx
// Before
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
      <h3>Modal Title</h3>
      <p>Content</p>
      <button onClick={closeModal}>Close</button>
    </div>
  </div>
)}

// After
<GlassModal
  isOpen={showModal}
  onClose={closeModal}
  title="Modal Title"
>
  <p>Content</p>
  <GlassButton onClick={closeModal}>Close</GlassButton>
</GlassModal>
```

## Component API Reference

### GlassCard
```jsx
<GlassCard
  variant="default" // 'default' | 'hero' | 'subtle' | 'elevated'
  className=""
  onClick={handleClick}
  hover={true}
  as="div" // any HTML element
>
  Content
</GlassCard>
```

### GlassButton
```jsx
<GlassButton
  variant="primary" // 'primary' | 'secondary' | 'accent'
  size="md" // 'sm' | 'md' | 'lg'
  disabled={false}
  loading={false}
  onClick={handleClick}
  type="button" // 'button' | 'submit' | 'reset'
>
  Button Text
</GlassButton>
```

### GlassModal
```jsx
<GlassModal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  size="md" // 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick={true}
  showCloseButton={true}
>
  Modal Content
</GlassModal>
```

### GlassNavigation
```jsx
<GlassNavigation
  items={[
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'profile', label: 'Profile', badge: 2 }
  ]}
  activeItem="home"
  onItemClick={(item, index) => navigate(item.id)}
  orientation="horizontal" // 'horizontal' | 'vertical'
  size="md" // 'sm' | 'md' | 'lg'
/>
```

## Performance Monitoring

### Enable Development Monitoring
```jsx
// Add to your main App component
import { useEffect } from 'react';
import { measureGlassPerformance } from './components/ui/glass';

function App() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      measureGlassPerformance();
    }
  }, []);
  
  return <YourApp />;
}
```

### Get Performance Stats
```jsx
import { getGlobalPerformanceMonitor } from './components/ui/glass';

const monitor = getGlobalPerformanceMonitor();
console.log(monitor.getStats());
// {
//   totalMeasurements: 15,
//   averageRenderTime: "12.34",
//   slowRenderCount: 2,
//   slowRenderPercentage: "13.3"
// }
```

## Testing

### Run Component Tests
```bash
# Run all glass component tests
npm test -- --testPathPattern=glass

# Run specific test
npm test GlassCard.test.jsx

# Run with coverage
npm test -- --coverage --testPathPattern=glass
```

### Test Component Integration
```jsx
import { render, screen } from '@testing-library/react';
import { GlassProvider } from './components/ui/glass';
import YourComponent from './YourComponent';

test('renders with glass provider', () => {
  render(
    <GlassProvider>
      <YourComponent />
    </GlassProvider>
  );
  
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

## Troubleshooting

### Performance Issues
If you experience slow rendering:

1. Check console for performance warnings
2. Enable performance mode: `<GlassProvider settings={{ performanceMode: 'force' }}>`
3. Reduce blur effects on mobile devices (automatically handled)

### Browser Compatibility
If glassmorphic effects don't appear:

1. Check browser support: Chrome 76+, Firefox 103+, Safari 14+, Edge 79+
2. Fallbacks are automatic - check for `glass-fallback` class
3. For older browsers, effects gracefully degrade to solid backgrounds

### TypeScript Issues
If using TypeScript:

1. Ensure `src/types/glassmorphic.ts` is included in your `tsconfig.json`
2. Import types: `import type { GlassCardProps } from './types/glassmorphic'`

## Advanced Configuration

### Custom Performance Settings
```jsx
<GlassProvider
  settings={{
    enableAnimations: false, // Disable all animations
    enableBlur: true,        // Enable/disable blur effects
    performanceMode: 'force' // 'auto' | 'force' | 'off'
  }}
>
  <App />
</GlassProvider>
```

### Custom CSS Variables
Override design tokens in your CSS:

```css
:root {
  --glass-bg-primary: rgba(255, 255, 255, 0.95);
  --glass-blur-md: blur(15px);
  --glass-border-primary: 1px solid rgba(255, 255, 255, 0.3);
}
```

## Browser Support Matrix

| Browser | Version | Glassmorphic Support | Fallback |
|---------|---------|---------------------|----------|
| Chrome  | 76+     | ✅ Full Support     | N/A      |
| Firefox | 103+    | ✅ Full Support     | N/A      |
| Safari  | 14+     | ✅ Full Support     | N/A      |
| Edge    | 79+     | ✅ Full Support     | N/A      |
| Chrome  | <76     | ❌ No Support       | ✅ Solid BG |
| Firefox | <103    | ❌ No Support       | ✅ Solid BG |
| Safari  | <14     | ❌ No Support       | ✅ Solid BG |

## Support

For issues or questions:

1. Check the console for performance warnings
2. Verify browser compatibility
3. Review the migration examples
4. Test with `GlassProvider` settings adjustments

The glassmorphic design system is now ready for production use! 🎉