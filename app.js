const SAVE_INTERVAL_MS = 3000;

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

document.getElementById('btn-fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
});

function setupVirtualPad(ci) {
  document.querySelectorAll('#virtual-pad [data-key]').forEach(btn => {
    const key = parseInt(btn.dataset.key, 10);

    if (btn.dataset.toggle) {
      let active = false;
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        active = !active;
        ci.sendKeyEvent(key, active);
        btn.classList.toggle('pad-active', active);
      }, { passive: false });
    } else {
      const press   = e => { e.preventDefault(); ci.sendKeyEvent(key, true); };
      const release = e => { e.preventDefault(); ci.sendKeyEvent(key, false); };
      btn.addEventListener('pointerdown',   press,   { passive: false });
      btn.addEventListener('pointerup',     release, { passive: false });
      btn.addEventListener('pointercancel', release, { passive: false });
      btn.addEventListener('pointerleave',  release, { passive: false });
    }
  });
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
          setupVirtualPad(ci);
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

