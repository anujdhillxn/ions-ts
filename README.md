# ions-ts

A vanilla TypeScript library that creates an interactive particle animation system with magnetic-like behavior.

## Installation

```bash
npm install ions-ts
```

## Usage

```typescript
import { createIonosphere } from 'ions-ts';

const ionosphere = createIonosphere('canvas', {
    repaint: 'rgba(0, 0, 0, 1)',
    trailMaxLength: 30,
    trailOpacity: 0.6,
});

// Start the animation
ionosphere.start();

// Stop the animation
ionosphere.stop();

// Update configuration dynamically
ionosphere.updateConfig({
    trailMaxLength: 50,
    repulsion: 0.1,
    attraction: 0.05,
});
```

## API

### `createIonosphere(canvasId, config?)`

Creates an ionosphere particle system on the specified canvas.

**Parameters:**
- `canvasId` (string): The HTML id of the canvas element
- `config` (Partial<ParticleConfig>): Optional configuration overrides

**Returns:** Object with methods:
- `start()`: Start the animation
- `stop()`: Stop the animation
- `updateConfig(config)`: Update configuration dynamically

## Configuration Options

### Particle Spawning
- `particleDensity` (number): Particles per pixel squared. Default: `0.00002`
- `minParticles` (number): Minimum number of particles. Default: `20`
- `maxParticles` (number): Maximum number of particles. Default: `500`
- `spawnInterval` (number): Frames between particle spawns. Default: `1`

### Physics
- `speedRange` ([number, number]): Initial speed range [min, max]. Default: `[0.5, 1]`
- `maxSpeed` (number): Maximum particle speed. Default: `2`
- `damping` (number): Velocity damping factor per frame. Default: `0.00001`

### Lifecycle
- `sizeRange` ([number, number]): Initial particle size range [min, max]. Default: `[4, 5]`
- `growthRate` (number): Size increase per frame during growth. Default: `0.01`
- `shrinkRate` (number): Size decrease per frame during shrinking. Default: `0.005`

### Colors
- `satRange` ([number, number]): Saturation range for HSL colors [min, max]. Default: `[70, 100]`

### Boundaries
- `boundaryMargin` (number): Pixels from edge to start bouncing. Default: `0`
- `bounceRetention` (number): Velocity retention on bounce (0-1). Default: `0.8`

### Cursor Interaction
- `cursorAvoidRadius` (number): Radius around cursor to avoid (pixels). Default: `100`
- `cursorAvoidForce` (number): Force applied when avoiding cursor. Default: `10`

### Particle Interactions
- `interactionRadius` (number): Interaction radius between particles (pixels). Default: `60`
- `repulsion` (number): Repulsion force for similar colored particles. Default: `0.05`
- `attraction` (number): Attraction force for different colored particles. Default: `0.05`

### Trails
- `trailOpacity` (number): Opacity of particle trails (0-1). Default: `0.4`
- `trailMaxLength` (number): Maximum number of trail positions to store. Default: `30`

### Visual Effects
- `pulseSpeed` (number): Speed of particle pulsing animation. Default: `0.03`
- `pulseAmplitude` (number): Amplitude of particle pulsing (0-1). Default: `0.1`
- `glowIntensityRange` ([number, number]): Glow intensity range [min, max]. Default: `[0.6, 1.0]`
- `opacityBody` (number): Opacity of particle body (0-1). Default: `1`
- `opacityCore` (number): Opacity of particle core (0-1). Default: `0.7`

### Connections
- `connectionMaxDistanceRatio` (number): Ratio of canvas diagonal for max connection distance. Default: `0.3`
- `connectionMaxDistanceLimit` (number): Absolute max distance limit for connections (pixels). Default: `200`
- `connectionOpacity` (number): Base opacity for connections (0-1). Default: `0.6`
- `connectionPulseSpeed` (number): Speed of connection pulsing animation. Default: `0.05`
- `connectionPulseAmplitude` (number): Amplitude of connection pulsing (0-1). Default: `0.3`
- `connectionLineWidth` (number): Line width for connections. Default: `0.5`
- `connectionGlowWidth` (number): Glow width for connections. Default: `0.5`
- `connectionGlowOpacity` (number): Glow opacity for connections (0-1). Default: `0.3`

### Canvas Clearing
- `repaint` (string): Background repaint color (any valid CSS color string). Default: `'#000'`

## Development

Run the test server:

```bash
npm run dev:vanillajs
```

Then visit `http://localhost:3000/test/test.html`

## License

MIT
