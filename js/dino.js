// ==================================================
// DINO MODULE
// ==================================================
const Dino = (() => {
    const GROUND_OFFSET = 100;
    const GRAVITY = 0.8;
    const JUMP_FORCE = -16;

    let W = 900, H = 600;
    let dino = { x: 50, y: 0, w: 30, h: 40, vy: 0, jumping: false };
    let obstacles = [];
    let obstacleTimer = 0;
    let obstacleInterval = 80;
    let speed = 4;
    let score = 0;

    function init(w, h) {
        W = w; H = h;
        dino.y = H - GROUND_OFFSET;
        dino.vy = 0;
        dino.jumping = false;
        obstacles = [];
        obstacleTimer = 0;
        score = 0;
    }

    function setSpeed(s) { speed = s; }
    function setObstacleInterval(i) { obstacleInterval = i; }

    function jump() {
        if (!dino.jumping) {
            dino.vy = JUMP_FORCE;
            dino.jumping = true;
            Audio.sfx.jump();
        }
    }

    function spawnObstacle() {
        const big = Math.random() < 0.4;
        obstacles.push({
            x: W,
            y: H - GROUND_OFFSET + 40 - (big ? 60 : 35),
            w: big ? 25 : 20,
            h: big ? 60 : 35,
            color: '#888'
        });
    }

    function removeFirstObstacle() {
        if (obstacles.length) obstacles.shift();
    }

    function duplicateObstacle() {
        if (obstacles.length) {
            const o = obstacles[0];
            obstacles.push({ ...o, x: o.x + 200 });
        }
    }

    function update(callbacks) {
        // física
        dino.vy += GRAVITY;
        dino.y += dino.vy;
        const groundY = H - GROUND_OFFSET;
        if (dino.y >= groundY) {
            dino.y = groundY;
            dino.vy = 0;
            dino.jumping = false;
        }

        // spawn
        obstacleTimer++;
        if (obstacleTimer > obstacleInterval && Math.random() < 0.03) {
            spawnObstacle();
            obstacleTimer = 0;
        }

        // mover + colisiones
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.x -= speed;
            // colisión
            if (o.x < dino.x + dino.w &&
                o.x + o.w > dino.x &&
                o.y < dino.y + dino.h &&
                o.y + o.h > dino.y) {
                callbacks.onHit();
                return;
            }
            // fuera de pantalla
            if (o.x + o.w < 0) {
                obstacles.splice(i, 1);
                score += 10;
                callbacks.onDodge();
            }
        }
    }

    function draw(ctx) {
        // suelo
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, H - GROUND_OFFSET + 40);
        ctx.lineTo(W, H - GROUND_OFFSET + 40);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // obstáculos
        obstacles.forEach(o => {
            ctx.fillStyle = o.color;
            ctx.shadowColor = '#666';
            ctx.shadowBlur = 6;
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.fillStyle = '#555';
            ctx.fillRect(o.x + o.w / 2 - 2, o.y - 8, 4, 8);
            ctx.shadowBlur = 0;
        });

        // dino
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12;
        ctx.fillRect(dino.x, dino.y + 10, dino.w, dino.h - 10);
        ctx.fillRect(dino.x + 5, dino.y, dino.w - 5, 15);
        ctx.shadowBlur = 0;
        // ojo
        ctx.fillStyle = '#fff';
        ctx.fillRect(dino.x + 20, dino.y + 4, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(dino.x + 21, dino.y + 5, 2, 2);
        // patas
        ctx.fillStyle = '#cc0000';
        const legOff = dino.jumping ? 0 : Math.sin(Date.now() / 100) * 3;
        ctx.fillRect(dino.x + 3, dino.y + dino.h - 2 + legOff, 8, 6);
        ctx.fillRect(dino.x + dino.w - 12, dino.y + dino.h - 2 - legOff, 8, 6);
    }

    return {
        init, update, draw, jump, setSpeed, setObstacleInterval,
        removeFirstObstacle, duplicateObstacle,
        get score() { return score; },
        get x() { return dino.x; },
        get y() { return dino.y; },
        get w() { return dino.w; },
        get h() { return dino.h; },
        get obstacles() { return obstacles; }
    };
})();
