# TaggAI - Video Manager

Desktop web app for managing AI-generated videos from source images, with tagging, search, and support for image derivations.

## Tech Stack

- **Runtime**: Bun
- **Backend**: Elysia.js (TypeScript)
- **Frontend**: HTMX + Hyperscript (no JS framework)
- **Database**: SQLite via `bun:sqlite`
- **Styling**: Tailwind CSS v4

## Project Structure

```
src/
├── index.tsx           # App entry, Elysia setup
├── server.ts           # Config (port, isDev)
├── BaseHtml.tsx        # HTML shell template
├── styles.css          # Tailwind source
├── db/
│   └── index.ts        # SQLite schema + queries
├── scripts/
│   └── sync.ts         # Media folder scanner
├── routes/
│   └── media.tsx       # All API & page routes
├── pages/
│   ├── ImageGrid.tsx   # Home: grouped image grid + search
│   └── VideoList.tsx   # Detail: videos with derivation filter
├── components/
│   ├── TagEditor.tsx   # Tag add/remove UI
│   ├── VideoCard.tsx   # Video card (search results)
│   └── SearchResults.tsx
```

## Database Schema

```sql
-- Source images (jpg files) with group and derivation info
images (
  id INTEGER PRIMARY KEY,
  filename TEXT UNIQUE,      -- "name.jpg" or "name_a.jpg"
  group_name TEXT,           -- "name" (base name without _a/_b suffix)
  derivation TEXT,           -- null for source, "a"/"b"/etc for derived
  created_at TEXT
)

-- Generated videos linked to images
videos (id, image_id FK, filename UNIQUE, video_number, created_at)

-- Tag names
tags (id, name UNIQUE)

-- Many-to-many: videos <-> tags
video_tags (video_id, tag_id) PRIMARY KEY
```

**Key queries in `src/db/index.ts`:**

- `queries.getAllGroups` - List unique groups with video counts
- `queries.getImagesByGroup` - All images in a group (source + derivations)
- `queries.getVideosByGroup` - All videos in a group
- `queries.getVideosByDerivation` - Videos filtered by derivation
- `queries.getDerivationsForGroup` - List derivations for filter tabs
- `queries.searchVideosByTags` - Search videos by tag (LIKE)

## Media Folder Structure

All media lives in a single flat folder (default: `./media`).

```
media/
├── landscape.jpg        # Source image (group: "landscape")
├── landscape-1.mp4      # Video 1 from source
├── landscape-2.mp4      # Video 2 from source
├── landscape_a.jpg      # Derivation "a" (group: "landscape")
├── landscape_a-1.mp4    # Video 1 from derivation a
├── landscape_b.jpg      # Derivation "b" (group: "landscape")
├── landscape_b-1.mp4    # Video 1 from derivation b
├── portrait.jpg         # Different group (group: "portrait")
└── portrait-1.mp4
```

**Naming convention:**

- Source images: `{name}.jpg`
- Derived images: `{name}_{letter}.jpg` (a-z)
- Videos: `{basename}-{N}.mp4` where N = 1, 2, 3...

The sync script parses filenames to:

1. Extract `group_name` (base name without `_a`, `_b` suffix)
2. Extract `derivation` (null for source, letter for derived)
3. Link videos to their source image

## UI Features

**Home Page (`/`):**

- Shows image groups (not individual images)
- Badge shows total videos across all derivations
- Badge shows number of variants if derivations exist

**Group Detail (`/group/:name`):**

- Shows source image
- Filter tabs: "All", "Source", "\_a", "\_b", etc.
- Videos filtered by derivation or show all
- Each video has MPV button and tag editor

**Search:**

- Real-time search by tags
- Results show video cards with derivation badges

## API Endpoints

| Method | Path                                  | Description                               |
| ------ | ------------------------------------- | ----------------------------------------- |
| GET    | `/`                                   | Home page (grouped images)                |
| GET    | `/group/:name`                        | Group detail with videos                  |
| GET    | `/group/:name?derivation=`            | Filter by derivation (all/source/a/b/...) |
| GET    | `/api/group/:name/videos?derivation=` | Videos partial (HTMX)                     |
| POST   | `/api/sync`                           | Scan media folder, populate DB            |
| GET    | `/api/play/:id`                       | Open video in MPV (`--loop=inf`)          |
| GET    | `/api/tags`                           | List all tags                             |
| GET    | `/api/tags/suggest?q=`                | Tag autocomplete                          |
| GET    | `/api/search?q=`                      | Search videos by tag                      |
| POST   | `/api/videos/:id/tags`                | Add tag (body: `{tag: "name"}`)           |
| DELETE | `/api/videos/:id/tags/:tagId`         | Remove tag                                |
| GET    | `/media/:filename`                    | Serve media files                         |

## Configuration

Environment variables:

| Var          | Default       | Description          |
| ------------ | ------------- | -------------------- |
| `MEDIA_PATH` | `./media`     | Path to media folder |
| `DB_PATH`    | `./taggai.db` | SQLite database file |
| `PORT`       | `3000`        | Server port          |

## Development

```bash
# Install dependencies
bun install

# Start dev server (hot reload + tailwind watch)
bun run dev

# Or just the server
bun run dev:server

# Rebuild Tailwind CSS
bun run tw

# Sync media folder manually
bun run sync
```

## Key Files to Modify

**Adding new routes:**
Edit `src/routes/media.tsx` - all routes are defined there.

**Changing database schema:**
Edit `src/db/index.ts` - schema is in the `db.exec()` call at top, queries below.

**Modifying UI:**

- Home page: `src/pages/ImageGrid.tsx`
- Video detail: `src/pages/VideoList.tsx`
- Tag editor: `src/components/TagEditor.tsx`

**Changing naming convention / sync logic:**
Edit `src/scripts/sync.ts`:

- `parseImageFilename()` - handles `name.jpg` and `name_a.jpg` patterns
- `parseVideoFilename()` - handles `name-N.mp4` pattern

## HTMX Patterns Used

- `hx-get/hx-post` for AJAX requests
- `hx-target` to specify where response goes
- `hx-trigger="input changed delay:300ms"` for debounced search
- `hx-swap="outerHTML"` / `hx-swap="innerHTML"` for partial updates
- `hx-push-url` for updating URL on filter change

**Hyperscript (\_= attribute):**

- `on click call window.location.reload()` - page refresh
- `on click set #element.value to 'x'` - DOM manipulation
- `on mouseenter play()` - video hover preview

## Notes

- No authentication (desktop-only app)
- MPV must be installed for video playback button
- Sync is idempotent (uses INSERT OR IGNORE)
- Tags are case-insensitive (lowercased on save)
- Groups aggregate source + all derivations
- URL updates when filtering by derivation (shareable)
