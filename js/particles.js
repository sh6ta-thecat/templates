// ==================================================
// PARTICLES MODULE
// ==================================================
const Particles = (() => {
    const list = [];

    function spawn(x, y, count, color, opts = {}) {
        const speed = opts.speed || 3;
        const life  = opts.life  || 40;
        const size  = opts.size  || 3;
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = Math.random() * speed + 0.5;
            list.push({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: life + Math.random() * 15,
                maxLife: life + 15,
                size: size + Math.random() * 2,
                color
            });
        }
    }

    function glitchBurst(x, y) {
        const colors = ['#00ffff', '#ff00ff', '#ff0000', '#ffffff'];
        spawn(x, y, 12, colors[Math.floor(Math.random() * colors.length)],
              { speed: 5, life: 25, size: 4 });
    }

    function update() {
        for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.life--;
            if (p.life <= 0) list.splice(i, 1);
        }
    }

    function draw(ctx) {
        list.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }

    function clear() { list.length = 0; }

    return { spawn, glitchBurst, update, draw, clear };
})();