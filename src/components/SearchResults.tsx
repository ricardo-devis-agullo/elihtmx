import { Html } from "@elysiajs/html";
import { VideoCard } from "./VideoCard";

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

export function SearchResults({ videos, query }: { videos: Video[]; query: string }) {
  if (!query.trim()) {
    return <div />;
  }

  return (
    <div class="py-6 border-b border-zinc-800 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">
          Search results for "<span class="text-amber-400">{query}</span>"
        </h2>
        <button
          class="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          _="on click set <input[name='q']/>.value to '' then trigger input on <input[name='q']/> then set innerHTML of #search-results to ''"
        >
          Clear search
        </button>
      </div>

      {videos.length === 0 ? (
        <div class="text-center py-8">
          <div class="text-4xl mb-2">🔍</div>
          <p class="text-zinc-400">No videos found with tags matching "{query}"</p>
        </div>
      ) : (
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((video) => (
            <VideoCard video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
