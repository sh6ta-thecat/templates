// ==================================================
// AUDIO MODULE - Web Audio API (no external libs)
// ==================================================
const Audio = (() => {
    let ctx = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;
    let musicOn = true;
    let sfxOn = true;
    let musicInterval = null;
    let musicStep = 0;
    let currentIntensity = 0;

    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(ctx.destination);

        musicGain = ctx.createGain();
        musicGain.gain.value = 0.18;
        musicGain.connect(masterGain);

        sfxGain = ctx.createGain();
        sfxGain.gain.value = 0.35;
        sfxGain.connect(masterGain);
    }

    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

    function beep(freq, duration, type = 'square', gainNode = sfxGain, vol = 1) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(g);
        g.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    function sweep(freqStart, freqEnd, duration, type = 'sawtooth', vol = 1) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(g); g.connect(sfxGain);
        osc.start(); osc.stop(ctx.currentTime + duration);
    }

    function noise(duration, vol = 0.4) {
        if (!ctx) return;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        src.connect(g); g.connect(sfxGain);
        src.start();
    }

    // --- SFX ---
    const sfx = {
        apple()   { if (!sfxOn) return; beep(660, 0.08, 'square'); setTimeout(() => beep(990, 0.08, 'square'), 60); },
        line()    { if (!sfxOn) return; [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle'), i * 55)); },
        jump()    { if (!sfxOn) return; sweep(300, 700, 0.15, 'square', 0.6); },
        dodge()   { if (!sfxOn) return; beep(880, 0.05, 'sine', sfxGain, 0.5); },
        glitch()  { if (!sfxOn) return; noise(0.12, 0.35); sweep(1800, 200, 0.2, 'sawtooth', 0.4); },
        gameover(){ if (!sfxOn) return; sweep(440, 55, 0.9, 'sawtooth', 0.7); noise(0.7, 0.3); },
        levelup() { if (!sfxOn) return; [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'square'), i * 70)); },
        powerup() { if (!sfxOn) return; sweep(400, 1600, 0.4, 'triangle', 0.6); noise(0.2, 0.2); },
        rotate()  { if (!sfxOn) return; beep(500, 0.04, 'square', sfxGain, 0.4); },
        impact()  { if (!sfxOn) return; noise(0.15, 0.4); beep(120, 0.1, 'sawtooth', sfxGain, 0.5); }
    };

    // --- Music (procedural) ---
    const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    const BASS  = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66];

    function musicTick() {
        if (!ctx || !musicOn) return;
        const intensity = currentIntensity; // 0..1
        const baseStep = 220; // ms
        const note = SCALE[Math.floor(Math.random() * SCALE.length)] * (1 + intensity * 0.3);
        const bassNote = BASS[Math.floor(Math.random() * BASS.length)];

        // Lead
        if (Math.random() < 0.7 + intensity * 0.2) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = note;
            g.gain.setValueAtTime(0.05 + intensity * 0.05, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
            osc.connect(g); g.connect(musicGain);
            osc.start(); osc.stop(ctx.currentTime + 0.16);
        }
        // Bass
        if (musicStep % 2 === 0) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = bassNote;
            g.gain.setValueAtTime(0.09, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            osc.connect(g); g.connect(musicGain);
            osc.start(); osc.stop(ctx.currentTime + 0.26);
        }
        // Kick
        if (musicStep % 4 === 0) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
            osc.connect(g); g.connect(musicGain);
            osc.start(); osc.stop(ctx.currentTime + 0.13);
        }
        musicStep++;
    }

    function startMusic() {
        if (musicInterval || !ctx) return;
        musicStep = 0;
        musicInterval = setInterval(musicTick, 220);
    }

    function stopMusic() {
        if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
    }

    function setIntensity(v) { currentIntensity = Math.max(0, Math.min(1, v)); }

    function toggleMusic() {
        musicOn = !musicOn;
        if (musicOn) startMusic(); else stopMusic();
        return musicOn;
    }

    function toggleSfx() { sfxOn = !sfxOn; return sfxOn; }

    return {
        init, resume, sfx, startMusic, stopMusic, setIntensity,
        toggleMusic, toggleSfx,
        get musicOn() { return musicOn; },
        get sfxOn()   { return sfxOn;   }
    };
})();