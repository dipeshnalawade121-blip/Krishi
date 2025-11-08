import { initGlass } from './glass.js';
import { initUI } from './ui.js';

window.addEventListener('load', async () => {
  // Start subtle glass animation first (behind everything)
  await initGlass();
  // Then boot your existing UI logic
  await initUI();
});
