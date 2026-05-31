import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ImageFormat, Theme, UploadProvider } from '@/types';

export function SettingsWindow() {
  const s = useSettingsStore();

  useEffect(() => {
    if (!s.loaded) void s.load();
  }, [s]);

  return (
    <div className="mx-auto h-screen max-w-2xl overflow-auto bg-background p-6">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>

      <Section title="Shortcuts">
        <Field label="Capture region">
          <Input
            value={s.shortcuts.captureRegion}
            onChange={(e) =>
              void s.update({ shortcuts: { ...s.shortcuts, captureRegion: e.target.value } })
            }
          />
        </Field>
        <Field label="Capture fullscreen">
          <Input
            value={s.shortcuts.captureFullscreen}
            onChange={(e) =>
              void s.update({ shortcuts: { ...s.shortcuts, captureFullscreen: e.target.value } })
            }
          />
        </Field>
      </Section>

      <Section title="Capture">
        <Field label="Image format">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={s.imageFormat}
            onChange={(e) => void s.update({ imageFormat: e.target.value as ImageFormat })}
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </Field>
        <Field label="Copy to clipboard after capture">
          <input
            type="checkbox"
            checked={s.copyToClipboardAfterCapture}
            onChange={(e) => void s.update({ copyToClipboardAfterCapture: e.target.checked })}
          />
        </Field>
        <Field label="Save directory">
          <Input
            placeholder="Default app data dir"
            value={s.saveDirectory}
            onChange={(e) => void s.update({ saveDirectory: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Upload">
        <Field label="Auto-upload after capture">
          <input
            type="checkbox"
            checked={s.autoUpload}
            onChange={(e) => void s.update({ autoUpload: e.target.checked })}
          />
        </Field>
        <Field label="Provider">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={s.uploadProvider}
            onChange={(e) => void s.update({ uploadProvider: e.target.value as UploadProvider })}
          >
            <option value="custom">Custom</option>
            <option value="s3">S3</option>
            <option value="imgbb">ImgBB</option>
          </select>
        </Field>
        <Field label="Endpoint URL">
          <Input
            placeholder="https://api.example.com/upload"
            value={s.uploadEndpoint}
            onChange={(e) => void s.update({ uploadEndpoint: e.target.value })}
          />
        </Field>
        <Field label="API key">
          <Input
            type="password"
            placeholder="optional"
            value={s.apiKey ?? ''}
            onChange={(e) => void s.update({ apiKey: e.target.value || null })}
          />
        </Field>
      </Section>

      <Section title="Appearance">
        <Field label="Theme">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={s.theme}
            onChange={(e) => void s.update({ theme: e.target.value as Theme })}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <Field label="Launch on startup">
          <input
            type="checkbox"
            checked={s.launchOnStartup}
            onChange={(e) => void s.update({ launchOnStartup: e.target.checked })}
          />
        </Field>
      </Section>

      <div className="mt-6">
        <Button variant="secondary" onClick={() => void s.load()}>
          Reload
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm">{label}</label>
      <div className="w-64">{children}</div>
    </div>
  );
}
