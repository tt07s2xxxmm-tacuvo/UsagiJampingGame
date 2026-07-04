// ===============================
// ゲーム設定
// ===============================
const CONFIG = {
    BASE_WIDTH: 700,
    BASE_HEIGHT: 450,
    GROUND_Y: 350,
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12 }
};

class Player {
    constructor() {
        this.x = 100;
        this.y = 300;
        this.w = 45;
        this.h = 45;
        this.vy = 0;
        this.jumpCount = 0;
    }
    update() {
        this.vy += CONFIG.PHYSICS.GRAVITY;
        this.y += this.vy;
        if (this.y >= CONFIG.GROUND_Y - this.h) {
            this.y = CONFIG.GROUND_Y - this.h;
            this.vy = 0;
            this.jumpCount = 0;
        }
    }
    jump() {
        if (this.jumpCount < 2) {
            this.vy = CONFIG.PHYSICS.JUMP_SPEED;
            this.jumpCount++;
        }
    }
    draw(ctx) {
        ctx.font = "42px sans-serif";
        ctx.fillText("🐰", this.x, this.y);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.player = new Player();
        this.isTitle = true;

        window.addEventListener("resize", () => this.resize());
        this.resize();
        this.initInput();
        
        // 初回描画（タイトル画面）
        this.draw();
    }

    resize() {
        const aspectRatio = CONFIG.BASE_WIDTH / CONFIG.BASE_HEIGHT;
        if (window.innerWidth / window.innerHeight > aspectRatio) {
            this.canvas.style.height = "100vh";
            this.canvas.style.width = (window.innerHeight * aspectRatio) + "px";
        } else {
            this.canvas.style.width = "100vw";
            this.canvas.style.height = (window.innerWidth / aspectRatio) + "px";
        }
    }

    initInput() {
        window.addEventListener("pointerdown", (e) => {
            if (e.target.tagName === "BUTTON") return;
            if (!this.isTitle) this.player.jump();
        });
    }

    startGame(speed, min, max, target) {
        this.isTitle = false;
        document.getElementById("menu-buttons").style.display = "none";
        document.getElementById("score-label").style.display = "block";
        document.getElementById("info-label").style.display = "block";
        
        this.difficulty = { speed, min, max, target };
        
        // ループを開始
        this.loop();
    }

    loop() {
        // タイトル画面ならループを抜ける
        if (this.isTitle) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.player.update();
    }

    draw() {
        this.canvas.width = CONFIG.BASE_WIDTH;
        this.canvas.height = CONFIG.BASE_HEIGHT;
        this.ctx.fillStyle = "#E6F4F8";
        this.ctx.fillRect(0, 0, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT);
        this.ctx.fillStyle = "#2ECC71";
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT - CONFIG.GROUND_Y);
        
        if (this.isTitle) {
            this.ctx.fillStyle = "#1A5276";
            this.ctx.font = "bold 30px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText("ボタンを押して開始！", CONFIG.BASE_WIDTH / 2, CONFIG.BASE_HEIGHT / 2);
        } else {
            this.player.draw(this.ctx);
        }
    }
}

const game = new Game();
// グローバル関数として公開
window.startGame = (s, mi, ma, t) => game.startGame(s, mi, ma, t);