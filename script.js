/**
 * 2D Action Game - Refactored Edition
 */

// ===============================
// 設定管理 (マジックナンバー排除)
// ===============================
const CONFIG = {
    CANVAS: { WIDTH: 700, HEIGHT: 450, BACKGROUND: "#E6F4F8", FEVER_COLOR: "#FFD700", GROUND_COLOR: "#2ECC71" },
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12, GROUND_Y: 350 },
    PLAYER: { X: 100, W: 40, H: 40, ICON: "🐰" },
    OBSTACLES: { W: 30, H: 35, SPAWN_INTERVAL: 60, FEVER_DURATION: 300 },
    ICONS: { CACTUS: "🌵", BOMB: "💣", CLOUD: "☁️" }
};

// ===============================
// 入力管理 (InputManager)
// ===============================
class InputManager {
    constructor(callback) {
        this.callback = callback;
        this.init();
    }
    init() {
        window.addEventListener("pointerdown", (e) => {
            if (e.target.tagName === "BUTTON") return;
            this.callback();
        });
    }
}

// ===============================
// 物理・描画用クラス群
// ===============================
class Player {
    constructor() { this.reset(); }
    reset() {
        this.x = CONFIG.PLAYER.X;
        this.y = CONFIG.PHYSICS.GROUND_Y - CONFIG.PLAYER.H;
        this.vy = 0;
        this.jumpCount = 0;
    }
    update() {
        this.vy += CONFIG.PHYSICS.GRAVITY;
        this.y += this.vy;
        if (this.y >= CONFIG.PHYSICS.GROUND_Y - CONFIG.PLAYER.H) {
            this.y = CONFIG.PHYSICS.GROUND_Y - CONFIG.PLAYER.H;
            this.vy = 0;
            this.jumpCount = 0;
        }
    }
    jump() {
        if (this.jumpCount < 2) {
            this.vy = CONFIG.PHYSICS.JUMP_SPEED;
            this.jumpCount++;
            return true;
        }
        return false;
    }
    draw(ctx) {
        ctx.font = "40px sans-serif";
        ctx.fillText(CONFIG.PLAYER.ICON, this.x, this.y + 35);
    }
}

class Obstacle {
    constructor(type) {
        this.type = type;
        this.x = CONFIG.CANVAS.WIDTH;
        this.y = (type === 'cloud') ? 100 : CONFIG.PHYSICS.GROUND_Y - 35;
    }
    update(speed, isFever) {
        this.x -= (this.type === 'cloud') ? speed * 0.5 : speed;
    }
    draw(ctx) {
        ctx.font = "35px sans-serif";
        const icon = this.type === 'bomb' ? CONFIG.ICONS.BOMB : (this.type === 'cloud' ? CONFIG.ICONS.CLOUD : CONFIG.ICONS.CACTUS);
        ctx.fillText(icon, this.x, this.y + 30);
    }
}

// ===============================
// ゲームメイン (GameEngine)
// ===============================
class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.player = new Player();
        this.obstacles = [];
        this.score = 0;
        this.fever = 0;
        this.state = 'title'; // title, playing, gameover
        this.bestScore = localStorage.getItem("bestScore") || 0;
        
        this.input = new InputManager(() => this.handleInput());
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    handleInput() {
        if (this.state === 'gameover') location.reload();
        if (this.state === 'playing') this.player.jump();
    }

    update() {
        if (this.state !== 'playing') return;

        this.player.update();
        this.score += (this.fever > 0) ? 5 : 1;
        if (this.fever > 0) this.fever--;

        if (Math.random() < 0.02) {
            const types = ['cactus', 'cactus', 'bomb', 'cloud'];
            this.obstacles.push(new Obstacle(types[Math.floor(Math.random() * types.length)]));
        }

        this.obstacles.forEach((obs, index) => {
            obs.update(5, this.fever > 0);
            // 衝突判定 (AABB)
            if (obs.x < this.player.x + CONFIG.PLAYER.W && obs.x + 30 > this.player.x &&
                obs.y < this.player.y + CONFIG.PLAYER.H && obs.y + 35 > this.player.y) {
                if (obs.type === 'cloud') {
                    this.fever = CONFIG.OBSTACLES.FEVER_DURATION;
                    this.obstacles.splice(index, 1);
                } else {
                    this.gameOver();
                }
            }
        });
        this.obstacles = this.obstacles.filter(o => o.x > -50);
    }

    draw() {
        this.ctx.fillStyle = (this.fever > 0) ? CONFIG.CANVAS.FEVER_COLOR : CONFIG.CANVAS.BACKGROUND;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
        
        this.ctx.fillStyle = CONFIG.CANVAS.GROUND_COLOR;
        this.ctx.fillRect(0, CONFIG.PHYSICS.GROUND_Y, CONFIG.CANVAS.WIDTH, 100);

        this.player.draw(this.ctx);
        this.obstacles.forEach(o => o.draw(this.ctx));

        this.ctx.fillStyle = "black";
        this.ctx.font = "20px sans-serif";
        this.ctx.fillText(`Score: ${Math.floor(this.score)} | Best: ${this.bestScore}`, 20, 40);

        if (this.state === 'gameover') {
            this.ctx.fillStyle = "red";
            this.ctx.font = "bold 50px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER", CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2);
        }
    }

    gameOver() {
        this.state = 'gameover';
        if (this.score > this.bestScore) localStorage.setItem("bestScore", Math.floor(this.score));
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }

    start(speed) {
        this.state = 'playing';
        document.getElementById("menu-buttons").style.display = "none";
    }
}

// 起動
const game = new Game();
// ボタンのリスナー設定
document.querySelectorAll("#menu-buttons button").forEach(btn => 
    btn.addEventListener("click", () => game.start())
);