export interface ParticleConfig {
    // ===== Particle Spawning =====

    /** Particles per pixel squared. Default: 0.00002 */
    particleDensity: number;

    /** Minimum number of particles. Default: 20 */
    minParticles: number;

    /** Maximum number of particles. Default: 500 */
    maxParticles: number;

    /** Frames between particle spawns. Default: 1 */
    spawnInterval: number;

    // ===== Physics =====

    /** Initial speed range [min, max]. Default: [0.5, 1] */
    speedRange: [number, number];

    /** Maximum particle speed. Default: 2 */
    maxSpeed: number;

    /** Velocity damping factor per frame. Default: 0.00001 */
    damping: number;

    // ===== Lifecycle =====

    /** Initial particle size range [min, max]. Default: [4, 5] */
    sizeRange: [number, number];

    /** Size increase per frame during growth. Default: 0.01 */
    growthRate: number;

    /** Size decrease per frame during shrinking. Default: 0.005 */
    shrinkRate: number;

    // ===== Colors =====

    /** Saturation range for HSL colors [min, max]. Default: [70, 100] */
    satRange: [number, number];

    // ===== Boundaries =====

    /** Pixels from edge to start bouncing. Default: 0 */
    boundaryMargin: number;

    /** Velocity retention on bounce (0-1). Default: 0.8 */
    bounceRetention: number;

    // ===== Cursor Interaction =====

    /** Radius around cursor to avoid (pixels). Default: 100 */
    cursorAvoidRadius: number;

    /** Force applied when avoiding cursor. Default: 10 */
    cursorAvoidForce: number;

    // ===== Particle Interactions =====

    /** Interaction radius between particles (pixels). Default: 60 */
    interactionRadius: number;

    /** Repulsion force for similar colored particles. Default: 0.05 */
    repulsion: number;

    /** Attraction force for different colored particles. Default: 0.05 */
    attraction: number;

    // ===== Trails =====

    /** Opacity of particle trails (0-1). Default: 0.4 */
    trailOpacity: number;

    /** Maximum number of trail positions to store. Default: 30 */
    trailMaxLength: number;

    // ===== Visual Effects =====

    /** Speed of particle pulsing animation. Default: 0.03 */
    pulseSpeed: number;

    /** Amplitude of particle pulsing (0-1). Default: 0.1 */
    pulseAmplitude: number;

    /** Glow intensity range [min, max]. Default: [0.6, 1.0] */
    glowIntensityRange: [number, number];

    /** Opacity of particle body (0-1). Default: 1 */
    opacityBody: number;

    /** Opacity of particle core (0-1). Default: 0.7 */
    opacityCore: number;

    // ===== Connections =====

    /** Ratio of canvas diagonal for max connection distance. Default: 0.3 */
    connectionMaxDistanceRatio: number;

    /** Absolute max distance limit for connections (pixels). Default: 200 */
    connectionMaxDistanceLimit: number;

    /** Base opacity for connections (0-1). Default: 0.6 */
    connectionOpacity: number;

    /** Speed of connection pulsing animation. Default: 0.05 */
    connectionPulseSpeed: number;

    /** Amplitude of connection pulsing (0-1). Default: 0.3 */
    connectionPulseAmplitude: number;

    /** Line width for connections. Default: 0.5 */
    connectionLineWidth: number;

    /** Glow width for connections. Default: 0.5 */
    connectionGlowWidth: number;

    /** Glow opacity for connections (0-1). Default: 0.3 */
    connectionGlowOpacity: number;

    // ===== Canvas Clearing =====

    /** Background repaint color (any valid CSS color string). Default: '#000' */
    repaint: string;
}

export const DEFAULT_CONFIG: ParticleConfig = {
    particleDensity: 0.00002,
    minParticles: 20,
    maxParticles: 500,
    spawnInterval: 1,
    speedRange: [0.5, 1],
    maxSpeed: 2,
    damping: 0.00001,
    sizeRange: [4, 5],
    growthRate: 0.01,
    shrinkRate: 0.005,
    satRange: [70, 100],
    boundaryMargin: 0,
    bounceRetention: 0.8,
    cursorAvoidRadius: 100,
    cursorAvoidForce: 10,
    interactionRadius: 60,
    repulsion: 0.05,
    attraction: 0.05,
    trailOpacity: 0.4,
    trailMaxLength: 30,
    pulseSpeed: 0.03,
    pulseAmplitude: 0.1,
    glowIntensityRange: [0.6, 1.0],
    opacityBody: 1,
    opacityCore: 0.7,
    connectionMaxDistanceRatio: 0.3,
    connectionMaxDistanceLimit: 200,
    connectionOpacity: 0.6,
    connectionPulseSpeed: 0.05,
    connectionPulseAmplitude: 0.3,
    connectionLineWidth: 0.5,
    connectionGlowWidth: 0.5,
    connectionGlowOpacity: 0.3,
    repaint: '#000',
}
