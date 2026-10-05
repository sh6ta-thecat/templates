// ==================================================
// MAIN — Game loop, estados, niveles, glitches globales
// ==================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const UNIT = 20;
const COLS = WIDTH / UNIT;
const ROWS = HEIGHT / UNIT;

// -------- ESTADOS --------
const State = {
    INTRO:   'intro',
    PLAYING: 'playing',
    GAMEOVER:'gameover',
    WIN:     'win'
};

const Game = {
    state: State.INTRO,
    level: 1,
    maxLevel: 20,
    overload: 0,
    combo: 1,
    comboTimer: 0,       // frames restantes de la ventana de combo
    comboWindow: 90,     // 1.5s
    levelProgress: 0,
    timeSurvived: 0,     // frames
    bestCombo: 1,
    totalScore: 0
};

// Apple normal y glitch apple
const apple = { x: 15, y: 5 };
let glitchApple = { active: false, x: 0, y: 0, timer: 0 };

// -------- INICIALIZACIÓN --------
function resetGame() {
    Game.level = 1;
    Game.overload = 0;
    Game.combo = 1;
    Game.comboTimer = 0;
    Game.levelProgress = 0;
    Game.timeSurvived = 0;
    Game.bestCombo = 1;

    Snake.init();
    Tetris.init(COLS, ROWS);
    Dino.init(WIDTH, HEIGHT);
    Particles.clear();

    spawnApple();
    glitchApple.active = false;
    glitchApple.timer = 0;

    applyLevelSettings(1);
}

function startGame() {
    resetGame();
    Game.state = State.PLAYING;
    Audio.startMusic();
}

// -------- NIVELES --------
function applyLevelSettings(level) {
    // Velocidad Snake: antes (11 - level/2) era agresivo.
    // Ahora: nivel 1 → 13 frames/paso (~4.6 pasos/seg), nivel 20 → 5 frames/paso
    Snake.setSpeed(Math.max(5, 13 - Math.floor(level / 2.5)));

    // Tetris: antes 55 - level*2 (nivel 1 → 55, nivel 20 → 15).
    // Ahora más suave al inicio: nivel 1 → 70, nivel 20 → 14
    Tetris.setSpeed(Math.max(14, 70 - level * 2.8));

    // Dino velocidad: antes 3 + level*0.25 (nivel 1 → 3.25, ya iba rápido).
    // Ahora: nivel 1 → 2.2, nivel 20 → 6.2
    Dino.setSpeed(2.2 + level * 0.2);

    // Frecuencia de obstáculos: antes 90 - level*3.
    // Ahora más espaciado al inicio.
    Dino.setObstacleInterval(Math.max(45, 120 - level * 3.5));

    Audio.setIntensity((level - 1) / 19);
}

function checkLevelUp() {
    // Sistema por progreso (score acumulado por nivel)
    const need = 100 + Game.level * 60;
    if (Game.levelProgress >= need && Game.level < Game.maxLevel) {
        Game.level++;
        Game.levelProgress = 0;
        Audio.sfx.levelup();
        applyLevelSettings(Game.level);

        // Glitch estético al subir de nivel
        if (Game.level >= 11) Glitches.trigger('freezeTetris');
        if (Game.level >= 16 && Math.random() < 0.6) Glitches.trigger('corruptBlock');
    }
}

// -------- APPLE / GLITCH APPLE --------
function spawnApple() {
    let tries = 0;
    do {
        apple.x = Math.floor(Math.random() * COLS);
        apple.y = Math.floor(Math.random() * ROWS);
        tries++;
    } while (tries < 80 && (
        Snake.body.some(s => s.x === apple.x && s.y === apple.y) ||
        (Tetris.grid[apple.y] && Tetris.grid[apple.y][apple.x])
    ));
}

function spawnGlitchApple() {
    let tries = 0;
    do {
        glitchApple.x = Math.floor(Math.random() * COLS);
        glitchApple.y = Math.floor(Math.random() * ROWS);
        tries++;
    } while (tries < 80 && (
        Snake.body.some(s => s.x === glitchApple.x && s.y === glitchApple.y) ||
        (Tetris.grid[glitchApple.y] && Tetris.grid[glitchApple.y][glitchApple.x])
    ));
    glitchApple.active = true;
    glitchApple.timer = 600; // 10s para comerla
}

// -------- COMBO --------
function addCombo() {
    if (Game.comboTimer > 0) {
        Game.combo = Math.min(Game.combo + 1, 8);
    } else {
        Game.combo = 2;
    }
    Game.comboTimer = Game.comboWindow;
    if (Game.combo > Game.bestCombo) Game.bestCombo = Game.combo;
}

function comboMultiplier() { return Game.combo; }

// -------- INPUT --------
document.addEventListener('keydown', (e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();

    // Skip intro
    if (Game.state === State.INTRO) {
        if (e.key === ' ') {
            Audio.init(); Audio.resume();
            Intro.skip();
            startGame();
        }
        return;
    }

    if (Game.state === State.GAMEOVER || Game.state === State.WIN) {
        if (e.key === ' ') {
            Audio.resume();
            startGame();
        }
        return;
    }

    if (Game.state === State.PLAYING) {
        if (e.key.startsWith('Arrow')) Snake.setInput(e.key);
        if (e.key === ' ') Dino.jump();
        if (e.key === 'a' || e.key === 'A') Tetris.rotate();
        if (e.key === 's' || e.key === 'S') Tetris.softDrop();
    }
});

HUD.bindAudioButtons(() => {
    Audio.init(); Audio.resume();
    return Audio.toggleMusic();
}, () => {
    Audio.init();
    return Audio.toggleSfx();
});

// -------- GAME OVER / WIN --------
function gameOver() {
    Game.state = State.GAMEOVER;
    Audio.sfx.gameover();
    Audio.stopMusic();
}

function victory() {
    Game.state = State.WIN;
    Audio.stopMusic();
}

// -------- UPDATE PRINCIPAL --------
function update() {
    if (Game.state === State.INTRO) {
        Intro.update();
        return;
    }

    if (Game.state === State.PLAYING) {
        Game.timeSurvived++;

        // --- Snake ---
        Snake.update(COLS, ROWS, apple, glitchApple, Tetris.grid, {
            onDeath: () => gameOver(),
            onApple: () => {
                Particles.spawn(apple.x * UNIT + 10, apple.y * UNIT + 10, 8, '#ff3366');
                Audio.sfx.apple();
                addCombo();
                const pts = 10 * comboMultiplier();
                Game.levelProgress += pts;
                Game.totalScore += pts;
                spawnApple();
                // chance glitch apple
                if (!glitchApple.active && Math.random() < 0.05) spawnGlitchApple();
            },
            onGlitchApple: () => {
                Audio.sfx.powerup();
                addCombo();
                Game.totalScore += 25 * comboMultiplier();
                Particles.spawn(glitchApple.x * UNIT + 10, glitchApple.y * UNIT + 10, 25, '#ff00ff', { speed: 6 });
                glitchApple.active = false;
                Glitches.trigger('phase');
            }
        });

        // --- Tetris ---
        const tet = Tetris.update();
        if (tet.cleared > 0) {
            Audio.sfx.line();
            addCombo();
            const pts = 100 * tet.cleared * comboMultiplier();
            Game.levelProgress += pts;
            Game.totalScore += pts;
        }
        if (tet.gameOver) return gameOver();

        // --- Dino ---
        Dino.update({
            onHit: () => gameOver(),
            onDodge: () => {
                Audio.sfx.dodge();
                addCombo();
                const pts = 10 * comboMultiplier();
                Game.levelProgress += pts;
                Game.totalScore += pts;
            }
        });

        // --- Combo timer ---
        if (Game.comboTimer > 0) {
            Game.comboTimer--;
            if (Game.comboTimer === 0) Game.combo = 1;
        }

        // --- Glitch apple life ---
        if (glitchApple.active) {
            glitchApple.timer--;
            if (glitchApple.timer <= 0) glitchApple.active = false;
        }

        // --- Overload ---
        // Sube con el nivel y con la supervivencia
        const targetOverload = Math.min(100,
            (Game.level - 1) * 4 +
            (Game.timeSurvived / 600)
        );
        Game.overload += (targetOverload - Game.overload) * 0.02;

        // Eventos por overload
        if (Game.overload > 75 && Math.random() < 0.002) {
            Glitches.trigger('freezeTetris');
        }
        if (Game.overload > 50 && Math.random() < 0.001) {
            Glitches.trigger('corruptBlock', { color: '#ff00ff' });
        }
        if (Game.overload > 90 && Math.random() < 0.0015) {
            Glitches.trigger('nullObstacle');
        }

        // --- Niveles ---
        checkLevelUp();

        // --- Victoria ---
        if (Game.level >= Game.maxLevel && Game.levelProgress >= 800) {
            victory();
        }
    }

    // Update global
    Glitches.update();
    Particles.update();

    // Recolectar scores individuales
    const snakeScore = Snake.score;
    const tetrisScore = Tetris.score;
    const dinoScore = Dino.score;

    HUD.update({
        snakeScore, tetrisScore, dinoScore,
        totalScore: Game.totalScore,
        level: Game.level,
        overload: Game.overload,
        combo: Game.combo
    });
}

// -------- DRAW --------
function draw() {
    // Fondo
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (Game.state === State.INTRO) {
        Intro.draw(ctx, WIDTH, HEIGHT);
        return;
    }

    // Grid fondo
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += UNIT) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += UNIT) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
    }

    if (Game.state === State.PLAYING) {
        // Tetris (fondo)
        Tetris.draw(ctx);

        // Apples
        // Apple normal
        ctx.fillStyle = '#ff3366';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(apple.x * UNIT + UNIT / 2, apple.y * UNIT + UNIT / 2, UNIT / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Glitch apple
        if (glitchApple.active) {
            const pulse = 0.5 + Math.sin(Date.now() / 80) * 0.5;
            const glitchCol = Math.random() < 0.5 ? '#ff00ff' : '#00ffff';
            ctx.fillStyle = glitchCol;
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 20 + pulse * 15;
            ctx.fillRect(glitchApple.x * UNIT - 2, glitchApple.y * UNIT - 2, UNIT + 4, UNIT + 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(glitchApple.x * UNIT + 5, glitchApple.y * UNIT + 5, UNIT - 10, UNIT - 10);
            ctx.shadowBlur = 0;
        }

        // Dino
        Dino.draw(ctx);

        // Snake
        Snake.draw(ctx);

        // Partículas
        Particles.draw(ctx);

        // Glitch overlay
        Glitches.renderOverlay(ctx, WIDTH, HEIGHT);

        // HUD en canvas (fase)
        if (Snake.isPhasing()) {
            ctx.fillStyle = '#ff00ff';
            ctx.font = 'bold 20px Courier New';
            ctx.shadowColor = '#ff00ff'; ctx.shadowBlur = 15;
            ctx.fillText(`PHASE ${Snake.phaseSeconds()}s`, WIDTH / 2 - 60, 30);
            ctx.shadowBlur = 0;
        }
    }

    if (Game.state === State.GAMEOVER) {
        // Fondo congelado
        Tetris.draw(ctx);
        Dino.draw(ctx);
        Snake.draw(ctx);
        Particles.draw(ctx);

        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Glitch text
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff0044';
        ctx.font = 'bold 60px Courier New';
        ctx.shadowColor = '#ff0044'; ctx.shadowBlur = 25;
        ctx.fillText('SYSTEM FAILURE', WIDTH / 2, HEIGHT / 2 - 100);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 30px Courier New';
        ctx.fillText('GLITCH RUN', WIDTH / 2, HEIGHT / 2 - 50);

        ctx.fillStyle = '#fff';
        ctx.font = '20px Courier New';
        ctx.fillText(`LEVEL REACHED: ${Game.level}`, WIDTH / 2, HEIGHT / 2 + 5);
        ctx.fillText(`🐍 ${Snake.score}   🧩 ${Tetris.score}   🦖 ${Dino.score}`, WIDTH / 2, HEIGHT / 2 + 40);
        ctx.fillText(`BEST COMBO: x${Game.bestCombo}`, WIDTH / 2, HEIGHT / 2 + 75);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 28px Courier New';
        ctx.fillText(`TOTAL: ${Game.totalScore}`, WIDTH / 2, HEIGHT / 2 + 120);

        ctx.fillStyle = '#fff';
        ctx.font = '18px Courier New';
        ctx.fillText('[ SPACE ] RETRY', WIDTH / 2, HEIGHT / 2 + 180);
        ctx.textAlign = 'left';
    }

    if (Game.state === State.WIN) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.textAlign = 'center';

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 50px Courier New';
        ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 30;
        ctx.fillText('SYSTEM STABILIZED', WIDTH / 2, HEIGHT / 2 - 120);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 32px Courier New';
        ctx.fillText('GLITCH CONTAINED', WIDTH / 2, HEIGHT / 2 - 70);
        ctx.fillText('SURVIVAL COMPLETE', WIDTH / 2, HEIGHT / 2 - 30);

        ctx.fillStyle = '#fff';
        ctx.font = '20px Courier New';
        ctx.fillText(`LEVEL 20 / 20`, WIDTH / 2, HEIGHT / 2 + 30);
        ctx.fillText(`SURVIVAL TIME: ${(Game.timeSurvived / 60).toFixed(1)}s`, WIDTH / 2, HEIGHT / 2 + 60);
        ctx.fillText(`BEST COMBO: x${Game.bestCombo}`, WIDTH / 2, HEIGHT / 2 + 90);
        ctx.fillText(`🐍 ${Snake.score}   🧩 ${Tetris.score}   🦖 ${Dino.score}`, WIDTH / 2, HEIGHT / 2 + 120);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 26px Courier New';
        ctx.fillText(`TOTAL: ${Game.totalScore}`, WIDTH / 2, HEIGHT / 2 + 160);

        ctx.fillStyle = '#fff';
        ctx.font = '18px Courier New';
        ctx.fillText('[ SPACE ] PLAY AGAIN', WIDTH / 2, HEIGHT / 2 + 210);
        ctx.textAlign = 'left';
    }
}

// -------- LOOP --------
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min(3, (now - lastTime) / 16.67);
    lastTime = now;
    // FIX: dt aplicado solo a la intro (los demás usan frames fijos)
    if (Game.state === State.INTRO) Intro.update(dt);
    update();
    draw();
    requestAnimationFrame(loop);
}

// Arrancar intro
Intro.reset();
requestAnimationFrame(loop);

// Primer click para desbloquear audio
document.addEventListener('click', () => { Audio.init(); Audio.resume(); }, { once: true });