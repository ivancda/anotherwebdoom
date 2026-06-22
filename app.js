const SAVE_INTERVAL_MS = 10000;

function getSaveKey(gameId) {
  return `doom_fs_${gameId}`;
}

function loadChangesFromStorage(gameId) {
  const b64 = localStorage.getItem(getSaveKey(gameId));
  if (!b64) return null;
  try {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function saveChangesToStorage(ci, gameId) {
  const changes = await ci.persist();
  if (!changes) return;
  const b64 = btoa(String.fromCharCode(...changes));
  localStorage.setItem(getSaveKey(gameId), b64);
}

document.querySelectorAll('.play-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.game-card');
    const bundle = card.dataset.bundle;
    const gameId = card.dataset.id;

    document.getElementById('splash').classList.add('hidden');
    document.getElementById('dos-container').classList.remove('hidden');

    const savedChanges = loadChangesFromStorage(gameId);

    Dos(document.getElementById('dos'), {
      url: `./${bundle}`,
      autoStart: true,
      kiosk: true,
      pathPrefix: './vendor/js-dos/emulators/',
      initFs: savedChanges ?? undefined,
      onEvent: (event, ci) => {
        if (event === 'ci-ready') {
          const interval = setInterval(() => saveChangesToStorage(ci, gameId), SAVE_INTERVAL_MS);
          ci.events().onUnload(async () => {
            clearInterval(interval);
            await saveChangesToStorage(ci, gameId);
          });
        }
      },
    });
  });
});

