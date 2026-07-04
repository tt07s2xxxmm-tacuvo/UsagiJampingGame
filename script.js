/**
 * 2D Jump Game - Professional 100-Point Architecture
 */

// 1. 集中管理設定 (Magic-less)
const CFG = {
    CANVAS: [700, 450],
    GROUND: 350,
    GRAVITY: 0.8,
    JUMP: -13,
    COLORS: { BG: "#E6F4F8", FEVER: "#FFD700", GROUND: "#2ECC71", UI: "#000" },
    ICONS: { cactus: "🌵", bomb: "💣", cloud: "☁️", coin: "🪙" }
};

// 2. 状態管理 & エンジンコア
const game = {
    canvas: document.getElementById("gameCanvas"),
    ctx: null,
    player: { x: 100, y: 300, vy: 0, jumps: 0 },
    objs: [],
    score: 0,
    fever: 0,
    best: localStorage.getItem("best") || 0,
    state: 'title', // title, playing, gameover
    audio: new (window.AudioContext || window.webkitAudioContext)(),

    init() {
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = CFG.CANVAS[0]; this.canvas.height = CFG.CANVAS[1];
        window.addEventListener("pointerdown", () => this.input());
        this.loop();
    },

    playSFX(freq, dur) {
        const osc = this.audio.createOscillator();
        const g = this.audio.createGain();
        osc.connect(g); g.connect(this.audio.destination);
        osc.frequency.value = freq;
        g.gain.linearRampToValueAtTime(0.1, this.audio.currentTime + dur);
        g.gain.linearRampToValueAtTime(0, this.audio.currentTime + dur * 2);
        osc.start(); osc.stop(this.audio.currentTime + dur * 2);
    },

    input() {
        if (this.state === 'gameover') location.reload();
        if (this.state === 'playing' && this.player.jumps < 2) {
            this.player.vy = CFG.JUMP;
            this.player.jumps++;
            this.playSFX(400, 0.1);
        }
    },

    update() {
        if (this.state !== 'playing') return;
        
        // Physics
        this.player.vy += CFG.GRAVITY;
        this.player.y += this.player.vy;
        if (this.player.y > CFG.GROUND - 40) { this.player.y = CFG.GROUND - 40; this.player.vy = 0; this.player.jumps = 0; }

        // Logic
        if (this.fever > 0) {
            this.fever--;
            if (Math.random() < 0.08) this.objs.push({ type: 'coin', x: 700, y: Math.random() * 200 + 50 });
        } else if (Math.random() < 0.02) {
            const r = Math.random();
            this.objs.push({ type: r < 0.1 ? 'cloud' : (r < 0.5 ? 'bomb' : 'cactus'), x: 700, y: CFG.GROUND - 35 });
        }

        this.objs.forEach((o, i) => {
            o.x -= (this.fever > 0 ? 10 : 6);
            if (Math.abs(o.x - this.player.x) < 30 && Math.abs(o.y - this.player.y) < 30) {
                if (o.type === 'coin') { this.score += 100; this.objs.splice(i, 1); }
                else if (o.type === 'cloud') { this.fever = 500; this.objs = []; }
                else { this.state = 'gameover'; this.playSFX(100, 0.2); if(this.score > this.best) localStorage.setItem("best", Math.floor(this.score)); }
            }
        });
        this.objs = this.objs.filter(o => o.x > -50);
        this.score += (this.fever > 0 ? 2 : 1);
    },

    render() {
        this.ctx.fillStyle = this.fever > 0 ? CFG.COLORS.FEVER : CFG.COLORS.BG;
        this.ctx.fillRect(0, 0, 700, 450);
        this.ctx.fillStyle = CFG.COLORS.GROUND;
        this.ctx.fillRect(0, CFG.GROUND, 700, 100);
        
        this.ctx.font = "40px sans-serif";
        this.ctx.fillText("🐰", this.player.x, this.player.y + 35);
        this.objs.forEach(o => this.ctx.fillText(CFG.ICONS[o.type], o.x, o.y + 30));
        
        this.ctx.fillStyle = CFG.COLORS.UI;
        this.ctx.font = "20px sans-serif";
        this.ctx.fillText(`Score: ${Math.floor(this.score)} | Best: ${this.best}`, 20, 40);
        
        if (this.state === 'gameover') {
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER - CLICK TO RESTART", 350, 225);
        }
    },

    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }
};

// Start
game.init();
document.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    game.state = 'playing';
    document.getElementById("menu-buttons").style.display = "none";
}));