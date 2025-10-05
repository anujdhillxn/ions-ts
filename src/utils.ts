export const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const fastNormalize = (x: number, y: number) => {
    const distSq = x * x + y * y;
    if (distSq > 0) {
        const invDist = 1 / Math.sqrt(distSq);
        return [x * invDist, y * invDist];
    }
    return [0, 0];
}

export const getParticleColor = (satRange: [number, number]) => {
    const isRed = Math.random() < 0.5;
    return {
        hue: isRed ? (Math.random() < 0.5 ? random(350, 360) : random(0, 10)) : random(230, 250),
        sat: random(...satRange),
    }
}

export const areSimilarColors = (hue1: number, hue2: number) => {
    const isRed1 = (hue1 >= 350 || hue1 <= 10);
    const isRed2 = (hue2 >= 350 || hue2 <= 10);
    return isRed1 === isRed2;
}

export const getTime = () => performance.now() / 5;
