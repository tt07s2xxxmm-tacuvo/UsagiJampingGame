// ===============================
// ゲーム設定 (AudioContext等は遅延初期化します)
// ===============================
const CONFIG = {
    BASE_WIDTH: 700, BASE_HEIGHT: 450, GROUND_Y: 350,
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12 },
    PLAYER: { W: 40, H: 40 }, OBSTACLE: { W: 30, H: 35 }
};

// ===============================
// サウンド管理 (Web Audio API)
// ===============================
class Sound {
    constructor() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    play(type) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        if (type === 'jump') { osc.frequency.value = 300; gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2); }
        else { osc.frequency.value = 100; gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5); }
        osc.start(); osc.stop(this.ctx.currentTime + 0.5);
    }
}

class Obstacle {
    constructor(x) { this.x = x; this.y = CONFIG.GROUND_Y - CONFIG.OBSTACLE.H; this.width = CONFIG.OBSTACLE.W; this.height = CONFIG.OBSTACLE.H; }
    update(speed) { this.x -= speed; }
    draw(ctx) { ctx.font = "32px sans-serif"; ctx.fillText("🌵", this.x, this.y + 30); }
}

class Player {
    constructor() { this.x = 100; this.y = 300; this.w = CONFIG.PLAYER.W; this.h = CONFIG.PLAYER.H; this.vy = 0; this.jumpCount = 0; }
    update() {
        this.vy += CONFIG.PHYSICS.GRAVITY; this.y += this.vy;
        if (this.y >= CONFIG.GROUND_Y - this.h) { this.y = CONFIG.GROUND_Y - this.h; this.vy = 0; this.jumpCount = 0; }
    }
    jump() { if (this.jumpCount < 2) { this.vy = CONFIG.PHYSICS.JUMP_SPEED; this.jumpCount++; return true; } return false; }
    draw(ctx) { ctx.font = "40px sans-serif"; ctx.fillText("🐰", this.x, this.y + 35); }
}

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.sound = new Sound();
        this.player = new Player();
        this.obstacles = [];
        this.score = 0;
        this.bestScore = localStorage.getItem("bestScore") || 0;
        this.isTitle = true; this.isGameOver = false; this.spawnTimer = 0;

        this.initInput();
        this.draw();
    }

    initInput() {
        window.addEventListener("pointerdown", (e) => {
            if (e.target.tagName === "BUTTON") return;
            if (this.isGameOver) location.reload();
            if (!this.isTitle && this.player.jump()) this.sound.play('jump');
        });
        document.querySelectorAll("#menu-buttons button").forEach(btn => {
            btn.addEventListener("click", (e) => this.startGame(parseInt(e.target.dataset.speed)));
        });
    }

    startGame(speed) {
        this.isTitle = false; this.gameSpeed = speed;
        document.getElementById("menu-buttons").style.display = "none";
        this.loop();
    }

    update() {
        this.player.update();
        this.score++;
        this.spawnTimer++;
        if (this.spawnTimer > 100) { this.obstacles.push(new Obstacle(CONFIG.BASE_WIDTH)); this.spawnTimer = 0; }

        this.obstacles.forEach(obs => {
            obs.update(this.gameSpeed);
            if (this.player.x < obs.x + obs.width && this.player.x + this.player.w > obs.x &&
                this.player.y < obs.y + obs.height && this.player.y + this.player.h > obs.y) {
                this.isGameOver = true;
                this.sound.play('hit');
                if (this.score > this.bestScore) localStorage.setItem("bestScore", this.score);
            }
        });
        this.obstacles = this.obstacles.filter(obs => obs.x > -50);
    }

    draw() {
        this.canvas.width = CONFIG.BASE_WIDTH; this.canvas.height = CONFIG.BASE_HEIGHT;
        this.ctx.fillStyle = "#E6F4F8"; this.ctx.fillRect(0, 0, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT);
        this.ctx.fillStyle = "#2ECC71"; this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT - CONFIG.GROUND_Y);
        
        this.player.draw(this.ctx);
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        
        this.ctx.fillStyle = "black"; this.ctx.font = "20px sans-serif";
        this.ctx.fillText(`Score: ${this.score}  Best: ${this.bestScore}`, 100, 50);

        if (this.isGameOver) {
            this.ctx.fillStyle = "red"; this.ctx.font = "bold 50px sans-serif";
            this.ctx.textAlign = "center"; this.ctx.fillText("GAME OVER", CONFIG.BASE_WIDTH / 2, CONFIG.BASE_HEIGHT / 2);
        }
    }

    loop() {
        if (this.isTitle || this.isGameOver) return;
        this.update(); this.draw();
        requestAnimationFrame(() => this.loop());
    }
}
new Game();