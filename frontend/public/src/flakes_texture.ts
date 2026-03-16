/**
 * Procedural canvas-based normal map that produces a metallic flake / sparkle effect.
 * Ported from the Three.js MeshPhysicalMaterial demo.
 */
export function createFlakesTexture(width = 512, height = 512): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    // Neutral normal (pointing straight out) as base
    ctx.fillStyle = 'rgb(127,127,255)';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 3 + 3;

        let nx = Math.random() * 2 - 1;
        let ny = Math.random() * 2 - 1;
        let nz = 1.5;

        const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= l;
        ny /= l;
        nz /= l;

        ctx.fillStyle = `rgb(${nx * 127 + 127},${ny * 127 + 127},${nz * 255})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}
