// ===============================
// ゲーム設定
// ===============================
const CONFIG = {
    BASE_WIDTH: 700,
    BASE_HEIGHT: 450,
    GROUND_Y: 350,
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12 }
};

class Obstacle {
    constructor(x) {
        this.x = x;
        this.y = CONFIG.GROUND_Y - 35; // 地面に合わせる
        this.width = 30;
    }
    update(speed) {
        this.x -= speed;
    }
    draw(ctx) {
        ctx.font = "32px sans-serif";
        ctx.fillText("🌵", this.x, this.y);
    }
}

class Player {
    constructor() {
        this.x = 100; this.y = 300; this.w = 45; this.h = 45;
        this.vy = 0; this.jumpCount = 0;
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
        this.obstacles = [];
        this.isTitle = true;
        this.spawnTimer = 0;
        this.gameSpeed = 0;

        window.addEventListener("resize", () => this.resize());
        this.resize();
        this.initInput();
        this.draw(); // 初期描画
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

        document.querySelectorAll("#menu-buttons button").forEach(btn => {
            btn.addEventListener("click", (e) => {
                this.startGame(parseInt(e.target.dataset.speed));
            });
        });
    }

    startGame(speed) {
        this.isTitle = false;
        this.gameSpeed = speed;
        document.getElementById("menu-buttons").style.display = "none";
        this.loop();
    }

    loop() {
        if (this.isTitle) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.player.update();
        
        // 障害物の生成ロジックを確実に実行
        this.spawnTimer++;
        if (this.spawnTimer > 100) {
            this.obstacles.push(new Obstacle(CONFIG.BASE_WIDTH));
            this.spawnTimer = 0;
        }

        // 移動と破棄
        this.obstacles.forEach(obs => obs.update(this.gameSpeed));
        this.obstacles = this.obstacles.filter(obs => obs.x > -50);
    }

    draw() {
        this.canvas.width = CONFIG.BASE_WIDTH;
        this.canvas.height = CONFIG.BASE_HEIGHT;
        this.ctx.fillStyle = "#E6F4F8";
        this.ctx.fillRect(0, 0, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT);
        this.ctx.fillStyle = "#2ECC71";
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT - CONFIG.GROUND_Y);
        
        this.player.draw(this.ctx);
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        
        if (this.isTitle) {
            this.ctx.fillStyle = "#1A5276";
            this.ctx.font = "bold 30px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText("ボタンを押して開始！", CONFIG.BASE_WIDTH / 2, CONFIG.BASE_HEIGHT / 2);
        }
    }
}

new Game();