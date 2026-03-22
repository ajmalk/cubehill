# Figma Tools for Agents

How agents use Figma MCP tools to create, edit, and read designs for CubeHill. Owned by the UX Designer (design creation), also used by the Software Architect (architecture diagrams), Product Manager (user flows and planning), and Full-Stack Dev (implementation reference).

## Two MCP Servers

CubeHill connects two Figma MCP servers with distinct purposes:

| Server | Purpose | Primary Users |
|--------|---------|----------------|
| **figma-console** | Full design creation and editing in Figma — create shapes, text, frames, components, variables, take screenshots, execute code. Also has FigJam tools for diagramming. | UX Designer, Architect, PM |
| **plugin:figma:figma** | Read designs from Figma, generate FigJam diagrams, Code Connect mappings, get design context for implementation | Full-Stack Dev, Architect, PM |

## figma-console Tools

### Design Creation

| Tool | Purpose |
|------|---------|
| `figma_execute(code)` | Run arbitrary Figma plugin API code — create frames, shapes, text, auto-layout, set styles |
| `figma_create_child(parentId, type, props)` | Create a child node (frame, text, rectangle, etc.) inside a parent |
| `figma_clone_node(nodeId)` | Duplicate an existing node |
| `figma_move_node(nodeId, x, y)` | Reposition a node |
| `figma_resize_node(nodeId, width, height)` | Resize a node |
| `figma_set_fills(nodeId, fills)` | Set fill colors on a node |
| `figma_set_strokes(nodeId, strokes)` | Set stroke styles on a node |
| `figma_set_text(nodeId, text)` | Set text content on a text node |
| `figma_set_image_fill(nodeId, imageUrl)` | Set an image as a node's fill |
| `figma_rename_node(nodeId, name)` | Rename a node |
| `figma_delete_node(nodeId)` | Delete a node |

### Components

| Tool | Purpose |
|------|---------|
| `figma_search_components(query)` | Search for existing components by name |
| `figma_instantiate_component(componentId)` | Create an instance of a component |
| `figma_get_component(nodeId)` | Get component details |
| `figma_get_component_details(nodeId)` | Get detailed component info including properties |
| `figma_add_component_property(...)` | Add a property to a component |
| `figma_edit_component_property(...)` | Edit a component property |
| `figma_delete_component_property(...)` | Remove a component property |
| `figma_arrange_component_set(...)` | Auto-arrange a component set grid |

### Design Tokens & Variables

| Tool | Purpose |
|------|---------|
| `figma_setup_design_tokens(...)` | Create a complete token system (collection + modes + variables) atomically |
| `figma_batch_create_variables(...)` | Create up to 100 variables in one call |
| `figma_batch_update_variables(...)` | Update up to 100 variable values in one call |
| `figma_create_variable(...)` | Create a single variable |
| `figma_update_variable(...)` | Update a single variable value |
| `figma_get_variables()` | List all variables |
| `figma_get_token_values(...)` | Get resolved token values |
| `figma_browse_tokens(...)` | Browse the token hierarchy |

### Screenshots & Inspection

| Tool | Purpose |
|------|---------|
| `figma_take_screenshot()` | Capture a screenshot of the current Figma viewport |
| `figma_capture_screenshot(...)` | Capture a specific node or area |
| `figma_get_selection()` | Get the currently selected nodes |
| `figma_get_file_data()` | Get the full file structure |
| `figma_get_styles()` | Get all styles in the file |
| `figma_navigate(nodeId)` | Navigate to and zoom into a specific node |

### File & Page Management

| Tool | Purpose |
|------|---------|
| `figma_list_open_files()` | List currently open Figma files |
| `figma_get_status()` | Check connection status |
| `figma_reconnect()` | Reconnect if the connection drops |

## plugin:figma:figma Tools

### Reading Designs (for implementation)

| Tool | Purpose |
|------|---------|
| `get_design_context(fileKey, nodeId)` | Get code, screenshot, and contextual hints for a design node — primary tool for design-to-code |
| `get_screenshot(fileKey, nodeId)` | Get a screenshot of a specific design node |
| `get_metadata(fileKey)` | Get file metadata (name, pages, components) |
| `get_variable_defs(fileKey)` | Get variable/token definitions from the file |

### Code Connect

| Tool | Purpose |
|------|---------|
| `get_code_connect_map(fileKey)` | Get existing Code Connect mappings between Figma components and code components |
| `get_code_connect_suggestions(fileKey)` | Get suggestions for new Code Connect mappings |
| `add_code_connect_map(...)` | Add a mapping between a Figma component and a Svelte component |
| `send_code_connect_mappings(...)` | Push Code Connect mappings to Figma |

### FigJam (plugin:figma:figma)

| Tool | Purpose |
|------|---------|
| `generate_diagram(...)` | Generate a diagram in FigJam from a text description |
| `get_figjam(fileKey)` | Read contents of a FigJam board |

### FigJam (figma-console)

| Tool | Purpose |
|------|---------|
| `figjam_create_shape_with_text(...)` | Create a shape with text label — building block for diagrams |
| `figjam_create_connector(...)` | Create a connector between two shapes — for data flow and relationships |
| `figjam_create_stickies(...)` | Create multiple sticky notes — for brainstorming and planning |
| `figjam_create_sticky(...)` | Create a single sticky note |
| `figjam_create_table(...)` | Create a table — for structured comparisons and inventories |
| `figjam_create_code_block(...)` | Create a code block — for documenting interfaces and type signatures |
| `figjam_auto_arrange(...)` | Auto-arrange items on the board for clean layout |
| `figjam_get_board_contents(...)` | Read all contents of a FigJam board |
| `figjam_get_connections(...)` | Get all connections between shapes on a board |

## Common Workflows

### UX Designer: Creating a Component Design

1. Check for existing components: `figma_search_components("button")` (nodeIds are session-specific)
2. Check for or create a Section to contain new work:
   ```javascript
   figma_execute(`
     let section = figma.currentPage.findOne(n => n.type === 'SECTION' && n.name === 'CubeHill Components');
     if (!section) {
       section = figma.createSection();
       section.name = 'CubeHill Components';
       section.x = 0;
       section.y = 0;
     }
   `)
   ```
3. Create frames, shapes, text using `figma_execute` or `figma_create_child`
4. Apply auto-layout for responsive behavior
5. **Mandatory**: Run the visual validation workflow (see below)
6. Export screenshot to `designs/` for reference

### UX Designer: Setting Up Design Tokens

Use `figma_setup_design_tokens` to create the full token system in one call, matching the DaisyUI theme variables from `docs/product/theming.md`. For updates, use `figma_batch_update_variables` rather than individual calls — batch operations are 10-50x faster.

### UX Designer: Visual Validation Workflow (Mandatory)

After every design change, run this loop:

1. **Create/modify**: Execute design changes via `figma_execute` or creation tools
2. **Screenshot**: `figma_take_screenshot()` to capture the result
3. **Analyze**: Check alignment, spacing, proportions, visual balance
4. **Iterate**: Fix any issues and repeat (max 3 iterations)
5. **Verify**: Final screenshot to confirm the design is correct

Never skip this workflow. Designs that haven't been visually validated may have invisible layout issues (wrong sizing mode, inconsistent padding, misalignment).

### UX Designer: Exporting to `designs/`

After completing a design in Figma, capture screenshots for the `designs/` folder. These serve as reference artifacts alongside the canonical designs in Figma:

1. Navigate to the target frame: `figma_navigate(nodeId)`
2. Take a screenshot: `figma_take_screenshot()`
3. Save the screenshot to `designs/` with a descriptive name

The `designs/` folder holds Figma screenshot exports and text-based notes. The canonical designs live in Figma.

### Full-Stack Dev: Reading Designs for Implementation

1. Get the design context: `get_design_context(fileKey, nodeId)` — returns code hints, screenshot, and annotations
2. Get a screenshot for visual reference: `get_screenshot(fileKey, nodeId)`
3. Check for design tokens: `get_variable_defs(fileKey)` — map to DaisyUI theme variables
4. Adapt the output to CubeHill's stack (Svelte 5, DaisyUI, Tailwind) — the tool output is a reference, not final code

### Full-Stack Dev: Code Connect Mappings

Map Figma components to their Svelte implementations so future design reads return project-specific code:

1. Check existing mappings: `get_code_connect_map(fileKey)`
2. Get suggestions: `get_code_connect_suggestions(fileKey)`
3. Add mappings: `add_code_connect_map(fileKey, componentId, svelteComponentPath)`

### Software Architect: Architecture Diagrams

FigJam is one option for technical diagrams — not the only one. For simple diagrams, a Mermaid code block in markdown (GitHub renders these natively) or a text-based/ASCII diagram may be faster and easier to maintain. Use FigJam when you need rich visual layout, interactive boards, or diagrams that benefit from spatial arrangement.

1. **Quick diagram from description**: Use `generate_diagram(...)` with a text description of the architecture — good for first drafts
2. **Detailed diagrams**: Use `figjam_create_shape_with_text` for components/modules, `figjam_create_connector` for relationships, `figjam_auto_arrange` to clean up layout
3. **Code blocks for interfaces**: Use `figjam_create_code_block` to show TypeScript interfaces or key type signatures alongside diagrams
4. **Read existing boards**: Use `figjam_get_board_contents` and `figjam_get_connections` to review and extend existing diagrams

Common use cases:
- **Component hierarchy**: Svelte component tree with data flow arrows
- **Cube state data flow**: `number[54]` state array through moves, store, and renderer
- **Three.js rendering pipeline**: Scene setup, animation loop, drift prevention cycle
- **System dependency graph**: Module relationships and import boundaries
- **Technical decision flowcharts**: Decision trees for trade-off analysis

### Product Manager: Planning and User Flow Diagrams

FigJam is one option for planning artifacts — not the only one. For simple flows, a Mermaid code block in markdown (GitHub renders these natively) or a bullet-point description may be faster and easier to maintain. Use FigJam when you need sticky-note brainstorming, spatial arrangement, or rich visual boards.

1. **Quick diagram from description**: Use `generate_diagram(...)` for user flows and workflow visualizations
2. **Sticky note brainstorming**: Use `figjam_create_stickies` for feature brainstorming, priority mapping, and retrospectives
3. **Tables for comparisons**: Use `figjam_create_table` for feature comparison matrices, priority grids, or status boards
4. **Workflow diagrams**: Use `figjam_create_shape_with_text` and `figjam_create_connector` for process flows
5. **Auto-arrange**: Use `figjam_auto_arrange` after building out a board to clean up layout

Common use cases:
- **Feature development loop**: Visual diagram of the 6-stage loop from `docs/process/feature-development.md`
- **User flow diagrams**: How users navigate algorithm browsing, playback, and theme switching
- **Project roadmap boards**: Feature priorities with sticky notes grouped by milestone
- **Team workflow diagrams**: Agent responsibilities and handoff points
- **Brainstorming boards**: Sticky notes for ideation sessions on new features

## Best Practices

- **Pick the right tool for the job.** FigJam is great for complex visual diagrams, spatial layouts, and brainstorming boards. For simple diagrams, use Mermaid code blocks in markdown (GitHub renders these natively) or text-based descriptions — they're easier to maintain and live alongside the docs. Figma is the primary tool for UI/UX design (UX Designer), but for diagrams (Architect, PM) it's one option among several.
- **Always place components in Sections/Frames**, not on blank canvas. Floating components cause layout confusion.
- **Use batch operations for variables/tokens.** `figma_batch_create_variables` and `figma_batch_update_variables` are 10-50x faster than individual calls.
- **Always search for existing components at session start.** NodeIds are session-specific and become stale across conversations. Call `figma_search_components` before referencing any component.
- **Visual validation after every design change.** Follow the create-screenshot-analyze-iterate loop. Max 3 iterations per change.
- **Use `figma_take_screenshot` to export designs** to the `designs/` folder as reference artifacts.
- **Check for existing pages before creating new ones.** Use `figma_execute` to search for a page by name to avoid duplicates.
- **Map design tokens to DaisyUI variables.** CubeHill uses DaisyUI's theme system — Figma tokens should mirror those variables for consistency.

## Gotchas

- **NodeIds are session-specific.** They change between Figma sessions. Never hardcode or reuse nodeIds from a previous session — always re-search at session start.
- **Check for existing pages before creating.** Creating a page without checking first leads to duplicates. Use `figma_execute` with `figma.root.children.find(p => p.name === 'PageName')`.
- **"Hug contents" vs "fill container"** — a common source of lopsided layouts. After creating frames with auto-layout, verify sizing modes in the visual validation step.
- **Floating elements on blank canvas** — always create a Section or Frame first, then append children to it. Components placed directly on the canvas are hard to find and organize.
- **figma-console vs plugin:figma:figma** — use figma-console for creating/editing designs, use plugin:figma:figma for reading designs and Code Connect. They serve different purposes.
