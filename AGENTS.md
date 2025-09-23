# AI Agents Guide for HTMX + Elysia + Hyperscript Projects

This document provides guidance for AI agents working on projects using this modern web stack, covering the tech stack, architecture, and development patterns.

## Tech Stack Overview

This project uses a modern, lightweight web stack:

- **Backend**: Elysia.js (TypeScript-first web framework)
- **Frontend**: HTMX + Hyperscript (progressive enhancement)
- **Styling**: Tailwind CSS
- **Runtime**: Bun (JavaScript runtime)
- **Language**: TypeScript

## Project Structure

```
project/
├── src/                    # Source code
│   ├── index.tsx          # Main server entry point
│   ├── server.ts          # Server configuration
│   ├── BaseHtml.tsx       # Base HTML template
│   ├── Home.tsx           # Home page component
│   ├── Counter.tsx        # Example component
│   ├── eden.ts            # Type-safe client
│   ├── htmx.ts            # HTMX utilities
│   └── styles.css         # Tailwind CSS source
├── tailwind-gen/          # Generated CSS
├── vendor/                # Third-party scripts
│   ├── htmx@2.0.4.js
│   └── hyperscript@0.9.14.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Key Concepts

### 1. Elysia.js Backend

Elysia is a TypeScript-first web framework that provides:

- Type-safe APIs
- Built-in HTML support via JSX
- WebSocket support
- Plugin ecosystem

**Key patterns:**

```typescript
// Route definition
app.post("/api/endpoint", async ({ body }) => {
  const { data } = body as { data: string };
  // Process request and return JSX
  return <ResultComponent data={result} />;
});

// Static file serving
app.get("/styles.css", () => file("./tailwind-gen/styles.css"));
```

### 2. HTMX Integration

HTMX enables dynamic content without JavaScript frameworks:

- `hx-post` - POST requests
- `hx-target` - Target element for response
- `hx-indicator` - Loading indicator
- `hx-trigger` - Custom triggers

**Example:**

```html
<form hx-post="/api/submit" hx-target="#result" hx-indicator="#loading">
  <input name="data" required />
  <button type="submit">Submit</button>
</form>
```

### 3. Hyperscript for Interactivity

Hyperscript provides event handling and DOM manipulation:

- Event listeners: `on click`, `on keyup`
- DOM queries: `#elementId`, `.className`
- Actions: `call`, `set`, `wait`
- Conditions: `if`, `when`

**Example:**

```html
<button
  _="on click 
           call navigator.clipboard.writeText('text')
           then set my textContent to 'Copied!'
           then wait 2s
           then set my textContent to 'Copy'"
>
  Copy
</button>
```

### 4. JSX Components

Components return JSX that gets rendered to HTML:

- Use `class` instead of `className`
- Props are TypeScript interfaces
- Components can be server-side rendered
- JSX is configured to use `Html.createElement` as factory (see tsconfig.json)

**Example:**

```typescript
export function ResultComponent({ data }: { data: string }) {
  return (
    <div class="bg-gray-50 rounded-lg p-4">
      <p>{data}</p>
    </div>
  );
}
```

## Development Patterns

### 1. Server-Side Rendering (SSR)

All components are rendered on the server:

- No client-side JavaScript frameworks
- HTMX handles dynamic updates
- Hyperscript adds interactivity

### 2. Type Safety

The project uses TypeScript throughout:

- API types are inferred from Elysia routes
- Component props are typed
- Eden provides type-safe client for API calls

### 3. Eden Client

Eden is a type-safe client that generates API endpoints from your Elysia routes:

```typescript
// Usage in components
hx-post={api.increment({ count }).post()}
hx-post={api.decrement({ count }).post()}
```

This ensures type safety between frontend and backend API calls.

### 4. Styling Approach

Tailwind CSS for utility-first styling:

- Classes are applied directly in JSX
- Responsive design with breakpoint prefixes
- Custom CSS in `src/styles.css`

### 5. Development Workflow

**Scripts:**

- `bun run dev` - Start development server with hot reload (runs server and Tailwind in parallel)
- `bun run tw:dev` - Watch Tailwind CSS changes
- `bun run start` - Production server

**Hot Reload:**

- WebSocket connection for live reload
- Tailwind CSS watching for style changes
- Server restarts on code changes

## Common Tasks

### Adding New Routes

1. Define route in `src/index.tsx`:

```typescript
app.get("/new-route", async () => {
  return <NewComponent />;
});
```

2. Create component in separate file:

```typescript
export function NewComponent() {
  return <div>New content</div>;
}
```

### Adding HTMX Functionality

1. Add HTMX attributes to HTML:

```html
<div hx-get="/api/data" hx-trigger="load">Content will be replaced</div>
```

2. Create corresponding route:

```typescript
app.get("/api/data", () => {
  return <div>Dynamic content</div>;
});
```

### Adding Hyperscript Interactivity

1. Use `_` attribute for hyperscript:

```html
<button _="on click call someFunction()">Click me</button>
```

2. Common patterns:

- `on click` - Click events
- `on keyup[key is 'Enter']` - Keyboard events
- `call functionName()` - Function calls
- `set element.property to value` - DOM manipulation

### Styling Components

1. Use Tailwind classes:

```html
<div class="bg-blue-500 text-white p-4 rounded-lg">Styled content</div>
```

2. Responsive design:

```html
<div class="w-full md:w-1/2 lg:w-1/3">Responsive width</div>
```

## Best Practices

### 1. Component Organization

- Keep components in separate files
- Use descriptive names
- Group related functionality

### 2. HTMX Patterns

- Use semantic HTML
- Provide loading states
- Handle errors gracefully
- Use appropriate HTTP methods

### 3. Hyperscript Guidelines

- Keep scripts simple and readable
- Use descriptive event handlers
- Avoid complex logic in hyperscript
- Prefer server-side processing

### 4. TypeScript Usage

- Type all component props
- Use interfaces for complex types
- Leverage Elysia's type inference
- Keep types close to usage

## Debugging

### Common Issues

1. **HTMX not working**: Check for JavaScript errors, verify attributes
2. **Hyperscript errors**: Check syntax, ensure proper quoting
3. **Styling issues**: Verify Tailwind classes, check CSS generation
4. **Type errors**: Ensure proper TypeScript configuration

### Development Tools

- Browser DevTools for HTMX debugging
- Console for hyperscript errors
- Network tab for API calls
- Elements tab for DOM inspection

## File Naming Conventions

- Components: PascalCase (e.g., `ResultComponent.tsx`)
- Utilities: camelCase (e.g., `htmx.ts`)
- Types: PascalCase interfaces
- Routes: kebab-case URLs

## Environment Setup

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Install dependencies: `bun install`
3. Start development: `bun run dev`
4. Access: `http://localhost:3000`

## Key Dependencies

- **Elysia**: 1.3.4 (TypeScript-first web framework)
- **HTMX**: 2.0.4 (dynamic content without JS frameworks)
- **Hyperscript**: 0.9.14 (event handling and DOM manipulation)
- **Tailwind CSS**: 3.4.17 (utility-first styling)
- **Bun**: Latest (JavaScript runtime)

This project prioritizes simplicity, type safety, and progressive enhancement over complex client-side frameworks.
