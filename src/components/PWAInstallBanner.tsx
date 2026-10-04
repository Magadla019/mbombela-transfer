import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let pendingInstall: InstallEvent | null = null;
export function requestAppInstall() {
  if (pendingInstall) return pendingInstall.prompt().then(() => pendingInstall?.userChoice).then(() => { pendingInstall = null; });
  return Promise.reject(new Error('Install is available in your browser menu. On iPhone, tap Share then Add to Home Screen.'));
}
export function PWAInstallBanner() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDismissed(localStorage.getItem('mb_install_dismissed') === 'true');
    const onPrompt = (event: Event) => { event.preventDefault(); pendingInstall = event as InstallEvent; setInstall(event as InstallEvent); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  if (!install || dismissed) return null;
  return <aside role="dialog" aria-label="Install Mbombela Transfer" className="fixed bottom-5 left-5 right-5 z-[1600] mx-auto max-w-sm border border-border bg-card p-5 shadow-xl">
    <div className="flex items-start justify-between gap-4"><div><b>Install Mbombela Transfer App</b><p className="mt-1 text-sm text-muted-foreground">Open it faster from your home screen.</p></div><Button variant="ghost" size="icon" aria-label="Dismiss install" onClick={() => { localStorage.setItem('mb_install_dismissed', 'true'); setDismissed(true); }}><X size={18}/></Button></div>
    <Button className="red-gradient mt-4 w-full" onClick={() => { void requestAppInstall().finally(() => setInstall(null)); }}><Download size={18}/> Install</Button>
  </aside>;
}
