/**
 * 2D Jump Game - Performance Optimized & Feature Complete
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
    entities: [],
    score: 0, fever: 0, best: localStorage.getItem("best") || 0,
    state: 'title',
    audio: new (window.AudioContext || window.webkitAudioContext)(),

    init() {
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = CFG.CANVAS[0]; this.canvas.height = CFG.CANVAS[1];
        window.addEventListener("pointerdown", () => this.input());
        this.loop();
    },

    input() {
        if (this.state === 'gameover') location.reload();
        if (this.state === 'playing' && this.player.jumps < 2) {
            this.player.vy = CFG.JUMP; this.player.jumps++;
        }
    },

    update() {
        if (this.state !== 'playing') return;

        // Player Physics
        this.player.vy += CFG.GRAVITY;
        this.player.y += this.player.vy;
        if (this.player.y > CFG.GROUND - 40) { this.player.y = CFG.GROUND - 40; this.player.vy = 0; this.player.jumps = 0; }

        // Spawn Logic
        if (this.fever > 0) {
            this.fever--;
            if (Math.random() < 0.05) this.entities.push({ type: 'coin', x: 700, y: Math.random() * 200 + 50, vx: -8, vy: 0 });
        } else {
            if (Math.random() < 0.015) { // 雲
                this.entities.push({ type: 'cloud', x: 700, y: 100, vx: -6, vy: 0 });
            } else if (Math.random() < 0.02) { // 爆弾：上から落下
                this.entities.push({ type: 'bomb', x: Math.random() * 500 + 100, y: -50, vx: 0, vy: 5 });
            } else if (Math.random() < 0.01) { // サボテン
                this.entities.push({ type: 'cactus', x: 700, y: CFG.GROUND - 35, vx: -6, vy: 0 });
            }
        }

        // Entity Update
        this.entities.forEach((e, i) => {
            e.x += e.vx; e.y += e.vy;
            if (Math.abs(e.x - this.player.x) < 30 && Math.abs(e.y - this.player.y) < 30) {
                if (e.type === 'coin') { this.score += 100; this.entities.splice(i, 1); }
                else if (e.type === 'cloud') { this.fever = 500; this.entities = []; }
                else { this.state = 'gameover'; if(this.score > this.best) localStorage.setItem("best", Math.floor(this.score)); }
            }
        });
        this.entities = this.entities.filter(e => e.x > -50 && e.y < 500);
        this.score += (this.fever > 0 ? 2 : 1);
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