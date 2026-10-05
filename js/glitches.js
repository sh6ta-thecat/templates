// ==================================================
// GLITCH SYSTEM (modular, extensible)
// ==================================================
const Glitches = (() => {
    // Registro de tipos de glitch disponibles.
    // Cada glitch tiene: id, duración, callback de inicio/fin, update opcional.
    const active = [];
    const registry = {};

    function register(id, def) { registry[id] = def; }

    function trigger(id, payload = {}) {
        const def = registry[id];
        if (!def) { console.warn('Glitch desconocido:', id); return; }
        const g = {
            id,
            duration: def.duration || 60,
            timer: 0,
            payload,
            def
        };
        active.push(g);
        if (def.onStart) def.onStart(payload);
        Audio.sfx.glitch();
    }

    function update() {
        for (let i = active.length - 1; i >= 0; i--) {
            const g = active[i];
            g.timer++;
            if (g.def.onUpdate) g.def.onUpdate(g);
            if (g.timer >= g.duration) {
                if (g.def.onEnd) g.def.onEnd(g.payload);
                active.splice(i, 1);
            }
        }
    }

    function isActive(id) { return active.some(g => g.id === id); }

    function renderOverlay(ctx, W, H) {
        // Efecto global sutil cuando hay glitches activos (no abusivo)
        if (active.length > 0) {
            const intensity = Math.min(0.15, active.length * 0.04);
            // RGB shift muy ligero con lineas
            ctx.globalAlpha = intensity;
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(2, 0, W, H);
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-2, 0, W, H);
            ctx.globalAlpha = 1;

            // scanlines aleatorias
            for (let i = 0; i < 3; i++) {
                if (Math.random() < 0.4) {
                    const y = Math.random() * H;
                    const h = 2 + Math.random() * 6;
                    ctx.fillStyle = 'rgba(0,255,136,0.08)';
                    ctx.fillRect(0, y, W, h);
                }
            }
        }
    }

    // --- Registro de glitches base ---
    register('phase', {
        duration: 0, // se controla aparte por la Glitch Apple
        onStart: () => {},
        onEnd:   () => {}
    });

    register('freezeTetris', {
        duration: 180,
        onStart: () => { Tetris.setFrozen(true); },
        onEnd:   () => { Tetris.setFrozen(false); }
    });

    register('nullObstacle', {
        duration: 1,
        onStart: () => { Dino.removeFirstObstacle(); }
    });

    register('duplicateObstacle', {
        duration: 1,
        onStart: () => { Dino.duplicateObstacle(); }
    });

    register('corruptBlock', {
        duration: 120,
        onStart: (p) => { Tetris.corruptRandomBlock(p.color || '#ff00ff'); },
        onEnd:   () => { Tetris.clearCorrupt(); }
    });

    return { register, trigger, update, isActive, renderOverlay, get active() { return active; } };
})();