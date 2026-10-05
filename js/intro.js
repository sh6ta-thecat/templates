// ==================================================
// INTRO CINEMATIC (versión más lenta)
// ==================================================
const Intro = (() => {
    let t = 0;               // frames globales
    let finished = false;
    const FPS = 60;
    const TOTAL = 20 * FPS;  // ~20 segundos (antes 12)
    // Escenas:
    // 0 - 4s   → Dino
    // 4 - 8s   → Tetris
    // 8 - 12s  → Snake
    // 12 - 16s → Fusión
    // 16 - 20s → Logo
    const SEG = FPS;

    let introObstacles = [];
    let introCurrentPiece = null;
    let introTetrisTimer = 0;
    let glitchLevel = 0;

    function reset() {
        t = 0;
        finished = false;
        glitchLevel = 0;
        introObstacles = [{ x: 900, w: 20, h: 35 }];
        introCurrentPiece = {
            shape: [[1,1,1,1]],
            x: 20, y: 0, color: '#00ffff'
        };
        introTetrisTimer = 0;
    }

    function update(dt = 1) {
        if (finished) return;
        t += dt;
        glitchLevel = Math.min(1, t / (TOTAL * 0.9));
        if (t >= TOTAL) { finished = true; }

        // ---- Mini Dino más lento (antes -3) ----
        introObstacles.forEach(o => o.x -= 1.8);
        introObstacles = introObstacles.filter(o => o.x + o.w > 0);
        if (Math.random() < 0.008) {
            introObstacles.push({ x: 900, w: 20, h: Math.random() < 0.5 ? 35 : 55 });
        }

        // ---- Mini Tetris más lento (antes 30 frames) ----
        introTetrisTimer++;
        if (introTetrisTimer > 55) {   // antes 30
            introTetrisTimer = 0;
            introCurrentPiece.y++;
            if (introCurrentPiece.y > 25) {
                introCurrentPiece.y = 0;
                introCurrentPiece.x = 5 + Math.floor(Math.random() * 30);
                const shapes = [
                    [[1,1,1,1]], [[1,1],[1,1]], [[1,1,1],[0,1,0]]
                ];
                introCurrentPiece.shape = shapes[Math.floor(Math.random() * shapes.length)];
            }
        }
    }

    function drawGlitchText(ctx, text, x, y, size, color, intensity) {
        ctx.font = `bold ${size}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        const shift = intensity * 3;
        ctx.fillStyle = '#ff00ff';
        ctx.fillText(text, x - shift, y);
        ctx.fillStyle = '#00ffff';
        ctx.fillText(text, x + shift, y);
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);

        if (Math.random() < intensity * 0.5) {
            const ry = y - size / 2 + Math.random() * size;
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(x - text.length * size * 0.3, ry, text.length * size * 0.6, 2);
        }
    }

    function draw(ctx, W, H) {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, W, H);

        const scene = t / SEG;

        if (scene < 4)         drawDinoScene(ctx, W, H);
        else if (scene < 8)    drawTetrisScene(ctx, W, H);
        else if (scene < 12)   drawSnakeScene(ctx, W, H);
        else if (scene < 16)   drawFusionScene(ctx, W, H);
        else                   drawLogoScene(ctx, W, H);

        // SKIP hint
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText('[ ESPACIO ] SKIP', W - 20, H - 20);
        ctx.textAlign = 'left';

        if (glitchLevel > 0.3) {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
        }
    }

    // ============ ESCENA 1: DINO (más lenta) ============
    function drawDinoScene(ctx, W, H) {
        const localT = t / SEG;               // 0..4
        const groundY = H - 100;
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, groundY + 50); ctx.lineTo(W, groundY + 50); ctx.stroke();

        // Dino salta más lentamente (ciclo de 3s en vez de 1.5s)
        const cycle = localT % 3;
        const jumping = cycle > 1.8;
        const jumpY = jumping
            ? Math.sin((cycle - 1.8) / 1.2 * Math.PI) * -70
            : 0;

        const dinoX = 150;
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
        ctx.fillRect(dinoX, groundY + jumpY, 30, 40);
        ctx.fillRect(dinoX + 5, groundY - 8 + jumpY, 20, 12);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.fillRect(dinoX + 18, groundY + 2 + jumpY, 3, 3);

        introObstacles.forEach(o => {
            ctx.fillStyle = '#666';
            ctx.fillRect(o.x, groundY + 50 - o.h, o.w, o.h);
        });

        drawGlitchText(ctx, 'WORLD_03: DINO', W/2, 80, 24, '#ff4444', glitchLevel * 0.4);

        // El glitch aparece más tarde (a los 3s, antes 1.8s)
        if (localT > 3) {
            ctx.fillStyle = `rgba(255,0,255,${Math.min(0.4, (localT - 3) * 0.3)})`;
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(Math.random() * W, Math.random() * H, 40, 3);
            }
        }
    }

    // ============ ESCENA 2: TETRIS ============
    function drawTetrisScene(ctx, W, H) {
        const localT = (t - SEG * 4) / SEG;   // 0..4
        ctx.strokeStyle = 'rgba(0,255,255,0.15)';
        ctx.lineWidth = 1;
        const unit = 20;
        for (let x = 0; x < W; x += unit) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += unit) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        ctx.fillStyle = introCurrentPiece.color;
        ctx.shadowColor = introCurrentPiece.color; ctx.shadowBlur = 12;
        introCurrentPiece.shape.forEach((row, i) => row.forEach((v, j) => {
            if (v) ctx.fillRect((introCurrentPiece.x + j) * unit, (introCurrentPiece.y + i) * unit, unit, unit);
        }));
        ctx.shadowBlur = 0;

        drawGlitchText(ctx, 'WORLD_02: TETRIS', W/2, 80, 24, '#00ffff', glitchLevel * 0.5);

        if (localT > 1.5) {
            if (Math.random() < 0.2) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(introCurrentPiece.x * unit, introCurrentPiece.y * unit,
                             introCurrentPiece.shape[0].length * unit, introCurrentPiece.shape.length * unit);
            }
        }
        if (localT > 2.5) {
            drawGlitchText(ctx, 'SYSTEM ERROR', W/2, H/2, 36, '#ff00ff', 0.8);
        }
    }

    // ============ ESCENA 3: SNAKE ============
    function drawSnakeScene(ctx, W, H) {
        const localT = (t - SEG * 8) / SEG;   // 0..4
        ctx.strokeStyle = 'rgba(0,255,136,0.08)';
        const u = 30;
        for (let x = 0; x < W; x += u) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        for (let y = 0; y < H; y += u) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

        const snakeX = W / 2 - 90;
        const snakeY = H / 2;
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i === 0 ? '#88ff88' : '#00cc44';
            ctx.shadowColor = '#00ff44'; ctx.shadowBlur = i === 0 ? 15 : 5;
            ctx.fillRect(snakeX + i * 25, snakeY, 22, 22);
        }
        ctx.shadowBlur = 0;

        // zZz más lento
        const zOffset = (localT * 30) % 60;
        ctx.fillStyle = `rgba(255,255,255,${1 - zOffset / 60})`;
        ctx.font = 'bold 20px Courier New';
        ctx.fillText('z', snakeX + 80, snakeY - 10 - zOffset);
        ctx.font = 'bold 14px Courier New';
        ctx.fillText('z', snakeX + 95, snakeY - 25 - zOffset);

        const apples = [
            { x: W/2 - 200, y: H/2 + 80 },
            { x: W/2 + 100, y: H/2 - 100 },
            { x: W/2 + 250, y: H/2 + 60 }
        ];
        apples.forEach((a, i) => {
            const glitching = i === 1 && localT > 2.5;   // antes 0.7
            ctx.fillStyle = glitching ? (Math.random() < 0.5 ? '#ff00ff' : '#ff0000') : '#ff3355';
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(a.x, a.y, 10, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00ff44';
            ctx.fillRect(a.x - 2, a.y - 14, 4, 6);
        });

        drawGlitchText(ctx, 'WORLD_01: SNAKE', W/2, 80, 24, '#00ff44', glitchLevel * 0.5);

        if (localT > 3) {
            drawGlitchText(ctx, 'WAKE UP', W/2, H/2 - 120, 28, '#ff00ff', 0.7);
        }
    }

    // ============ ESCENA 4: FUSIÓN ============
    function drawFusionScene(ctx, W, H) {
        const localT = (t - SEG * 12) / SEG;   // 0..4
        ctx.globalAlpha = 0.35;
        drawDinoScene(ctx, W, H);
        drawTetrisScene(ctx, W, H);
        drawSnakeScene(ctx, W, H);
        ctx.globalAlpha = 1;

        drawGlitchText(ctx, 'CONFLICT DETECTED', W/2, H/2 - 40, 40, '#ff0044', 0.9);
        if (localT > 1) {
            drawGlitchText(ctx, 'SYSTEM ERROR', W/2, H/2 + 20, 34, '#ff00ff', 0.9);
        }
        if (localT > 2) {
            drawGlitchText(ctx, 'MERGING...', W/2, H/2 + 80, 26, '#00ff88', 0.6);
        }

        if (Math.random() < 0.25) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(0, Math.random() * H, W, 3);
        }
    }

    // ============ ESCENA 5: LOGO ============
    function drawLogoScene(ctx, W, H) {
        const localT = (t - SEG * 16) / SEG;   // 0..4
        drawGlitchText(ctx, 'GLITCH RUN', W/2, H/2 - 30, 72, '#00ff88', Math.min(1, localT * 1.5));
        drawGlitchText(ctx, 'THREE WORLDS. ONE ERROR.', W/2, H/2 + 40, 22, '#ff00ff', Math.min(1, localT * 1.5));

        if (Math.sin(t * 0.1) > 0) {   // parpadeo más lento
            drawGlitchText(ctx, '[ PRESS SPACE ]', W/2, H/2 + 130, 26, '#ffffff', 0.4);
        }
    }

    return {
        reset, update, draw,
        get finished() { return finished; },
        skip() { finished = true; }
    };
})();