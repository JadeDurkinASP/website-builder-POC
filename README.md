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

## Checks

```bash
npm run lint
npm test
npm run build
```

`npm test` runs focused regression checks for page links, reset/save assumptions, branding sync, migration, import validation and asset remapping.

## Demo walkthrough

1. New projects open the **editor** with an empty page behind a setup modal. Existing projects keep their real pages behind the modal when you reopen setup.
2. Complete the three steps — or use **Load sample event** on the first setup step (clearly fictional content). You can also **Skip setup and start blank**.
3. **Your event:** Choose an event type, name, audience, date/location, and visitor action.
4. **Your content:** Say whether you already have content.
   - **Yes:** upload briefs/speakers/programme notes/logos/photos and optionally paste text. Files stay available for reference while editing; this demo does **not** read them automatically or populate sections from uploads. Optionally ask for missing content-area suggestions.
   - **No:** choose whether you want suggested content areas (placeholders) or a minimal page only.
5. **Your brand:** Add branding (logo, colours, font), choose a design direction (Bold, Minimal or Editorial), and expand **Your suggested homepage** to review essential vs optional sections and why they suit your event type. The live preview shows the proposed outline only. Then click **Create demo homepage**.
6. Recommendations use predefined JavaScript event profiles — they are **not** AI-generated. Nothing is committed until Create/Rebuild (rebuild asks for confirmation).
7. After creation, the modal closes and a compact **Getting started** panel offers first edits (hero, image, mobile). Dismiss it for the current project when you no longer need it. Use **More → Website setup** to reopen setup. Partial answers are kept when you dismiss; rebuilding will not overwrite pages if you cancel.
8. In the **editor**, change text, links, images, button styles and sections. The right inspector groups fields into **Content / Style / Layout**. Open **More → Source content** to copy pasted text or download attachments; pick images from your project library or upload new ones (under 500 KB).
9. Left rail order: **Pages → Elements → Sections → Layers → Brand**. Middle page sections are **Canvas Section** templates. **Sections** includes presets such as two-column introduction, speaker grid, image with caption and call to action. **Elements** insert into the selected compatible section (or offer **Add a blank section**). Containers use flow layout. **Brand** is website-wide branding across every page; element-level colour overrides are preserved. Canvas Undo does not reverse website branding — Save to keep brand changes.
10. Use **Pages** to switch pages, add a blank Header/Hero/Footer page, and rename or delete non-home pages (styled dialogs). Renaming changes the display title only — the slug stays stable so `page:slug` links keep working. Deleting a page removes or clears internal links to it across all pages (including nested canvas elements). The home page cannot be deleted.
11. Click **Save** to store project metadata in local storage and file binaries in IndexedDB. The top bar shows **Unsaved changes**, **Saved locally**, or a save error. Preview and page switching keep edits without requiring Save. A browser leave warning appears only while there are unsaved changes. Import, load sample and similar replace actions ask for confirmation when the project is dirty.
12. Open **Preview** to move between pages (hash routes like `#/speakers`), review the incomplete-content notice if needed, run the demo completeness check, then **Simulate publishing**.
13. Under **More**: **Export project with attachments** is the primary export; **Export JSON only** sits under Advanced export (JSON alone does not transfer uploaded files). **Import project** accepts a bundle or plain JSON (JSON imports that list attachments ask before continuing without files). Missing attachments are reported on export/import rather than silently ignored. **Reset project** uses one confirmation; cancellation leaves storage untouched, and a failed attachment clear does not pretend the reset succeeded.

## Known limitations

- Homepage creation uses predefined layouts and recommendation rules, not AI.
- Uploaded documents are stored for reference only — there is no automatic reading or placement into sections.
- Publishing is simulated only — nothing is deployed.
- Project metadata is stored in this browser’s local storage; file binaries are stored in IndexedDB.
- Images must stay under about 500 KB; documents under 5 MB; about 20 MB total per project.
- JSON export does not include IndexedDB files — use **Export project with attachments** to transfer them.
- Website branding is applied to every page’s root props; canvas Undo only affects the active page’s content history, not website branding.
- This POC does not include authentication, multi-user collaboration, accessibility certification or production hosting.
- Older projects (v1–v3) are migrated safely; a single `puckData` homepage becomes the home entry in `pages` without rebuilding content.
- Multi-page navigation is hash-based in preview only — nothing is deployed to real URLs.
- Free-position editing uses pointer-driven move/resize on Puck slot children. Nested free-position groups inside containers are not supported in this iteration (containers stay flow-based).
- Video elements accept direct browser-playable URLs only — arbitrary embed HTML is not executed.
- Automatic mobile stacking preserves reading order but is not an accessibility guarantee.
- Layers expose lock and display names only — there is no visibility/hide toggle until a real `hidden` prop exists.
- Z-order for free elements still uses `zIndex` plus outline reorder.
- Classic section components (Hero, Speakers, …) remain registered so older saved projects still open; new generation and the Sections catalog use canvas templates instead.

## Stack

- React + Vite (JavaScript)
- `@puckeditor/core` ^0.23 (MIT, free editor — no Puck Cloud or paid AI plugin)
- Browser localStorage + IndexedDB for persistence
