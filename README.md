# Family Tree Visualiser

A small web app for turning family-tree data into a clearer, more shareable visual format.

This project started from a request by a relative: the family data existed, but it was hard to understand at a glance. The goal is to make the tree easier to explore on screen, and also possible to export as printable pages that can be arranged together on a wall.

## What It Does

- Loads family-tree data from a JSON file.
- Shows the family tree as an interactive graph.
- Includes bundled example data so the format is easier to understand.
- Keeps uploaded data in the browser session only. The file is not sent to a server.
- Exports the graph layout as A4 landscape PDF pages for printing.
- Supports Estonian and English UI text.

## Tech

- React and TypeScript for the app UI.
- Vite for local development and production builds.
- React Flow for the interactive graph canvas.
- pdf-lib for PDF generation.
- GitHub Pages for static hosting.

The app is intentionally client-side only. There is no backend service and no database.

## Development Note

This project was developed with help from AI coding tools, including Codex, for implementation, refactoring, and UI iteration.

## Data

The app accepts a structured JSON file describing people, families, relationships, dates, and notes. The bundled example file is available in the UI and can be used as a starting point for creating a custom family tree.

## Asset Credits

The icon image files in `public/` were downloaded from [Favicon.io Emoji Favicons](https://favicon.io/emoji-favicons/).
