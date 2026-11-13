
const wrapper = document.getElementById("game-wrapper");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071b0d);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 13, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
wrapper.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(5, 10, 5);
scene.add(light);

// Board
const board = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.3, 10),
    new THREE.MeshStandardMaterial({ color: 0x174b27 })
);
board.position.y = -0.2;
scene.add(board);

const grid = new THREE.GridHelper(10, 20, 0x00ff55, 0x267b3b);
grid.position.y = -0.04;
scene.add(grid);

// Snake
let snake = [];
let food;
let direction = { x: 1, z: 0 };
let nextDirection = { x: 1, z: 0 };

let score = 0;
let running = false;
let gameOver = false;
let lastMove = 0;

const greenMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff22,
    roughness: 0.2,
    metalness: 0.1
});

const snakeGeometry = new THREE.SphereGeometry(0.23, 24, 24);

function createSnake() {
    snake.forEach(part => scene.remove(part));
    snake = [];

    for (let i = 0; i < 4; i++) {
        const part = new THREE.Mesh(snakeGeometry, greenMaterial);
        part.position.set(-i * 0.5, 0.2, 0);
        scene.add(part);
        snake.push(part);
    }
}

function createFood() {
    if (food) scene.remove(food);

    let x, z;

    do {
        x = Math.floor(Math.random() * 17 - 8) * 0.5;
        z = Math.floor(Math.random() * 17 - 8) * 0.5;
    } while (snake.some(p =>
        Math.abs(p.position.x - x) < 0.3 &&
        Math.abs(p.position.z - z) < 0.3
    ));

    food = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 24, 24),
        new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x550000
        })
    );

    food.position.set(x, 0.25, z);
    scene.add(food);
}

function changeDirection(dir) {
    if (dir === "UP" && direction.z !== 1)
        nextDirection = { x: 0, z: -1 };

    if (dir === "DOWN" && direction.z !== -1)
        nextDirection = { x: 0, z: 1 };

    if (dir === "LEFT" && direction.x !== 1)
        nextDirection = { x: -1, z: 0 };

    if (dir === "RIGHT" && direction.x !== -1)
        nextDirection = { x: 1, z: 0 };
}

document.addEventListener("keydown", function(e) {
    if (e.key.startsWith("Arrow")) e.preventDefault();

    if (e.key === "ArrowUp") changeDirection("UP");
    if (e.key === "ArrowDown") changeDirection("DOWN");
    if (e.key === "ArrowLeft") changeDirection("LEFT");
    if (e.key === "ArrowRight") changeDirection("RIGHT");
});

function startGame() {
    if (running) return;

    if (gameOver) resetGame();

    running = true;
    document.getElementById("message").innerText = "Game Started! 🐍";
    document.getElementById("startBtn").innerText = "PLAYING...";
}

function resetGame() {
    score = 0;
    gameOver = false;
    running = false;

    direction = { x: 1, z: 0 };
    nextDirection = { x: 1, z: 0 };

    document.getElementById("score").innerText = "0";

    createSnake();
    createFood();
}

function restartGame() {
    resetGame();
    startGame();
}

function moveSnake() {
    direction = { ...nextDirection };

    const head = snake[0].position;

    const x = head.x + direction.x * 0.5;
    const z = head.z + direction.z * 0.5;

    // Wall collision
    if (Math.abs(x) > 4.25 || Math.abs(z) > 4.25) {
        endGame();
        return;
    }

    const eating =
        Math.abs(x - food.position.x) < 0.3 &&
        Math.abs(z - food.position.z) < 0.3;

    // Self collision
    const body = eating ? snake : snake.slice(0, -1);

    if (body.some(p =>
        Math.abs(p.position.x - x) < 0.2 &&
        Math.abs(p.position.z - z) < 0.2
    )) {
        endGame();
        return;
    }

    if (!eating) {
        const tail = snake.pop();
        scene.remove(tail);
    } else {
        score++;
        document.getElementById("score").innerText = score;
        createFood();
    }

    const newHead = new THREE.Mesh(snakeGeometry, greenMaterial);
    newHead.position.set(x, 0.2, z);

    scene.add(newHead);
    snake.unshift(newHead);
}

function endGame() {
    running = false;
    gameOver = true;

    document.getElementById("message").innerText =
        "GAME OVER! Score: " + score;

    document.getElementById("startBtn").innerText = "START AGAIN";
}

function resize() {
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (running && time - lastMove > 160) {
        moveSnake();
        lastMove = time;
    }

    if (food) {
        food.rotation.y += 0.04;
        food.position.y = 0.25 + Math.sin(time * 0.004) * 0.08;
    }

    renderer.render(scene, camera);
}

createSnake();
createFood();

window.addEventListener("resize", resize);

resize();
animate(0);
