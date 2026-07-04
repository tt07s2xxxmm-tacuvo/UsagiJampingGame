// ===============================
// ゲーム設定 (マジックナンバーの排除)
// ===============================
const CONFIG = {
    WIDTH: 700,
    HEIGHT: 450,
    GROUND_Y: 350,
    PLAYER: { X: 100, Y: 300, W: 45, H: 45 },
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12 }
};

// ===============================
// ゲーム管理クラス
// ===============================
class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.isTitle = true;
        this.score = 0;

        // 入力処理の初期化
        this.initInput();
    }

    initInput() {
        // スマホ・PC共通のクリック/タップ用
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
        this.score = 0;
        this.loop();
    }

    loop() {
        if (this.isTitle) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // オブジェクトの更新処理などをここに追加予定
    }

    draw() {
        // 背景クリア
        this.ctx.fillStyle = "#E6F4F8";
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        // 地面
        this.ctx.fillStyle = "#2ECC71";
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.WIDTH, CONFIG.HEIGHT - CONFIG.GROUND_Y);

        // プレイヤー描画テスト
        this.ctx.font = "42px sans-serif";
        this.ctx.fillText("🐰", CONFIG.PLAYER.X, CONFIG.PLAYER.Y);
    }
}

// ゲーム開始
const game = new Game();