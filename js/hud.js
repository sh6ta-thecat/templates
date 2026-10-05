// ==================================================
// HUD MODULE
// ==================================================
const HUD = (() => {
    const el = {
        total:   () => document.getElementById('totalScore'),
        snake:   () => document.getElementById('snakeScore'),
        tetris:  () => document.getElementById('tetrisScore'),
        dino:    () => document.getElementById('dinoScore'),
        level:   () => document.getElementById('levelDisplay'),
        overload:() => document.getElementById('overloadDisplay'),
        combo:   () => document.getElementById('comboDisplay'),
        comboBox:() => document.querySelector('.comboStat'),
        btnMusic:() => document.getElementById('btnMusic'),
        btnSfx:  () => document.getElementById('btnSfx')
    };

    function update(state) {
        el.snake().textContent   = Math.floor(state.snakeScore);
        el.tetris().textContent  = Math.floor(state.tetrisScore);
        el.dino().textContent    = Math.floor(state.dinoScore);
        el.total().textContent   = Math.floor(state.totalScore);
        el.level().textContent   = `${state.level}/20`;
        el.overload().textContent = `${Math.floor(state.overload)}%`;
        el.combo().textContent   = `x${state.combo}`;
        if (state.combo > 1) el.comboBox().classList.add('active');
        else el.comboBox().classList.remove('active');
    }

    function bindAudioButtons(onMusic, onSfx) {
        el.btnMusic().addEventListener('click', () => {
            const on = onMusic();
            el.btnMusic().textContent = on ? '🎵 MUSIC ON' : '🎵 MUSIC OFF';
        });
        el.btnSfx().addEventListener('click', () => {
            const on = onSfx();
            el.btnSfx().textContent = on ? '🔊 SFX ON' : '🔊 SFX OFF';
        });
    }

    return { update, bindAudioButtons };
})();