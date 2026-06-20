const SAVE_KEY = 'doom_fs_changes';
const SAVE_INTERVAL_MS = 10000;

function loadChangesFromStorage() {
  const b64 = localStorage.getItem(SAVE_KEY);
  if (!b64) return null;
  try {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function saveChangesToStorage(ci) {
  const changes = await ci.persist();
  if (!changes) return;
  const b64 = btoa(String.fromCharCode(...changes));
  localStorage.setItem(SAVE_KEY, b64);
}

document.getElementById('play-btn').addEventListener('click', () => {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('dos-container').classList.remove('hidden');

  const savedChanges = loadChangesFromStorage();

  Dos(document.getElementById('dos'), {
    url: './doom.jsdos',
    autoStart: true,
    kiosk: true,
    pathPrefix: './vendor/js-dos/emulators/',
    initFs: savedChanges ?? undefined,
    onEvent: (event, ci) => {
      if (event === 'ci-ready') {
        // auto-save periódico
        const interval = setInterval(() => saveChangesToStorage(ci), SAVE_INTERVAL_MS);
        // salva também ao fechar/recarregar a página
        ci.events().onUnload(async () => {
          clearInterval(interval);
          await saveChangesToStorage(ci);
        });
      }
    },
  });
});

