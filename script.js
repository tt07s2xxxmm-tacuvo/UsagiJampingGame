const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // UI要素
    const scoreLabel = document.getElementById("score-label");
    const infoLabel = document.getElementById("info-label");
    const menuButtons = document.getElementById("menu-buttons");
    const container = document.getElementById("game-container");

    // 定数設定
    const WIDTH = 700;
    const HEIGHT = 450;
    const GRAVITY = 0.7;
    const JUMP_SPEED = -12;

    // ゲーム状態変数
    let isTitle = true;
    let gameOver = false;
    let gameCleared = false;
    let bgBackground = "#E6F4F8";
    const bgSpecial = "#FADBD8";
    const bgNormal = "#E6F4F8";

    let score = 0;
    let targetScore = 12000;
    let baseObstacleSpeed = 6;
    let obstacleSpeed = 6;
    let spawnMin = 45;
    let spawnMax = 85;

    let playerX = 100;
    let playerY = 300;
    const playerW = 45;
    const playerH = 45;
    let playerVy = 0;
    let jumpCount = 0;
    const groundY = 350;

    let invincibleTimer = 0;
    let bonusStageTimer = 0;
    let obstacles = [];
    let spawnTimer = 0;
    let feverSpawnTimer = 0;

    let goalFlagSpawned = false;
    let goalFlag = [WIDTH, groundY - 70, 40, 70];

    // 入力処理（PCのスペースキー ＆ スマホの画面タップ両対応）
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            handleAction();
        }
    });

    // PCのキーボード用
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            handleAction();
        }
    });
    // スマホ・PC共通のクリック/タップ用
    container.addEventListener("pointerdown", (e) => {
        // タイトル画面のボタンをタップした時はゲームのジャンプ処理を動かさない
        if (e.target.tagName === "BUTTON") return;
        
        e.preventDefault();
        handleAction();
    });


    function handleAction() {
        if (isTitle) return;
        if (gameOver || gameCleared) {
            showTitleScreen();
        } else {
            if (jumpCount < 2) {
                playerVy = JUMP_SPEED;
                jumpCount++;
                if (bonusStageTimer > 0) {
                    score += 150;
                    updateScoreText();
                }
            }
        }
    }

    function showTitleScreen() {
        isTitle = true;
        scoreLabel.style.display = "none";
        infoLabel.style.display = "none";
        menuButtons.style.display = "flex";
        bgBackground = bgNormal;
        draw();
    }

    function startGame(speed, min, max, target) {
        isTitle = false;
        menuButtons.style.display = "none";
        scoreLabel.style.display = "block";
        infoLabel.style.display = "block";
        
        baseObstacleSpeed = speed;
        spawnMin = min;
        spawnMax = max;
        targetScore = target;

        resetGame();
    }

    function resetGame() {
        score = 0;
        gameOver = false;
        gameCleared = false;
        updateScoreText();
        infoLabel.textContent = "画面タップでジャンプ！ 雲にふれると5秒間スターが湧き続けるよ！☁️🌟";
        infoLabel.style.color = "#E74C3C";
        bgBackground = bgNormal;

        playerY = groundY - playerH;
        playerVy = 0;
        jumpCount = 0;

        invincibleTimer = 0;
        bonusStageTimer = 0;
        obstacles = [];
        obstacleSpeed = baseObstacleSpeed;
        spawnTimer = 0;
        feverSpawnTimer = 0;

        goalFlagSpawned = false;
        goalFlag = [WIDTH, groundY - 70, 40, 70];

        gameLoop();
    }

    function updateScoreText() {
        scoreLabel.textContent = `スコア: ${score}`;
    }

    // メインゲームループ
    function gameLoop() {
        if (gameOver || gameCleared || isTitle) return;

        updatePlayer();
        updateFeverTimers();
        spawnObjects();
        moveObjects();
        checkCollision();
        checkGoalCondition();

        draw();

        requestAnimationFrame(gameLoop);
    }

    function updatePlayer() {
        playerVy += GRAVITY;
        playerY += playerVy;

        if (playerY >= groundY - playerH) {
            playerY = groundY - playerH;
            playerVy = 0;
            jumpCount = 0;
        }

        if (invincibleTimer > 0) invincibleTimer--;
    }

    function updateFeverTimers() {
        if (bonusStageTimer > 0) {
            bonusStageTimer--;
            let secondsLeft = Math.floor(bonusStageTimer / 60) + 1; // JSのrequestAnimationFrame(約60fps)基準に調整
            infoLabel.textContent = `🌟 フィーバータイム！ あと ${secondsLeft} 秒スターが湧き続けるよ！ 🌟`;
            
            if (bonusStageTimer === 0) {
                bgBackground = bgNormal;
                infoLabel.textContent = "通常コースにもどったよ！";
                infoLabel.style.color = "#E74C3C";
                obstacles = obstacles.filter(obs => obs[4] !== "score_star" && obs[4] !== "block_q");
            }
        }
    }

    function spawnObjects() {
        if (score >= targetScore) return;

        // フィーバー中のスター生成
        if (bonusStageTimer > 0) {
            feverSpawnTimer++;
            if (feverSpawnTimer >= 4) { // 約0.06秒ごと
                let starX = WIDTH + Math.random() * 100;
                let starY = 80 + Math.random() * 210;
                obstacles.push([starX, starY, 30, 30, "score_star"]);
                feverSpawnTimer = 0;
            }
            return;
        }

        // 通常生成
        spawnTimer++;
        let currentMax = Math.max(spawnMin + 1, spawnMax);
        let randSpawnLimit = spawnMin + Math.random() * (currentMax - spawnMin);
        
        if (spawnTimer > randSpawnLimit) {
            let types = ["ground", "bomb", "cloud"];
            let obsType = types[Math.floor(Math.random() * types.length)];
            
            if (obsType === "ground") {
                let obsH = 35 + Math.random() * 20;
                obstacles.push([WIDTH, groundY - obsH, 30, obsH, "ground"]);
            } else if (obsType === "bomb") {
                obstacles.push([WIDTH, 40 + Math.random() * 100, 35, 35, "bomb"]);
            } else if (obsType === "cloud") {
                obstacles.push([WIDTH, 210 + Math.random() * 30, 105, 30, "cloud"]);
            }
            spawnTimer = 0;
        }
    }

    function moveObjects() {
        for (let obs of obstacles) {
            obs[0] -= obstacleSpeed;
            if (obs[4] === "bomb") {
                obs[1] += 2;
                if (obs[1] >= groundY - obs[3]) obs[1] = groundY - obs[3];
            }
        }
        if (goalFlagSpawned) {
            goalFlag[0] -= obstacleSpeed;
        }
    }

    function checkCollision() {
        let remaining = [];

        for (let obs of obstacles) {
            let isHit = (playerX < obs[0] + obs[2] && playerX + playerW > obs[0] &&
                         playerY < obs[1] + obs[3] && playerY + playerH > obs[1]);

            if (isHit) {
                if (obs[4] === "cloud") {
                    if (bonusStageTimer === 0) {
                        triggerFever();
                    }
                    continue;
                } else if (obs[4] === "score_star") {
                    score += 200;
                    updateScoreText();
                    continue;
                } else {
                    if (invincibleTimer > 0) {
                        score += 100;
                        updateScoreText();
                        continue;
                    } else {
                        gameOver = true;
                        remaining.push(obs);
                    }
                }
            } else {
                if (obs[0] + obs[2] > 0) {
                    remaining.push(obs);
                } else {
                    // 通過スコア
                    if (!["cloud", "score_star"].includes(obs[4])) {
                        score += 100;
                        updateScoreText();
                        if (score % 1000 === 0) obstacleSpeed += 0.8;
                    }
                }
            }
        }
        obstacles = remaining;
    }

    function triggerFever() {
        bonusStageTimer = 300; // 60fpsベースで5秒間
        bgBackground = bgSpecial;
        infoLabel.style.color = "#D35400";
        obstacles = [];

        // 最初のスター敷き詰め
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 3; row++) {
                let starX = WIDTH - 200 + (col * 90);
                let starY = 80 + (row * 70);
                obstacles.push([starX, starY, 30, 30, "score_star"]);
            }
        }
    }

    function checkGoalCondition() {
        if (score >= targetScore) {
            if (obstacles.length === 0 && !goalFlagSpawned) {
                bonusStageTimer = 0;
                bgBackground = bgNormal;
                infoLabel.textContent = "";
                goalFlagSpawned = true;
            }
        }

        if (goalFlagSpawned) {
            let fx1 = goalFlag[0];
            let fx2 = goalFlag[0] + goalFlag[2];
            if (playerX < fx2 && playerX + playerW > fx1 && playerY < groundY) {
                gameCleared = true;
            }
        }
    }

    function draw() {
        // 背景クリア
        ctx.fillStyle = bgBackground;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // 地面
        ctx.fillStyle = "#2ECC71";
        ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

        if (isTitle) {
            ctx.fillStyle = "#1A5276";
            ctx.font = "bold 24px 'MS Gothic', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🐰 うさぎのジャンピングスター 🌟", WIDTH / 2, HEIGHT / 4);
            
            ctx.fillStyle = "#2C3E50";
            ctx.font = "bold 16px 'MS Gothic', sans-serif";
            ctx.fillText("むずかしさを えらんでね！", WIDTH / 2, HEIGHT / 3 + 5);
            return;
        }

        // 上部ゲージ
        const gaugeX1 = 150, gaugeX2 = 550, gaugeY = 40;
        const gaugeWidth = gaugeX2 - gaugeX1;
        ctx.strokeStyle = "#BDC3C7";
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(gaugeX1, gaugeY); ctx.lineTo(gaugeX2, gaugeY); ctx.stroke();

        let progress = Math.min(score / targetScore, 1.0);
        let currentGaugeX = gaugeX1 + (gaugeWidth * progress);
        ctx.strokeStyle = "#E91E63";
        ctx.beginPath(); ctx.moveTo(gaugeX1, gaugeY); ctx.lineTo(currentGaugeX, gaugeY); ctx.stroke();

        ctx.fillStyle = "#FF69B4";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(currentGaugeX, gaugeY, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // オブジェクトの描画（絵文字を活用）
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        
        for (let obs of obstacles) {
            if (obs[4] === "cloud") {
                ctx.font = "40px sans-serif";
                ctx.fillText("☁️", obs[0], obs[1] - 10);
            } else if (obs[4] === "score_star") {
                ctx.font = "30px sans-serif";
                ctx.fillText("⭐", obs[0], obs[1] - 5);
            } else if (obs[4] === "bomb") {
                ctx.font = "32px sans-serif";
                ctx.fillText("💣", obs[0], obs[1] - 5);
            } else if (obs[4] === "ground") {
                // 障害物はサボテンやブロック風に
                ctx.font = "32px sans-serif";
                ctx.fillText("🌵", obs[0], groundY - 35);
            }
        }

        // ゴールの旗
        if (goalFlagSpawned) {
            let [fx, fy, fw, fh] = goalFlag;
            ctx.strokeStyle = "#34495E";
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + fh); ctx.stroke();

            ctx.fillStyle = "#E74C3C";
            ctx.beginPath();
            ctx.moveTo(fx, fy); ctx.lineTo(fx + fw, fy + 15); ctx.lineTo(fx, fy + 30);
            ctx.fill();

            ctx.fillStyle = "#1A5276";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("GOAL", fx + 10, fy + 45);
        }

        // プレイヤー (🐰)
        ctx.font = "42px sans-serif";
        ctx.fillText("🐰", playerX, playerY - 5);

        // ゲームオーバー / クリア 画面
        ctx.textAlign = "center";
        if (gameOver) {
            ctx.fillStyle = "#C0392B";
            ctx.font = "bold 32px sans-serif";
            ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 20);
            ctx.fillStyle = "#2C3E50";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("タップして タイトルにもどる", WIDTH / 2, HEIGHT / 2 + 25);
        }

        if (gameCleared) {
            ctx.fillStyle = "#E91E63";
            ctx.font = "bold 40px sans-serif";
            ctx.fillText("🎉 GOAL !! 🎉", WIDTH / 2, HEIGHT / 2 - 30);
            ctx.fillStyle = "#1A5276";
            ctx.font = "bold 20px sans-serif";
            ctx.fillText("おめでとう！ゴールできたよ！", WIDTH / 2, HEIGHT / 2 + 20);
            ctx.fillStyle = "#2C3E50";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText("タップして タイトルにもどる", WIDTH / 2, HEIGHT / 2 + 60);
        }
    }

    // 初回読み込み時にタイトル表示
    showTitleScreen();