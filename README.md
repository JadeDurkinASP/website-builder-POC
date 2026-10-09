# Composer Rapid

A standalone proof of concept for an event website builder, using the free open-source [Puck](https://puckeditor.com/) visual editor.

Composer Rapid opens the visual editor as the workspace, with a three-step **Website setup** modal for new projects. It recommends a homepage structure from explicit event-profile rules, lets you attach source files locally, edit the page visually, preview the result, and save the project in your browser. Generation and publishing are simulated and clearly labelled. No API keys, authentication, database or live deployment are required.

## Requirements

- Node.js 20+ recommended
- A modern desktop browser

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Demo walkthrough

1. New projects open the **editor** with an empty page behind a setup modal. Existing projects keep their real pages behind the modal when you reopen setup.
2. Complete the three steps — or use **Load sample event** on the first setup step (clearly fictional content). You can also **Skip setup and start blank**.
3. **Your event:** Choose an event type, name, audience, date/location, and visitor action.
4. **Your content:** Say whether you already have content.
   - **Yes:** upload briefs/speakers/programme notes/logos/photos and optionally paste text. Files stay attached for the editor; this demo does **not** automatically extract document content. Optionally ask for missing content-area suggestions.
   - **No:** choose whether you want suggested content areas (placeholders) or a minimal page only.
5. **Your brand:** Add branding (logo, colours, font), choose a design direction (Bold, Minimal or Editorial), and expand **Your suggested homepage** to include/exclude sections. Then click **Create demo homepage**.
6. Recommendations use predefined JavaScript event profiles — they are **not** AI-generated. The right-hand live preview shows the proposed layout only; nothing is committed until Create/Rebuild.
7. After creation, the modal closes and a brief message confirms the starting page is ready. Use **More → Website setup** in the editor top bar to reopen the modal. Partial answers are kept when you dismiss; rebuilding an existing site asks for confirmation and will not overwrite pages if you cancel.
8. In the **editor**, change text, links, images, button styles and sections. The right inspector groups fields into **Content / Style / Layout**. Open **More → Source content** to copy pasted text or download attachments; pick images from your project library or upload new ones (under 500 KB).
9. Left rail order: **Pages → Elements → Sections → Layers → Brand**. After setup, middle page sections (Hero, Speakers, etc.) are **Canvas Section** templates — edit them like the free/flow canvas. Use **Sections** to add more canvas templates; use **Elements** inside any section (click Add or drag). **Header** and **Footer** stay structured. **Layers** selects and renames; **Brand** edits global colours, font and design style.
10. Use **Pages** to switch pages, add a blank Header/Hero/Footer page, and rename or delete non-home pages (row menu). The top bar page selector also switches pages. New pages are linked from the home Header as `page:slug` links.
11. Click **Save** to store project metadata in local storage and file binaries in IndexedDB. The top bar shows **Saved locally** / **Unsaved changes**.
12. Open **Preview** to move between pages (hash routes like `#/speakers`), review the incomplete-content notice if needed, run the demo completeness check, then **Simulate publishing**.
13. Under **More**: export/import JSON or project bundles, load the sample event, or reset. JSON export does not include IndexedDB files — use a project bundle to transfer attachments.

## Known limitations

- Homepage creation uses predefined layouts and recommendation rules, not AI.
- Uploaded documents are stored for reference only — there is no automatic reading or placement into sections.
- Publishing is simulated only — nothing is deployed.
- Project metadata is stored in this browser’s local storage; file binaries are stored in IndexedDB.
- Images must stay under about 500 KB; documents under 5 MB; about 20 MB total per project.
- JSON export does not include IndexedDB files — use a project bundle to transfer attachments.
- This POC does not include authentication, multi-user collaboration, accessibility certification or production hosting.
- Older projects (v1–v3) are migrated safely; a single `puckData` homepage becomes the home entry in `pages` without rebuilding content.
- Multi-page navigation is hash-based in preview only — nothing is deployed to real URLs.
- Free-position editing uses pointer-driven move/resize on Puck slot children (Interact.js was evaluated but blocked by Puck’s iframe overlay event handling). Nested free-position groups inside containers are not supported in this iteration (containers stay flow-based).
- Video elements accept direct browser-playable URLs only — arbitrary embed HTML is not executed.
- Automatic mobile stacking preserves reading order but is not an accessibility guarantee.
- Layers expose lock and display names only — there is no visibility/hide toggle until a real `hidden` prop exists.
- Z-order for free elements still uses `zIndex` plus outline reorder.
- Classic section components (Hero, Speakers, …) remain registered so older saved projects still open; new generation and the Sections catalog use canvas templates instead.

## Stack

- React + Vite (JavaScript)
- `@puckeditor/core` ^0.23 (MIT, free editor — no Puck Cloud or paid AI plugin)
- Browser localStorage + IndexedDB for persistence
