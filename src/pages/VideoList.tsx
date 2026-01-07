import { Html } from "@elysiajs/html";
import { TagEditor } from "../components/TagEditor";

interface Tag {
  id: number;
  name: string;
}

interface Video {
  id: number;
  image_id: number;
  filename: string;
  video_number: number;
  created_at: string;
  image_filename: string;
  derivation: string | null;
  tags: Tag[];
}

interface Image {
  id: number;
  filename: string;
  group_name: string;
  derivation: string | null;
  created_at: string;
}

interface Derivation {
  derivation: string | null;
  image_count: number;
  video_count: number;
}

interface Props {
  groupName: string;
  sourceImage: Image;
  images: Image[];
  videos: Video[];
  derivations: Derivation[];
  currentFilter: string;
}

export function VideoList({ groupName, sourceImage, images, videos, derivations, currentFilter }: Props) {
  const totalVideos = derivations.reduce((sum, d) => sum + d.video_count, 0);
  const hasDerivations = derivations.length > 1 || (derivations.length === 1 && derivations[0].derivation !== null);

  return (
    <div class="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header class="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center gap-4">
            <a
              href="/"
              class="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Back to gallery"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 class="text-xl font-bold tracking-tight text-amber-400">{groupName}</h1>
              <p class="text-sm text-zinc-500">
                {totalVideos} video{totalVideos !== 1 ? "s" : ""}
                {hasDerivations && ` · ${images.length} variant${images.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid gap-8">
          {/* Source image preview */}
          <section class="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <h2 class="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Source Image</h2>
            <div class="max-w-md mx-auto">
              <img
                src={`/media/${sourceImage.filename}`}
                alt={groupName}
                class="w-full rounded-xl shadow-2xl"
              />
            </div>
          </section>

          {/* Derivation filter tabs */}
          {hasDerivations && (
            <section class="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
              <div class="flex flex-wrap gap-2">
                <FilterTab 
                  groupName={groupName}
                  value="all" 
                  label="All" 
                  count={totalVideos}
                  active={currentFilter === "all"}
                />
                {derivations.map((d) => (
                  <FilterTab
                    groupName={groupName}
                    value={d.derivation === null ? "source" : d.derivation}
                    label={d.derivation === null ? "Source" : `_${d.derivation}`}
                    count={d.video_count}
                    active={currentFilter === (d.derivation === null ? "source" : d.derivation)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Videos */}
          <section>
            <h2 class="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Generated Videos</h2>
            <div id="video-list" class="grid gap-6">
              {videos.length === 0 ? (
                <div class="text-center py-12">
                  <div class="text-4xl mb-2">🎬</div>
                  <p class="text-zinc-400">No videos in this selection</p>
                </div>
              ) : (
                videos.map((video) => (
                  <VideoCard video={video} groupName={groupName} />
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function FilterTab({ groupName, value, label, count, active }: { 
  groupName: string;
  value: string; 
  label: string; 
  count: number;
  active: boolean;
}) {
  const baseClasses = "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2";
  const activeClasses = active 
    ? "bg-amber-500 text-black" 
    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700";

  return (
    <button
      class={`${baseClasses} ${activeClasses}`}
      hx-get={`/api/group/${encodeURIComponent(groupName)}/videos?derivation=${value}`}
      hx-target="#video-list"
      hx-swap="innerHTML"
      hx-push-url={`/group/${encodeURIComponent(groupName)}?derivation=${value}`}
    >
      {label}
      <span class={active ? "bg-black/20 px-1.5 py-0.5 rounded text-xs" : "bg-zinc-700 px-1.5 py-0.5 rounded text-xs"}>
        {count}
      </span>
    </button>
  );
}

function VideoCard({ video, groupName }: { video: Video; groupName: string }) {
  const baseName = video.filename.replace(/\.mp4$/i, "");

  return (
    <div class="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
      <div class="grid md:grid-cols-2 gap-6 p-6">
        {/* Video player */}
        <div class="relative">
          <video
            src={`/media/${video.filename}`}
            class="w-full rounded-xl bg-black"
            controls
            preload="metadata"
            loop
          />
          {/* Play in MPV button */}
          <button
            class="absolute top-3 right-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg"
            hx-get={`/api/play/${video.id}`}
            hx-swap="none"
            title="Open in MPV (loop)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            MPV
          </button>
          {/* Derivation badge */}
          {video.derivation && (
            <span class="absolute top-3 left-3 px-2 py-1 bg-zinc-900/80 text-zinc-300 rounded text-xs font-medium">
              _{video.derivation}
            </span>
          )}
        </div>

        {/* Video info & tags */}
        <div class="flex flex-col">
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-1">{baseName}</h3>
            <p class="text-sm text-zinc-500">{video.filename}</p>
          </div>

          {/* Tag editor */}
          <div class="flex-1">
            <TagEditor videoId={video.id} tags={video.tags} />
          </div>
        </div>
      </div>
    </div>
  );
}
