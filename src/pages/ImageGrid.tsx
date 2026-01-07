import { Html } from "@elysiajs/html";

interface ImageGroup {
  group_name: string;
  filename: string;
  total_videos: number;
  derivation_count: number;
}

export function ImageGrid({ groups }: { groups: ImageGroup[] }) {
  return (
    <div class="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header with search */}
      <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between gap-4">
            <h1 class="text-2xl font-bold tracking-tight text-amber-400">
              TaggAI
            </h1>
            
            {/* Search bar */}
            <div class="flex-1 max-w-xl">
              <div class="relative">
                <input
                  type="text"
                  name="q"
                  placeholder="Search by tags..."
                  class="w-full px-4 py-2.5 pl-10 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  hx-get="/api/search"
                  hx-trigger="input changed delay:300ms, search"
                  hx-target="#search-results"
                  autocomplete="off"
                />
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Sync button */}
            <button
              class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              hx-post="/api/sync"
              hx-swap="none"
              _="on htmx:afterRequest call window.location.reload()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync
            </button>
          </div>
        </div>
      </header>

      {/* Search results (hidden by default) */}
      <div id="search-results" class="max-w-7xl mx-auto px-4"></div>

      {/* Image grid */}
      <main id="image-grid" class="max-w-7xl mx-auto px-4 py-8">
        {groups.length === 0 ? (
          <div class="text-center py-20">
            <div class="text-6xl mb-4">📁</div>
            <h2 class="text-xl font-semibold text-zinc-400 mb-2">No images found</h2>
            <p class="text-zinc-500 mb-6">Click "Sync" to scan your media folder</p>
          </div>
        ) : (
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {groups.map((group) => (
              <a
                href={`/group/${encodeURIComponent(group.group_name)}`}
                class="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10"
              >
                <img
                  src={`/media/${group.filename}`}
                  alt={group.group_name}
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div class="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <p class="text-sm font-medium truncate">{group.group_name}</p>
                  <p class="text-xs text-zinc-400">
                    {group.total_videos} video{group.total_videos !== 1 ? "s" : ""}
                    {group.derivation_count > 0 && ` · ${group.derivation_count + 1} variants`}
                  </p>
                </div>
                {/* Video count badge */}
                <div class="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-full text-xs font-medium">
                  {group.total_videos}
                </div>
                {/* Derivation indicator */}
                {group.derivation_count > 0 && (
                  <div class="absolute top-2 left-2 px-2 py-1 bg-amber-500/80 text-black rounded-full text-xs font-medium">
                    +{group.derivation_count}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
