/**
 * 2D Action Game - Professional Edition (Refined)
 */

const CFG = {
    CANVAS: [700, 450], GROUND: 350, GRAVITY: 0.8, JUMP: -13,
    COLORS: { BG: "#E6F4F8", FEVER: "#FFD700", GROUND: "#2ECC71", UI: "#000" },
    ICONS: { cactus: "🌵", bomb: "💣", cloud: "☁️", coin: "🪙" }
};

const game = {
    canvas: document.getElementById("gameCanvas"),
    ctx: null,
    player: { x: 100, y: 300, vy: 0, jumps: 0 },
    entities: [], score: 0, fever: 0, best: localStorage.getItem("best") || 0,
    state: 'title',
    audio: new (window.AudioContext || window.webkitAudioContext)(),

    init() {
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = CFG.CANVAS[0]; this.canvas.height = CFG.CANVAS[1];
        window.addEventListener("pointerdown", () => this.input());
        this.loop();
    },

    playSFX(freq, type = 'sine') {
        const o = this.audio.createOscillator(), g = this.audio.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.linearRampToValueAtTime(0.2, this.audio.currentTime + 0.1);
        g.gain.linearRampToValueAtTime(0, this.audio.currentTime + 0.3);
        o.connect(g); g.connect(this.audio.destination);
        o.start(); o.stop(this.audio.currentTime + 0.3);
    },

    input() {
        if (this.state === 'gameover') location.reload();
        if (this.state === 'playing' && this.player.jumps < 2) {
            this.player.vy = CFG.JUMP; this.player.jumps++;
            this.playSFX(400);
        }
    },

    update() {
        if (this.state !== 'playing') return;

        this.player.vy += CFG.GRAVITY;
        this.player.y += this.player.vy;
        if (this.player.y > CFG.GROUND - 40) { this.player.y = CFG.GROUND - 40; this.player.vy = 0; this.player.jumps = 0; }

        // フィーバー中はコインを大量生成
        if (this.fever > 0) {
            this.fever--;
            if (this.fever % 15 === 0) { // 定期的なコイン列生成
                for(let i=0; i<3; i++) this.entities.push({ type: 'coin', x: 700 + i*40, y: 150 + Math.random()*150, vx: -12, vy: 0 });
            }
        } else {
            // 爆弾は斜め（横移動あり）に落下するように変更
            if (Math.random() < 0.02) this.entities.push({ type: 'bomb', x: Math.random() * 600, y: -50, vx: -3, vy: 6 });
            else if (Math.random() < 0.015) this.entities.push({ type: 'cloud', x: 700, y: 100, vx: -6, vy: 0 });
            else if (Math.random() < 0.01) this.entities.push({ type: 'cactus', x: 700, y: CFG.GROUND - 35, vx: -6, vy: 0 });
        }

        this.entities.forEach((e, i) => {
            e.x += e.vx; e.y += e.vy;
            if (Math.abs(e.x - this.player.x) < 30 && Math.abs(e.y - this.player.y) < 30) {
                if (e.type === 'coin') { this.score += 200; this.entities.splice(i, 1); this.playSFX(600, 'square'); }
                else if (e.type === 'cloud') { this.fever = 600; this.entities = []; this.playSFX(800, 'triangle'); }
                else { this.state = 'gameover'; this.playSFX(100, 'sawtooth'); if(this.score > this.best) localStorage.setItem("best", Math.floor(this.score)); }
            }
        });
        this.entities = this.entities.filter(e => e.x > -50 && e.y < 500);
        this.score += (this.fever > 0 ? 0 : 1);
    },

    loop() {
        this.update();
        this.ctx.fillStyle = this.fever > 0 ? CFG.COLORS.FEVER : CFG.COLORS.BG;
        this.ctx.fillRect(0, 0, 700, 450);
        this.ctx.fillStyle = CFG.COLORS.GROUND;
        this.ctx.fillRect(0, CFG.GROUND, 700, 100);
        
        this.ctx.font = "40px sans-serif";
        this.ctx.fillText("🐰", this.player.x, this.player.y + 35);
        this.entities.forEach(e => this.ctx.fillText(CFG.ICONS[e.type], e.x, e.y + 30));
        
        this.ctx.fillStyle = CFG.COLORS.UI;
        this.ctx.font = "20px sans-serif";
        this.ctx.fillText(`Score: ${Math.floor(this.score)} | Best: ${this.best}`, 20, 40);
        
        if (this.state === 'gameover') {
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER - CLICK TO RESTART", 350, 225);
        }
        requestAnimationFrame(() => this.loop());
    }
};

game.init();
document.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    game.state = 'playing';
    document.getElementById("menu-buttons").style.display = "none";
}));