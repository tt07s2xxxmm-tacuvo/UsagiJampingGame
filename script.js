// ===============================
// ゲーム設定
// ===============================
const CONFIG = {
    BASE_WIDTH: 700,
    BASE_HEIGHT: 450,
    GROUND_Y: 350,
    PLAYER: { X: 100, Y: 300, W: 45, H: 45 },
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12 }
};

class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.isTitle = true;

        // リサイズ処理の紐付け
        window.addEventListener("resize", () => this.resize());
        this.resize();

        this.initInput();
    }

    // 画面サイズに合わせてCanvasを調整する関数
    resize() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        const aspectRatio = CONFIG.BASE_WIDTH / CONFIG.BASE_HEIGHT;

        // 画面比率を維持して最大化
        if (displayWidth / displayHeight > aspectRatio) {
            this.canvas.style.height = "100vh";
            this.canvas.style.width = (displayHeight * aspectRatio) + "px";
        } else {
            this.canvas.style.width = "100vw";
            this.canvas.style.height = (displayWidth / aspectRatio) + "px";
        }
    }

    initInput() {
        window.addEventListener("pointerdown", (e) => {
            if (e.target.tagName === "BUTTON") return;
            this.handleAction();
        });
    }

    handleAction() {
        if (this.isTitle) {
            this.start();
        } else {
            console.log("ジャンプ処理を実装予定");
        }
    }

    start() {
        this.isTitle = false;
        this.loop();
    }

    loop() {
        if (this.isTitle) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {}

    draw() {
        // 現在の描画解像度をベースサイズに固定
        this.canvas.width = CONFIG.BASE_WIDTH;
        this.canvas.height = CONFIG.BASE_HEIGHT;

        this.ctx.fillStyle = "#E6F4F8";
        this.ctx.fillRect(0, 0, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT);
        this.ctx.fillStyle = "#2ECC71";
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT - CONFIG.GROUND_Y);
        this.ctx.font = "42px sans-serif";
        this.ctx.fillText("🐰", CONFIG.PLAYER.X, CONFIG.PLAYER.Y);
    }
}

const game = new Game();