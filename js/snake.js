// ==================================================
// SNAKE MODULE
// ==================================================
const Snake = (() => {
    const UNIT = 20;
    let body = [];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let moveCounter = 0;
    let moveInterval = 8;      // frames por paso (ajustado por nivel)
    let grow = 0;
    let score = 0;

    // Glitch apple / phase power
    let phaseTimer = 0;        // frames restantes de fase

    function init() {
        body = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        moveCounter = 0;
        grow = 0;
        score = 0;
        phaseTimer = 0;
    }

    function setSpeed(intervalFrames) { moveInterval = intervalFrames; }

    function setInput(key) {
        if (key === 'ArrowUp'    && dir.y === 0) nextDir = { x: 0, y: -1 };
        else if (key === 'ArrowDown'  && dir.y === 0) nextDir = { x: 0, y: 1 };
        else if (key === 'ArrowLeft'  && dir.x === 0) nextDir = { x: -1, y: 0 };
        else if (key === 'ArrowRight' && dir.x === 0) nextDir = { x: 1, y: 0 };
    }

    function activatePhase(frames) { phaseTimer = frames; }
    function isPhasing() { return phaseTimer > 0; }
    function phaseSeconds() { return (phaseTimer / 60).toFixed(1); }

    // Devuelve eventos para que main.js decida (comer manzana, morir, etc.)
    function update(COLS, ROWS, apple, glitchApple, tetrisGrid, callbacks) {
        if (phaseTimer > 0) phaseTimer--;

        moveCounter++;
        if (moveCounter < moveInterval) return;
        moveCounter = 0;
        dir = nextDir;

        const head = body[0];
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        // Colisión con bordes
        if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
            callbacks.onDeath(); return;
        }

        // Colisión con sí mismo
        for (let i = 0; i < body.length - 1; i++) {
            if (body[i].x === newHead.x && body[i].y === newHead.y) {
                callbacks.onDeath(); return;
            }
        }

        // Colisión con Tetris (si NO está en fase)
        if (!isPhasing() && tetrisGrid) {
            const cell = tetrisGrid[newHead.y] && tetrisGrid[newHead.y][newHead.x];
            if (cell) {
                // Atravesar = glitchBurst + permitir (para no frustrar demasiado)
                // Aquí elegimos: bloquear si no está en fase
                callbacks.onDeath(); return;
            }
        } else if (isPhasing() && tetrisGrid) {
            const cell = tetrisGrid[newHead.y] && tetrisGrid[newHead.y][newHead.x];
            if (cell) {
                Particles.glitchBurst(
                    newHead.x * UNIT + UNIT / 2,
                    newHead.y * UNIT + UNIT / 2
                );
            }
        }

        body.unshift(newHead);

        // Manzana normal
        if (newHead.x === apple.x && newHead.y === apple.y) {
            score += 10;
            grow += 2;
            callbacks.onApple();
        }
        // Glitch apple
        else if (glitchApple && glitchApple.active &&
                 newHead.x === glitchApple.x && newHead.y === glitchApple.y) {
            score += 25;
            grow += 1;
            activatePhase(5 * 60); // 5 segundos
            callbacks.onGlitchApple();
        }

        if (grow > 0) grow--;
        else body.pop();
    }

    function draw(ctx) {
        // manzana se dibuja en main para coordinación
        body.forEach((seg, i) => {
            const x = seg.x * UNIT, y = seg.y * UNIT;
            if (isPhasing()) {
                // efecto glitch RGB
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(x + 2, y + 2, UNIT - 4, UNIT - 4);
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(x - 2, y - 2, UNIT - 4, UNIT - 4);
                ctx.globalAlpha = 1;
            }
            if (i === 0) {
                ctx.fillStyle = '#88ff88';
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 12;
            } else {
                const g = ctx.createLinearGradient(x, y, x + UNIT, y + UNIT);
                g.addColorStop(0, '#00ff44');
                g.addColorStop(1, '#008822');
                ctx.fillStyle = g;
                ctx.shadowBlur = 0;
            }
            ctx.fillRect(x + 1, y + 1, UNIT - 2, UNIT - 2);
            ctx.shadowBlur = 0;
        });
    }

    return {
        init, update, draw, setSpeed, setInput, activatePhase,
        isPhasing, phaseSeconds,
        get score() { return score; },
        get body()  { return body; }
    };
})();