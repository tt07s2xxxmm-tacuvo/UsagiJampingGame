// ===============================
// ゲーム設定
// ===============================
const CONFIG = {
    BASE_WIDTH: 700,
    BASE_HEIGHT: 450,
    GROUND_Y: 350,
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12 },
    PLAYER: { X: 100, W: 40, H: 40 },
    OBSTACLE: { W: 30, H: 35 }
};

// ===============================
// サウンド管理 (Web Audio API)
// ===============================
class Sound {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    play(type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        // 種類による音の変化
        if (type === 'jump') {
            osc.frequency.value = 300;
        } else if (type === 'bomb') {
            osc.frequency.value = 50;
        } else {
            osc.frequency.value = 150;
        }
        
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}

// ===============================
// 障害物クラス (サボテン・爆弾・雲)
// ===============================
class Obstacle {
    constructor(x, type) {
        this.x = x;
        this.type = type;
        // 雲だけ高い位置に出現
        this.y = (type === 'cloud') ? 100 : CONFIG.GROUND_Y - 35;
        this.width = 30;
        this.height = 35;
    }

    update(speed) {
        // 雲はスピードを半分にする
        const moveSpeed = (this.type === 'cloud') ? speed * 0.5 : speed;
        this.x -= moveSpeed;
    }

    draw(ctx) {
        ctx.font = "35px sans-serif";
        let icon = "🌵";
        if (this.type === 'bomb') icon = "💣";
        if (this.type === 'cloud') icon = "☁️";
        ctx.fillText(icon, this.x, this.y + 30);
    }
}

// ===============================
// プレイヤークラス
// ===============================
class Player {
    constructor() {
        this.x = CONFIG.PLAYER.X;
        this.y = 300;
        this.w = CONFIG.PLAYER.W;
        this.h = CONFIG.PLAYER.H;
        this.vy = 0;
        this.jumpCount = 0;
    }

    update() {
        this.vy += CONFIG.PHYSICS.GRAVITY;
        this.y += this.vy;
        
        // 接地判定
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
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.font = "40px sans-serif";
        ctx.fillText("🐰", this.x, this.y + 35);
    }
}

// ===============================
// ゲームメインクラス
// ===============================
class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.sound = new Sound();
        this.player = new Player();
        this.obstacles = [];
        this.score = 0;
        this.fever = 0; // フィーバー状態の残りフレーム
        this.isRunning = false;
        this.bestScore = localStorage.getItem("bestScore") || 0;
        this.isTitle = true;
        this.isGameOver = false;
        this.spawnTimer = 0;
        this.gameSpeed = 0;

        window.addEventListener("resize", () => this.resize());
        this.resize();
        this.initInput();
        this.draw(); // タイトル表示
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
            if (this.isGameOver) location.reload(); // ゲームオーバー時はリロード
            if (!this.isTitle && this.player.jump()) this.sound.play('jump');
        });

        document.querySelectorAll("#menu-buttons button").forEach(btn => {
            btn.addEventListener("click", (e) => {
                if (!this.isRunning) this.startGame(parseInt(e.target.dataset.speed));
            });
        });
    }

    startGame(speed) {
        this.isTitle = false;
        this.isRunning = true;
        this.gameSpeed = speed;
        document.getElementById("menu-buttons").style.display = "none";
        this.loop();
    }

    // 正確な当たり判定 (AABB法)
    checkCollision(p, o) {
        const pY = p.y + 35; // 描画時のオフセット分を加味
        return p.x < o.x + o.width && 
               p.x + p.w > o.x && 
               pY < o.y + o.height && 
               pY + p.h > o.y;
    }

    loop() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.player.update();
        
        // スコア加算 (フィーバー中は5倍)
        this.score += (this.fever > 0) ? 5 : 1;
        if (this.fever > 0) this.fever--;

        // 障害物の不規則生成
        this.spawnTimer++;
        if (this.spawnTimer > Math.random() * 50 + 50) {
            const rand = Math.random();
            const type = (rand < 0.1) ? 'cloud' : (rand < 0.4 ? 'bomb' : 'cactus');
            this.obstacles.push(new Obstacle(CONFIG.BASE_WIDTH, type));
            this.spawnTimer = 0;
        }

        // 移動と衝突判定
        this.obstacles.forEach(obs => {
            obs.update(this.gameSpeed);
            if (this.checkCollision(this.player, obs)) {
                if (obs.type === 'cloud') {
                    // フィーバー突入
                    this.fever = 300; 
                    this.sound.play('jump');
                    obs.x = -100; // 画面外へ
                } else {
                    // ゲームオーバー
                    this.isGameOver = true;
                    this.isRunning = false;
                    this.sound.play('bomb');
                    if (this.score > this.bestScore) {
                        this.bestScore = this.score;
                        localStorage.setItem("bestScore", this.score);
                    }
                }
            }
        });
        
        // 画面外の障害物削除
        this.obstacles = this.obstacles.filter(obs => obs.x > -50);
    }

    draw() {
        this.canvas.width = CONFIG.BASE_WIDTH;
        this.canvas.height = CONFIG.BASE_HEIGHT;
        
        // 背景色 (フィーバー中は金色)
        this.ctx.fillStyle = (this.fever > 0) ? "#FFD700" : "#E6F4F8";
        this.ctx.fillRect(0, 0, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT);
        
        // 地面
        this.ctx.fillStyle = "#2ECC71";
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT - CONFIG.GROUND_Y);
        
        this.player.draw(this.ctx);
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        
        // UI
        this.ctx.fillStyle = "black";
        this.ctx.font = "20px sans-serif";
        this.ctx.fillText(`Score: ${this.score}  Best: ${this.bestScore}`, 100, 50);

        if (this.isGameOver) {
            this.ctx.fillStyle = "red";
            this.ctx.font = "bold 50px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER", CONFIG.BASE_WIDTH / 2, CONFIG.BASE_HEIGHT / 2);
        }
    }
}

new Game();