import { createIonosphere } from '../dist/index.js';

window.addEventListener('DOMContentLoaded', () => {
    const ionosphere = createIonosphere('canvas', {
        repaint: 'rgba(0, 0, 0, 1)',
        trailMaxLength: 30,
        trailOpacity: 0.6,
    });

    ionosphere.start();

    // Start/Stop buttons
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    startBtn.addEventListener('click', () => {
        ionosphere.start();
    });

    stopBtn.addEventListener('click', () => {
        ionosphere.stop();
    });

    // Apply config changes
    const applyBtn = document.getElementById('applyBtn');
    applyBtn.addEventListener('click', () => {
        const config = {
            repaint: document.getElementById('repaint').value,
            trailMaxLength: parseInt(document.getElementById('trailLength').value),
            trailOpacity: parseFloat(document.getElementById('trailOpacity').value),
            repulsion: parseFloat(document.getElementById('repulsion').value),
            attraction: parseFloat(document.getElementById('attraction').value),
            particleDensity: parseFloat(document.getElementById('density').value),
        };
        ionosphere.updateConfig(config);
    });
});