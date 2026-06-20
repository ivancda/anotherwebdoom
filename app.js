document.getElementById('play-btn').addEventListener('click', () => {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('dos-container').classList.remove('hidden');

  Dos(document.getElementById('dos'), {
    url: './doom.jsdos',
    autoStart: true,
    kiosk: true,
    pathPrefix: './vendor/js-dos/emulators/',
  });
});
