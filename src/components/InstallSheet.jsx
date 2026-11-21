import { Share, SquarePlus, MoreVertical, Download } from 'lucide-react';
import Sheet from './Sheet';
import { Button } from './ui';
import { useInstallPrompt } from '../lib/pwa';

function Step({ n, children }) {
  return (
    <li className="flex items-center gap-3 text-sm text-slate-700">
      <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <span className="flex items-center gap-1.5 flex-wrap">{children}</span>
    </li>
  );
}

/** Explique comment installer Kodapay sur l'écran d'accueil, selon l'appareil. */
export default function InstallSheet({ open, onClose }) {
  const { canPrompt, ios, install } = useInstallPrompt();

  const onInstall = async () => {
    await install();
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Installer Kodapay">
      <div className="flex items-center gap-4 mb-5">
        <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-2xl shadow-md" />
        <p className="text-sm text-slate-600">
          Ajoutez Kodapay à votre écran d’accueil : elle s’ouvre en plein écran, comme une vraie application, sans
          passer par un store.
        </p>
      </div>

      {canPrompt ? (
        <Button size="lg" className="w-full" onClick={onInstall}>
          <Download className="w-4 h-4" /> Installer l’application
        </Button>
      ) : ios ? (
        <ol className="space-y-3">
          <Step n={1}>
            Touchez <Share className="w-4 h-4 text-sky-600" aria-label="Partager" /> <strong>Partager</strong> en bas de
            Safari
          </Step>
          <Step n={2}>
            Choisissez <SquarePlus className="w-4 h-4" aria-hidden="true" /> <strong>Sur l’écran d’accueil</strong>
          </Step>
          <Step n={3}>
            Touchez <strong>Ajouter</strong>
          </Step>
        </ol>
      ) : (
        <ol className="space-y-3">
          <Step n={1}>
            Ouvrez le menu <MoreVertical className="w-4 h-4" aria-label="Menu" /> du navigateur
          </Step>
          <Step n={2}>
            Choisissez <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>
          </Step>
        </ol>
      )}
    </Sheet>
  );
}
