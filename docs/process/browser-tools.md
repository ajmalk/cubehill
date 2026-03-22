# Browser Tools for Agents

How agents use Playwright MCP tools to interact with the running CubeHill app. Owned by the Software Architect.

## Starting the Dev Server

Before using any browser tools, start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`. Navigate to it with:

```bash
browser_navigate("http://localhost:5173/")
```

Note: In development, `paths.base` is empty, so routes are at `/oll/`, `/pll/`, etc. — not `/cubehill/oll/`.

## Available Tools

### Navigation & Inspection

| Tool                         | Purpose                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `browser_navigate(url)`      | Navigate to a URL                                                                                       |
| `browser_snapshot()`         | Get the accessibility tree of the current page — structured text representation of all visible elements |
| `browser_take_screenshot()`  | Capture a pixel-level screenshot of the current viewport                                                |
| `browser_console_messages()` | Read console output (logs, warnings, errors)                                                            |

### Interaction

| Tool                           | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| `browser_click(selector)`      | Click an element (CSS selector or accessibility label) |
| `browser_type(selector, text)` | Type text into an input field                          |

### JavaScript Execution

| Tool                       | Purpose                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `browser_evaluate(script)` | Run arbitrary JavaScript in the page context — access DOM, stores, Three.js scene |

Use `browser_evaluate` to inspect runtime state that isn't visible in the DOM:

```javascript
// Check cube state
browser_evaluate("document.querySelector('canvas').__scene?.cubeMesh?.state");

// Read a Svelte store value
browser_evaluate('window.__cubeStore?.stepIndex');

// Check the current theme
browser_evaluate("document.documentElement.getAttribute('data-theme')");

// Get computed CSS variables
browser_evaluate("getComputedStyle(document.documentElement).getPropertyValue('--b1')");
```

### Network

| Tool                               | Purpose                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `browser_network_requests()`       | View network requests made by the page                                                |
| `browser_route(pattern, response)` | Mock network responses — intercept requests matching a pattern and return custom data |

CubeHill is fully static (no API calls), so network tools are mainly useful for verifying that no unexpected requests are made, or for testing error states during development of any future API integrations.

### Storage

| Tool          | Purpose                                          |
| ------------- | ------------------------------------------------ |
| Storage tools | Read/write localStorage, sessionStorage, cookies |

Useful for inspecting or manipulating the persisted theme preference (`localStorage.getItem('theme')`).

### DevTools

| Tool          | Purpose                              |
| ------------- | ------------------------------------ |
| Tracing tools | Record and export performance traces |
| Video tools   | Record video of interactions         |

Useful for capturing animation sequences or documenting UI behavior.

### Vision (Pixel-Level)

| Tool               | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| Vision mouse tools | Click at exact pixel coordinates based on screenshot analysis |

Useful when elements lack good selectors or for interacting with the Three.js canvas (which doesn't have DOM elements for individual cubies).

### Testing Assertions

| Tool            | Purpose                                                             |
| --------------- | ------------------------------------------------------------------- |
| Assertion tools | Verify element state — visibility, text content, attributes, counts |

Use for automated verification of UI state after interactions.

## Common Workflows

### Visual Review

1. Start dev server, navigate to the page
2. `browser_snapshot()` to understand the page structure
3. `browser_take_screenshot()` to see the visual result
4. Navigate to different pages and repeat

### Verifying Algorithm Playback

1. Navigate to an algorithm detail page: `browser_navigate("http://localhost:5173/oll/oll-1/")`
2. `browser_snapshot()` to see the playback controls
3. `browser_click` the play button or step-forward button
4. `browser_take_screenshot()` after each step to verify the 3D animation
5. `browser_evaluate` to check the cube state matches expectations

### Checking Console Errors

1. Navigate to each page
2. `browser_console_messages()` to check for errors or warnings
3. Pay special attention to Three.js warnings (deprecated APIs, WebGL context issues) and Svelte runtime errors

### Testing Theme Switching

1. `browser_click` the theme toggle
2. `browser_take_screenshot()` to verify the visual change
3. `browser_evaluate("document.documentElement.getAttribute('data-theme')")` to confirm the attribute changed
4. `browser_evaluate("localStorage.getItem('theme')")` to confirm persistence

### Testing Command Palette

1. Use keyboard shortcut or `browser_evaluate("document.querySelector('ninja-keys').open()")` to open
2. `browser_type` to search for an algorithm
3. `browser_snapshot()` to see the search results
4. `browser_click` a result and verify navigation

### Testing Responsive Layout

1. Use browser viewport resizing (if available) to test at different breakpoints
2. `browser_take_screenshot()` at mobile (< 640px), tablet (640-1024px), and desktop (> 1024px) widths
3. Verify the algorithm grid column count and navigation layout changes

## Best Practices

- **Snapshot before screenshot**: `browser_snapshot()` is faster and gives structured data. Use it first to understand the page, then screenshot only when you need pixel-level visual verification (especially for Three.js canvas content).
- **Check console after navigation**: Always run `browser_console_messages()` after navigating to a new page to catch runtime errors early.
- **Use evaluate for Three.js state**: The 3D canvas has no DOM representation of individual cubies. Use `browser_evaluate` to inspect the Three.js scene graph or cube state array directly.
- **Wait for animations**: After triggering a cube animation (clicking play or step-forward), wait for the animation duration (~300ms) before taking a screenshot or checking state.
- **Clean state between tests**: If testing multiple scenarios, reload the page between tests to reset cube state and playback position.

## Gotchas

- **Three.js canvas is opaque to DOM tools**: `browser_snapshot()` will show the `<canvas>` element but not its 3D contents. Use `browser_take_screenshot()` or `browser_evaluate` to inspect what's rendered.
- **ninja-keys is a web component**: Its internal DOM is in a shadow root. Standard CSS selectors may not reach inside it. Use `browser_evaluate` with `document.querySelector('ninja-keys').shadowRoot` to access its internals.
- **SSR vs client rendering**: Some components only mount client-side (Three.js, ninja-keys). If you snapshot too early, they may not be rendered yet. Check that `onMount` has fired.
- **Base path in dev vs prod**: Dev server uses no base path (`/`), but production uses `/cubehill/`. Don't hardcode URLs with the base path when testing locally.
- **WebGL context limits**: Browsers limit the number of concurrent WebGL contexts. If running many tests in sequence without page reloads, you may hit context limits. Reload between tests.
