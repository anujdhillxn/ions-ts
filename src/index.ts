interface ParticeConfig {
    particles: {
        density: number;          // particles per pixel squared
        minParticles: number;
        maxParticles: number;
        spawnInterval: number;    // seconds
    };
    physics: {
        speedRange: [number, number]; // initial speed range
        maxSpeed: number;
        damping: number;             // velocity damping factor per frame
    };
    lifecycle: {
        sizeRange: [number, number]; // initial size range
        growthRate: number;         // size increase per frame
        shrinkRate: number;         // size decrease per frame
    };
    colors: {
        satRange: [number, number]; // saturation range for HSL
    };
    boundaries: {
        margin: number;            // pixels from edge to start bouncing
        force: number;             // force applied when near boundary
        bounceRetention: number;   // velocity retention on bounce
    };
    cursor: {
        avoidRadius: number;       // radius around cursor to avoid
        avoidForce: number;
    }
    interaction: {
        radius: number;            // interaction radius between particles
        repulsion: number;         // repulsion force for similar colors
        attraction: number;        // attraction force for different colors
    };
    trails: {
        opacity: number;           // trail opacity
        width: number;             // trail line width
        glowOpacity: number;       // glow opacity
        glowWidth: number;         // glow line width
    };
    visual: {
        pulse: { speed: number; amplitude: number; };
        glow: { intensityRange: [number, number]; atmosphere: number; outer: number; };
        opacity: { atmosphere: number; outerGlow: number; body: number; core: number; sparkle: number; };
    };
    connections: {
        maxDistanceRatio: number;  // ratio of canvas diagonal for max connection distance
        maxDistanceLimit: number;  // absolute max distance limit
        opacity: number;           // base opacity for connections
        pulse: { speed: number; amplitude: number; };
        lineWidth: number;
        glowWidth: number;
        glowOpacity: number;
    };
    repaint: string;             // background repaint style
}

const DEFAULT_CONFIG: ParticeConfig = {
    particles: {
        density: 0.00002,
        minParticles: 20,
        maxParticles: 500,
        spawnInterval: 1,
    },
    physics: { speedRange: [0.5, 1], maxSpeed: 2, damping: 0.00001 },
    lifecycle: { sizeRange: [4, 5], growthRate: 0.01, shrinkRate: 0.005 },
    colors: { satRange: [70, 100] },
    boundaries: { margin: 0, force: 0.002, bounceRetention: 0.8 },
    cursor: { avoidRadius: 100, avoidForce: 10 },
    interaction: { radius: 60, repulsion: 0.05, attraction: 0.05 },
    trails: {
        opacity: 0.4,
        width: 1,
        glowOpacity: 0.4,
        glowWidth: 3,
    },
    visual: {
        pulse: { speed: 0.03, amplitude: 0.1 },
        glow: { intensityRange: [0.6, 1.0], atmosphere: 4, outer: 2.8 },
        opacity: { atmosphere: 0, outerGlow: 0.25, body: 1, core: 0.7, sparkle: 0.9 }
    },
    connections: {
        maxDistanceRatio: 0.3,
        maxDistanceLimit: 200,
        opacity: 0.6,
        pulse: { speed: 0.05, amplitude: 0.3 },
        lineWidth: 0.5,
        glowWidth: 0.5,
        glowOpacity: 0.3
    },
    repaint: `rgba(0, 0, 0, 0.1)`,
}

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const fastNormalize = (x: number, y: number) => {
    const distSq = x * x + y * y;
    if (distSq > 0) {
        const invDist = 1 / Math.sqrt(distSq);
        return [x * invDist, y * invDist];
    }
    return [0, 0];
}

const getParticleColor = (satRange: [number, number]) => {
    const isRed = Math.random() < 0.5;
    return {
        hue: isRed ? (Math.random() < 0.5 ? random(350, 360) : random(0, 10)) : random(230, 250),
        sat: random(...satRange),
    }
}

const areSimilarColors = (hue1: number, hue2: number) => {
    const isRed1 = (hue1 >= 350 || hue1 <= 10);
    const isRed2 = (hue2 >= 350 || hue2 <= 10);
    return isRed1 === isRed2;
}

const getTime = () => performance.now() / 5;

export const createIonosphere = (canvasId: string, config: ParticeConfig = DEFAULT_CONFIG) => {

    class ParticleNode {
        pos: { x: number, y: number }
        velocity: { x: number, y: number }
        size: { current: number, max: number, growing: boolean }
        opacity: number
        color: { hue: number, sat: number }
        pulsePhase: number
        glowIntensity: number
        constructor(x = Math.random() * canvas.width, y = Math.random() * canvas.height) {
            this.pos = { x, y };
            const speed = random(...config.physics.speedRange);
            const angle = Math.random() * 2 * Math.PI;
            this.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
            this.size = { current: 1, max: random(...config.lifecycle.sizeRange), growing: true };
            this.opacity = 1;
            this.color = getParticleColor(config.colors.satRange);
            this.pulsePhase = Math.random() * 2 * Math.PI;
            this.glowIntensity = random(...config.visual.glow.intensityRange);
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
                this.size.current += config.lifecycle.growthRate * timeElapsed;
                if (this.size.current >= this.size.max) {
                    this.size.current = this.size.max;
                    this.size.growing = false;
                }
            } else {
                this.size.current -= config.lifecycle.shrinkRate * timeElapsed;
            }
            this.opacity = Math.max(0, Math.min(1, this.size.current / this.size.max));
        }
        handleCursorAvoidance() {
            const timeElapsed = getTime() - time;
            const dx = this.pos.x - mouse.x;
            const dy = this.pos.y - mouse.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < COMPUTED.avoidRadiusSq) {
                const [nx, ny] = fastNormalize(dx, dy);
                this.velocity.x += nx * config.cursor.avoidForce * timeElapsed;
                this.velocity.y += ny * config.cursor.avoidForce * timeElapsed;
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
                    if (areSimilarColors(this.color.hue, other.color.hue)) {
                        this.velocity.x -= nx * config.interaction.repulsion * timeElapsed;
                        this.velocity.y -= ny * config.interaction.repulsion * timeElapsed;
                    } else {
                        this.velocity.x += nx * config.interaction.attraction * timeElapsed;
                        this.velocity.y += ny * config.interaction.attraction * timeElapsed;
                    }
                }
                if (distSq < COMPUTED.maxDistanceSq && this.size.current > 0) {
                    const {opacity, pulse, lineWidth, glowOpacity, glowWidth} = config.connections;
                    const finalOpacity = (1 - distSq / COMPUTED.maxDistanceSq) * opacity * Math.min(this.opacity, other.opacity);
                    const pulseValue = 1 + Math.sin(frameCount * pulse.speed) * pulse.amplitude;
                    ctx.save();
                    const gradient = ctx.createLinearGradient(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                    gradient.addColorStop(0, `hsla(${this.color.hue}, ${this.color.sat}%, 70%, ${0})`);
                    if (areSimilarColors(this.color.hue, other.color.hue)) {
                        gradient.addColorStop(1, `hsla(${this.color.hue}, 100%, 100%, ${opacity * 0.5})`);
                    }
                    else {
                        gradient.addColorStop(1, `hsla(${random(260, 280)}, 100%, 50%, ${opacity * 0.5})`);
                    }

                    ctx.beginPath();
                    ctx.moveTo(this.pos.x, this.pos.y);
                    ctx.lineTo(other.pos.x, other.pos.y);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = lineWidth * finalOpacity;
                    ctx.stroke();

                    ctx.globalAlpha = opacity * glowOpacity * pulseValue;
                    ctx.lineWidth = glowWidth;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
        updatePhysics() {
            const timeElapsed = getTime() - time;
            this.velocity.x -= this.velocity.x * config.physics.damping * timeElapsed;
            this.velocity.y -= this.velocity.y * config.physics.damping * timeElapsed;

            const speedSq = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y;
            if (speedSq > COMPUTED.maxSpeedSq) {
                const speed = Math.sqrt(speedSq);
                this.velocity.x = (this.velocity.x / speed) * config.physics.maxSpeed;
                this.velocity.y = (this.velocity.y / speed) * config.physics.maxSpeed;
            }

            this.pos.x += this.velocity.x * timeElapsed;
            this.pos.y += this.velocity.y * timeElapsed;
        }
        handleBoundaries() {

            if (this.pos.x < config.boundaries.margin) {
                this.pos.x = config.boundaries.margin;
                this.velocity.x = Math.abs(this.velocity.x) * config.boundaries.bounceRetention;
            } else if (this.pos.x > canvas.width - config.boundaries.margin) {
                this.pos.x = canvas.width - config.boundaries.margin;
                this.velocity.x = -Math.abs(this.velocity.x) * config.boundaries.bounceRetention;
            }

            // Vertical boundaries
            if (this.pos.y < config.boundaries.margin) {
                this.pos.y = config.boundaries.margin;
                this.velocity.y = Math.abs(this.velocity.y) * config.boundaries.bounceRetention;
            } else if (this.pos.y > canvas.height - config.boundaries.margin) {
                this.pos.y = canvas.height - config.boundaries.margin;
                this.velocity.y = -Math.abs(this.velocity.y) * config.boundaries.bounceRetention;
            }
        }
        draw() {
            const pulse = 1 + Math.sin(this.pulsePhase + frameCount * config.visual.pulse.speed) * config.visual.pulse.amplitude;
            const size = this.size.current * pulse;
            const { hue, sat } = this.color;
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, size, 0, 2 * Math.PI);
            const gradient = ctx.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, size);
            gradient.addColorStop(0, `hsla(${hue}, ${sat}%, 100%, ${config.visual.opacity.core})`);
            gradient.addColorStop(1, `hsla(${hue}, ${sat}%, 20%, ${config.visual.opacity.body})`);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let nodes: ParticleNode[] = [], time = 0, frameCount = 0;
    let mouse = { x: -1000, y: -1000 };
    let maxParticles = config.particles.minParticles;

    let COMPUTED = {
        maxSpeedSq: config.physics.maxSpeed * config.physics.maxSpeed,
        interactionRadiusSq: config.interaction.radius * config.interaction.radius,
        avoidRadiusSq: config.cursor.avoidRadius * config.cursor.avoidRadius,
        maxDistanceSq: 0, //will be calculated based on canvas size
    }

    const updateConnectionDistance = () => {
        const maxDist = Math.min(config.connections.maxDistanceLimit, Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * config.connections.maxDistanceRatio);
        COMPUTED.maxDistanceSq = maxDist * maxDist;
    }

    const handleParticleCountChange = () => {
        const area = canvas.width * canvas.height;
        const newMaxParticles = Math.min(config.particles.maxParticles, Math.max(config.particles.minParticles, Math.floor(area * config.particles.density)));
        maxParticles = newMaxParticles;
        if (nodes.length > maxParticles) {
            nodes.splice(0, nodes.length - maxParticles);
        }
    }

    const updateParticleSpeed = () => {
        const maxSpeed = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * 0.0001;
        config.physics.maxSpeed = maxSpeed;
    }

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        handleParticleCountChange();
        updateConnectionDistance();
        updateParticleSpeed();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    window.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < 5; i++) nodes.push(new ParticleNode(e.clientX - rect.left, e.clientY - rect.top));
    });

    const spawnNode = (x?: number, y?: number) => {
        if (nodes.length >= maxParticles) return;
        nodes.push(new ParticleNode(x, y));
    }

    const animate = () => {
        frameCount++;
        ctx.save();
        ctx.fillStyle = config.repaint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        if (frameCount % config.particles.spawnInterval === 0) {
            spawnNode();
        }
        nodes = nodes.filter(node => node.update(nodes));
        nodes.forEach(node => {
            node.draw();
        });
        requestAnimationFrame(animate);
        time = getTime();
    }

    return animate;
}
