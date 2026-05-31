import { useEffect } from 'react';
import { useHistoryStore } from '@/stores/historyStore';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Copy } from 'lucide-react';
import { logger } from '@/lib/logger';

export function HistoryWindow() {
  const { items, loaded, load, remove, clear } = useHistoryStore();

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      logger.warn('copy link failed', e);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">History</h1>
        {items.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => void clear()}>
            <Trash2 className="mr-1 h-4 w-4" /> Clear all
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          No screenshots yet.
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card"
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt="screenshot"
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center text-xs text-muted-foreground">
                  {item.width}×{item.height}
                </div>
              )}
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="truncate text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <div className="flex gap-1">
                  {item.uploadUrl && (
                    <>
                      <button
                        title="Copy link"
                        onClick={() => void copyLink(item.uploadUrl!)}
                        className="rounded p-1 hover:bg-accent"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a
                        title="Open link"
                        href={item.uploadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1 hover:bg-accent"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  )}
                  <button
                    title="Delete"
                    onClick={() => void remove(item.id)}
                    className="rounded p-1 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
