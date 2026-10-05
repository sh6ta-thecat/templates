// ==================================================
// TETRIS MODULE
// ==================================================
const Tetris = (() => {
    const UNIT = 20;
    let COLS = 45, ROWS = 30;
    let grid = [];
    let current = null;
    let timer = 0;
    let fallInterval = 40;
    let frozen = false;
    let corruptCells = []; // {x,y,timer}
    let score = 0;

    const SHAPES = [
        [[1,1,1,1]],
        [[1,1],[1,1]],
        [[1,1,1],[0,1,0]],
        [[1,1,1],[1,0,0]],
        [[1,1,1],[0,0,1]],
        [[0,1,1],[1,1,0]],
        [[1,1,0],[0,1,1]]
    ];
    const COLORS = ['#00ffff','#ffff00','#ff00ff','#ff8800','#0066ff','#00ff00','#ff0000'];

    function init(cols, rows) {
        COLS = cols; ROWS = rows;
        grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        timer = 0;
        fallInterval = 40;
        frozen = false;
        corruptCells = [];
        score = 0;
        spawn();
    }

    function setSpeed(interval) { fallInterval = interval; }
    function setFrozen(v) { frozen = v; }
    function isFrozen() { return frozen; }

    function spawn() {
        const idx = Math.floor(Math.random() * SHAPES.length);
        current = {
            shape: SHAPES[idx].map(r => [...r]),
            color: COLORS[idx],
            x: Math.floor(COLS / 2) - Math.ceil(SHAPES[idx][0].length / 2),
            y: 0
        };
    }

    function check(shape, bx, by) {
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j]) {
                    const nx = bx + j, ny = by + i;
                    if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                    if (ny >= 0 && grid[ny][nx]) return true;
                }
            }
        }
        return false;
    }

    function rotate() {
        if (!current || frozen) return;
        const old = current.shape;
        const rotated = old[0].map((_, i) => old.map(r => r[i]).reverse());
        if (!check(rotated, current.x, current.y)) {
            current.shape = rotated;
            Audio.sfx.rotate();
        }
    }

    function softDrop() {
        if (!current || frozen) return;
        if (!check(current.shape, current.x, current.y + 1)) current.y++;
        else place();
    }

    function place() {
        current.shape.forEach((row, i) => row.forEach((v, j) => {
            if (v) {
                const ny = current.y + i, nx = current.x + j;
                if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) grid[ny][nx] = current.color;
            }
        }));
        const cleared = clearLines();
        spawn();
        if (check(current.shape, current.x, current.y)) return { gameOver: true, cleared };
        return { gameOver: false, cleared };
    }

    function clearLines() {
        let cleared = 0;
        for (let i = ROWS - 1; i >= 0; i--) {
            if (grid[i].every(c => c !== 0)) {
                grid.splice(i, 1);
                grid.unshift(Array(COLS).fill(0));
                cleared++;
                score += 100;
                i++;
            }
        }
        return cleared;
    }

    function update() {
        if (!current || frozen) return { gameOver: false, cleared: 0 };
        timer++;
        if (timer >= fallInterval) {
            timer = 0;
            if (!check(current.shape, current.x, current.y + 1)) current.y++;
            else return place();
        }
        return { gameOver: false, cleared: 0 };
    }

    function corruptRandomBlock(color = '#ff00ff') {
        // Encuentra celdas rellenas y elige algunas
        const filled = [];
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x]) filled.push({x, y});
        if (filled.length === 0) return;
        for (let k = 0; k < 4 && filled.length; k++) {
            const c = filled.splice(Math.floor(Math.random() * filled.length), 1)[0];
            corruptCells.push({ x: c.x, y: c.y, timer: 60, color });
        }
    }

    function clearCorrupt() { corruptCells = []; }

    function draw(ctx) {
        // grid llena
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (grid[y][x]) {
                    ctx.fillStyle = grid[y][x];
                    ctx.fillRect(x * UNIT, y * UNIT, UNIT, UNIT);
                    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                    ctx.strokeRect(x * UNIT, y * UNIT, UNIT, UNIT);
                }
            }
        }
        // celdas corruptas
        corruptCells.forEach(c => {
            if (c.timer > 0) {
                ctx.fillStyle = Math.random() < 0.5 ? c.color : '#ffffff';
                ctx.fillRect(c.x * UNIT, c.y * UNIT, UNIT, UNIT);
                c.timer--;
            }
        });
        corruptCells = corruptCells.filter(c => c.timer > 0);

        // pieza actual
        if (current) {
            ctx.fillStyle = frozen ? '#888' : current.color;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = frozen ? 0 : 12;
            current.shape.forEach((row, i) => row.forEach((v, j) => {
                if (v) {
                    ctx.fillRect((current.x + j) * UNIT, (current.y + i) * UNIT, UNIT, UNIT);
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.strokeRect((current.x + j) * UNIT, (current.y + i) * UNIT, UNIT, UNIT);
                }
            }));
            ctx.shadowBlur = 0;
        }
    }

    return {
        init, update, draw, rotate, softDrop,
        setSpeed, setFrozen, isFrozen,
        corruptRandomBlock, clearCorrupt,
        get score() { return score; },
        get grid()  { return grid;  },
        get cols()  { return COLS;  },
        get rows()  { return ROWS;  }
    };
})();