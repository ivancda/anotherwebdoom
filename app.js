const SAVE_INTERVAL_MS = 3000;

if (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) {
  document.body.classList.add('touch-device');
}

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
  // D-pad: suporte a deslizar o dedo entre direcionais
  const dpad = document.getElementById('dpad');
  let dpadKey = null;
  let dpadBtn = null;

  function activateDpadBtn(btn) {
    const key = parseInt(btn.dataset.key, 10);
    if (key === dpadKey) return;
    if (dpadKey !== null) {
      ci.sendKeyEvent(dpadKey, false);
      dpadBtn.classList.remove('pad-active');
    }
    dpadKey = key;
    dpadBtn = btn;
    ci.sendKeyEvent(key, true);
    btn.classList.add('pad-active');
  }

  function releaseDpad() {
    if (dpadKey !== null) {
      ci.sendKeyEvent(dpadKey, false);
      dpadBtn.classList.remove('pad-active');
      dpadKey = null;
      dpadBtn = null;
    }
  }

  dpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    dpad.setPointerCapture(e.pointerId);
    const btn = e.target.closest('[data-key]');
    if (btn) activateDpadBtn(btn);
  }, { passive: false });

  dpad.addEventListener('pointermove', e => {
    if (!dpad.hasPointerCapture(e.pointerId)) return;
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const btn = el && el.closest('#dpad [data-key]');
    if (btn) {
      activateDpadBtn(btn);
    } else {
      releaseDpad();
    }
  }, { passive: false });

  dpad.addEventListener('pointerup',     e => { e.preventDefault(); releaseDpad(); }, { passive: false });
  dpad.addEventListener('pointercancel', () => releaseDpad());

  // Botões de ação: comportamento normal
  document.querySelectorAll('#action-btns [data-key]').forEach(btn => {
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

