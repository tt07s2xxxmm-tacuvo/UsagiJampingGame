/**
 * 2D Action Game - Fixed Edition
 */

// ===============================
// 設定管理
// ===============================
const CONFIG = {
    CANVAS: { WIDTH: 700, HEIGHT: 450, BACKGROUND: "#E6F4F8", FEVER_COLOR: "#FFD700", GROUND_COLOR: "#2ECC71" },
    PHYSICS: { GRAVITY: 0.7, JUMP_SPEED: -12, GROUND_Y: 350 },
    PLAYER: { X: 100, W: 40, H: 40, ICON: "🐰" },
    OBSTACLES: { W: 30, H: 35, FEVER_DURATION: 300 },
    ICONS: { CACTUS: "🌵", BOMB: "💣", CLOUD: "☁️" }
};

// ===============================
// サウンド管理
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
        
        osc.type = 'square';
        if (type === 'jump') {
            osc.frequency.value = 400;
            gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        } else {
            osc.frequency.value = 100;
            gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.2);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        }
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }
}

// ===============================
// 入力・物理・障害物クラス
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
    update(speed) {
        this.x -= (this.type === 'cloud') ? speed * 0.5 : speed;
    }
    draw(ctx) {
        ctx.font = "35px sans-serif";
        const icon = this.type === 'bomb' ? CONFIG.ICONS.BOMB : (this.type === 'cloud' ? CONFIG.ICONS.CLOUD : CONFIG.ICONS.CACTUS);
        ctx.fillText(icon, this.x, this.y + 30);
    }
}

// ===============================
// ゲームメイン
// ===============================
class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.sound = new Sound();
        this.player = new Player();
        this.obstacles = [];
        this.score = 0;
        this.fever = 0;
        this.state = 'title';
        this.bestScore = localStorage.getItem("bestScore") || 0;
        
        window.addEventListener("pointerdown", () => {
            if (this.state === 'gameover') location.reload();
            if (this.state === 'playing' && this.player.jump()) this.sound.play('jump');
        });

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    update() {
        if (this.state !== 'playing') return;

        this.player.update();
        this.score += (this.fever > 0) ? 5 : 1;
        if (this.fever > 0) this.fever--;

        // 障害物の生成ロジック修正
        if (Math.random() < 0.03) {
            const rand = Math.random();
            const type = rand < 0.1 ? 'cloud' : (rand < 0.4 ? 'bomb' : 'cactus');
            this.obstacles.push(new Obstacle(type));
        }

        this.obstacles.forEach((obs, index) => {
            obs.update(6);
            if (obs.x < this.player.x + CONFIG.PLAYER.W && obs.x + 30 > this.player.x &&
                obs.y < this.player.y + CONFIG.PLAYER.H && obs.y + 35 > this.player.y) {
                if (obs.type === 'cloud') {
                    this.fever = CONFIG.OBSTACLES.FEVER_DURATION;
                    this.sound.play('jump');
                    this.obstacles.splice(index, 1);
                } else {
                    this.state = 'gameover';
                    this.sound.play('bomb');
                    if (this.score > this.bestScore) localStorage.setItem("bestScore", Math.floor(this.score));
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
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER - Tap to Restart", CONFIG.CANVAS.WIDTH / 2, CONFIG.CANVAS.HEIGHT / 2);
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

const game = new Game();
document.querySelectorAll("#menu-buttons button").forEach(btn => 
    btn.addEventListener("click", () => {
        game.state = 'playing';
        document.getElementById("menu-buttons").style.display = "none";
    })
);