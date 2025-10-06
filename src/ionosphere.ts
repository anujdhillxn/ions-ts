import { ParticleConfig, DEFAULT_CONFIG } from './config';
import { random, fastNormalize, getTime } from './utils';

/**
 * Creates an interactive particle animation system on a canvas element.
 *
 * @param canvasId - The HTML id of the canvas element to render on
 * @param configOverrides - Optional configuration overrides. See ParticleConfig for all available options.
 * @returns Object with methods to control the animation: start(), stop(), updateConfig(), destroy()
 *
 * @example
 * ```html
 * <canvas id="myCanvas"></canvas>
 * ```
 *
 * ```typescript
 * const ionosphere = createIonosphere('myCanvas', {
 *   trailMaxLength: 50,
 *   trailOpacity: 0.8,
 *   repaint: '#000'
 * });
 * ionosphere.start();
 *
 * // Stop animation
 * ionosphere.stop();
 *
 * // Update config dynamically
 * ionosphere.updateConfig({ trailMaxLength: 100, repulsion: 0.1 });
 *
 * // Clean up resources
 * ionosphere.destroy();
 * ```
 */
export const createIonosphere = (canvasId: string, configOverrides: Partial<ParticleConfig> = {}) => {
    let config: ParticleConfig = { ...DEFAULT_CONFIG, ...configOverrides };

    class ParticleNode {
        pos: { x: number, y: number }
        velocity: { x: number, y: number }
        size: { current: number, max: number, growing: boolean }
        opacity: number
        color: { hue: number, sat: number }
        pulsePhase: number
        glowIntensity: number
        trail: { x: number, y: number }[]
        charge: -1 | 0 | 1
        constructor(x = Math.random() * canvas.width, y = Math.random() * canvas.height, charge?: -1 | 0 | 1) {
            this.pos = { x, y };
            const speed = random(...config.speedRange);
            const angle = Math.random() * 2 * Math.PI;
            this.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
            this.size = { current: 1, max: random(...config.sizeRange), growing: true };
            this.opacity = 1;

            // Assign charge: use provided charge or randomly assign
            if (charge !== undefined) {
                this.charge = charge;
            } else {
                // Randomly assign -1 or 1 (no neutral particles for now)
                this.charge = Math.random() < 0.5 ? -1 : 1;
            }

            // Set color based on charge
            if (this.charge === -1) {
                this.color = { hue: 240, sat: random(...config.satRange) }; // Blue
            } else if (this.charge === 1) {
                this.color = { hue: 0, sat: random(...config.satRange) }; // Red
            } else {
                this.color = { hue: 120, sat: random(...config.satRange) }; // Green for neutral
            }

            this.pulsePhase = Math.random() * 2 * Math.PI;
            this.glowIntensity = random(...config.glowIntensityRange);
            this.trail = [];
        }
        update(allNodes: ParticleNode[]) {
            this.updatePhysics();
            this.updateSize();
            this.handleCursorAvoidance();
            this.handleInteractions(allNodes);
            this.handleBoundaries();
            return this.size.current > 0;
        }
        updateSize() {
            const timeElapsed = getTime() - time;
            if (this.size.growing) {
                this.size.current += config.growthRate * timeElapsed;
                if (this.size.current >= this.size.max) {
                    this.size.current = this.size.max;
                    this.size.growing = false;
                }
            } else {
                this.size.current -= config.shrinkRate * timeElapsed;
            }
            this.opacity = Math.max(0, Math.min(1, this.size.current / this.size.max));
        }
        handleCursorAvoidance() {
            const timeElapsed = getTime() - time;
            const dx = this.pos.x - mouse.x;
            const dy = this.pos.y - mouse.y;
            const distSq = dx * dx + dy * dy;

            // Impenetrable circle - push particle out if inside
            if (distSq < COMPUTED.impenetrableRadiusSq && distSq > 0) {
                const [nx, ny] = fastNormalize(dx, dy);
                // Position particle at the edge of the impenetrable circle
                this.pos.x = mouse.x + nx * config.cursorImpenetrableRadius;
                this.pos.y = mouse.y + ny * config.cursorImpenetrableRadius;
                // Zero out velocity component toward cursor
                const velocityDotNormal = this.velocity.x * nx + this.velocity.y * ny;
                if (velocityDotNormal < 0) {
                    this.velocity.x -= velocityDotNormal * nx;
                    this.velocity.y -= velocityDotNormal * ny;
                }
            }

            // Charge-based interaction in outer radius
            if (distSq < COMPUTED.avoidRadiusSq && distSq >= COMPUTED.impenetrableRadiusSq) {
                const [nx, ny] = fastNormalize(dx, dy);
                // Cursor charge interaction: same charge = repel (away from cursor), opposite = attract (toward cursor)
                const chargeProduct = this.charge * config.cursorCharge;
                this.velocity.x += nx * chargeProduct * config.cursorAvoidForce * timeElapsed;
                this.velocity.y += ny * chargeProduct * config.cursorAvoidForce * timeElapsed;
            }
        }
        handleInteractions(allNodes: ParticleNode[]) {
            const timeElapsed = getTime() - time;
            for (let other of allNodes) {
                if (other === this) continue;
                const dx = other.pos.x - this.pos.x;
                const dy = other.pos.y - this.pos.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < COMPUTED.interactionRadiusSq) {
                    const [nx, ny] = fastNormalize(dx, dy);
                    // Charge interaction: chargeProduct > 0 (same) = repel, < 0 (opposite) = attract, = 0 (neutral) = no interaction
                    const chargeProduct = this.charge * other.charge;
                    this.velocity.x -= nx * chargeProduct * config.attraction * timeElapsed;
                    this.velocity.y -= ny * chargeProduct * config.attraction * timeElapsed;
                }
                if (distSq < COMPUTED.maxDistanceSq && this.size.current > 0) {
                    const finalOpacity = (1 - distSq / COMPUTED.maxDistanceSq) * config.connectionOpacity * Math.min(this.opacity, other.opacity);
                    const pulseValue = 1 + Math.sin(frameCount * config.connectionPulseSpeed) * config.connectionPulseAmplitude;
                    ctx.save();
                    const gradient = ctx.createLinearGradient(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                    gradient.addColorStop(0, `hsla(${this.color.hue}, ${this.color.sat}%, 70%, ${0})`);
                    if (this.charge === other.charge) {
                        gradient.addColorStop(1, `hsla(${this.color.hue}, 100%, 100%, ${config.connectionOpacity * 0.5})`);
                    }
                    else {
                        gradient.addColorStop(1, `hsla(${random(260, 280)}, 100%, 50%, ${config.connectionOpacity * 0.5})`);
                    }

                    ctx.beginPath();
                    ctx.moveTo(this.pos.x, this.pos.y);
                    ctx.lineTo(other.pos.x, other.pos.y);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = config.connectionLineWidth * finalOpacity;
                    ctx.stroke();

                    ctx.globalAlpha = config.connectionOpacity * config.connectionGlowOpacity * pulseValue;
                    ctx.lineWidth = config.connectionGlowWidth;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
        updatePhysics() {
            const timeElapsed = getTime() - time;
            this.velocity.x -= this.velocity.x * config.damping * timeElapsed;
            this.velocity.y -= this.velocity.y * config.damping * timeElapsed;

            const speedSq = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y;
            if (speedSq > COMPUTED.maxSpeedSq) {
                const speed = Math.sqrt(speedSq);
                this.velocity.x = (this.velocity.x / speed) * config.maxSpeed;
                this.velocity.y = (this.velocity.y / speed) * config.maxSpeed;
            }

            // Store previous position for trail
            this.trail.push({ x: this.pos.x, y: this.pos.y });
            if (this.trail.length > config.trailMaxLength) this.trail.shift();

            this.pos.x += this.velocity.x * timeElapsed;
            this.pos.y += this.velocity.y * timeElapsed;
        }
        handleBoundaries() {

            if (this.pos.x < config.boundaryMargin) {
                this.pos.x = config.boundaryMargin;
                this.velocity.x = Math.abs(this.velocity.x) * config.bounceRetention;
            } else if (this.pos.x > canvas.width - config.boundaryMargin) {
                this.pos.x = canvas.width - config.boundaryMargin;
                this.velocity.x = -Math.abs(this.velocity.x) * config.bounceRetention;
            }

            // Vertical boundaries
            if (this.pos.y < config.boundaryMargin) {
                this.pos.y = config.boundaryMargin;
                this.velocity.y = Math.abs(this.velocity.y) * config.bounceRetention;
            } else if (this.pos.y > canvas.height - config.boundaryMargin) {
                this.pos.y = canvas.height - config.boundaryMargin;
                this.velocity.y = -Math.abs(this.velocity.y) * config.bounceRetention;
            }
        }
        draw() {
            const pulse = 1 + Math.sin(this.pulsePhase + frameCount * config.pulseSpeed) * config.pulseAmplitude;
            const size = this.size.current * pulse;
            const { hue, sat } = this.color;

            // Draw trail from position history
            for (let i = 0; i < this.trail.length; i++) {
                const t = i / this.trail.length;
                const trailOpacity = t * this.opacity * config.trailOpacity;
                const trailSize = size * (0.5 + t * 0.5);

                ctx.save();
                ctx.globalAlpha = trailOpacity;
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, trailSize, 0, 2 * Math.PI);
                const gradient = ctx.createRadialGradient(this.trail[i].x, this.trail[i].y, 0, this.trail[i].x, this.trail[i].y, trailSize);
                gradient.addColorStop(0, `hsla(${hue}, ${sat}%, 100%, 1)`);
                gradient.addColorStop(1, `hsla(${hue}, ${sat}%, 20%, 0.5)`);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            }

            // Draw main particle
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, size, 0, 2 * Math.PI);
            const gradient = ctx.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, size);
            gradient.addColorStop(0, `hsla(${hue}, ${sat}%, 100%, ${config.opacityCore})`);
            gradient.addColorStop(1, `hsla(${hue}, ${sat}%, 20%, ${config.opacityBody})`);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let nodes: ParticleNode[] = [], time = 0, frameCount = 0;
    let mouse = { x: -1000, y: -1000 };
    let maxParticles = config.minParticles;
    let animationFrameId: number | null = null;

    let COMPUTED = {
        maxSpeedSq: config.maxSpeed * config.maxSpeed,
        interactionRadiusSq: config.interactionRadius * config.interactionRadius,
        avoidRadiusSq: config.cursorAvoidRadius * config.cursorAvoidRadius,
        impenetrableRadiusSq: config.cursorImpenetrableRadius * config.cursorImpenetrableRadius,
        maxDistanceSq: 0, //will be calculated based on canvas size
    }

    const updateComputedValues = () => {
        COMPUTED.maxSpeedSq = config.maxSpeed * config.maxSpeed;
        COMPUTED.interactionRadiusSq = config.interactionRadius * config.interactionRadius;
        COMPUTED.avoidRadiusSq = config.cursorAvoidRadius * config.cursorAvoidRadius;
        COMPUTED.impenetrableRadiusSq = config.cursorImpenetrableRadius * config.cursorImpenetrableRadius;
    }

    const updateConnectionDistance = () => {
        const maxDist = Math.min(config.connectionMaxDistanceLimit, Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * config.connectionMaxDistanceRatio);
        COMPUTED.maxDistanceSq = maxDist * maxDist;
    }

    const handleParticleCountChange = () => {
        const area = canvas.width * canvas.height;
        const newMaxParticles = Math.min(config.maxParticles, Math.max(config.minParticles, Math.floor(area * config.particleDensity)));
        maxParticles = newMaxParticles;
        if (nodes.length > maxParticles) {
            nodes.splice(0, nodes.length - maxParticles);
        }
    }

    const updateParticleSpeed = () => {
        const maxSpeed = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * 0.0001;
        config.maxSpeed = maxSpeed;
    }

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        handleParticleCountChange();
        updateConnectionDistance();
        updateParticleSpeed();
    }

    resizeCanvas();

        const spawnNode = (limit: number, x?: number, y?: number) => {
        if (nodes.length >= limit) return;
        nodes.push(new ParticleNode(x, y));
    }

    const animate = () => {
        frameCount++;
        ctx.fillStyle = config.repaint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (frameCount % config.spawnInterval === 0) {
            spawnNode(maxParticles);
        }
        nodes = nodes.filter(node => node.update(nodes));
        nodes.forEach(node => {
            node.draw();
        });
        animationFrameId = requestAnimationFrame(animate);
        time = getTime();
    }

    const start = () => {
        if (animationFrameId !== null) return; // Already running
        animate();
    }

    const stop = () => {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    const updateConfig = (configUpdates: Partial<ParticleConfig>) => {
        config = { ...config, ...configUpdates };

        // Recalculate computed values
        updateComputedValues();
        updateConnectionDistance();
        handleParticleCountChange();
        updateParticleSpeed();
    }

    const handleResize = () => resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
        mouse.x = -1000;
        mouse.y = -1000;
    };

    const handleClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < 5; i++) spawnNode(maxParticles + 5, e.clientX - rect.left, e.clientY - rect.top);
    };

    const destroy = () => {
        // Stop animation
        stop();

        // Remove event listeners
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('click', handleClick);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Clear all nodes
        nodes = [];
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    return { start, stop, updateConfig, destroy };
}
