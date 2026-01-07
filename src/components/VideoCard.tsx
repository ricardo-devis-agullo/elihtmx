import { Html } from "@elysiajs/html";

interface Tag {
  id: number;
  name: string;
}

interface Video {
  id: number;
  image_id: number;
  filename: string;
  video_number: number;
  image_filename: string;
  group_name: string;
  derivation?: string | null;
  tags?: Tag[];
}

export function VideoCard({ video }: { video: Video }) {
  const baseName = video.filename.replace(/\.mp4$/i, "");

  return (
    <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors">
      <div class="aspect-video relative">
        <video
          src={`/media/${video.filename}`}
          class="w-full h-full object-cover"
          preload="metadata"
          muted
          _="on mouseenter play() on mouseleave pause() then set my.currentTime to 0"
        />
        {/* Overlay with play button */}
        <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button
            class="p-3 bg-amber-500 hover:bg-amber-400 rounded-full text-black transition-colors shadow-lg"
            hx-get={`/api/play/${video.id}`}
            hx-swap="none"
            title="Open in MPV"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        {/* Derivation badge */}
        {video.derivation && (
          <span class="absolute top-2 left-2 px-2 py-1 bg-zinc-900/80 text-zinc-300 rounded text-xs font-medium">
            _{video.derivation}
          </span>
        )}
      </div>
      <div class="p-3">
        <a
          href={`/group/${encodeURIComponent(video.group_name)}`}
          class="text-sm font-medium hover:text-amber-400 transition-colors truncate block"
        >
          {baseName}
        </a>
        {video.tags && video.tags.length > 0 && (
          <div class="flex flex-wrap gap-1 mt-2">
            {video.tags.slice(0, 3).map((tag) => (
              <span class="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                {tag.name}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span class="px-1.5 py-0.5 text-zinc-500 text-xs">
                +{video.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
