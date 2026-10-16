var canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    width = canvas.width,    // read from the canvas so the JS always matches the HTML (800 x 600)
    height = canvas.height,
    dt = 0.02,      // Time step.
    rho = 1.2,      // Density of air. Try 1000 for water.
    C_d = 0.46,     // Coefficient of drag for a ball
    g = 9.81,       // Gravity (m/s^2)
    SCALE = 100;    // 1 meter = 100 pixels (1 px = 1 cm)

/* The enclosed rectangle the balls live in. Change these to resize it. */
var box = {
    left: 50,
    top: 60,
    right: width - 50,
    bottom: height - 50
};

var balls = [];

/* Each ball has its own size, mass, bounciness (restitution), and color. */
function createBall(x, y, r, vx, vy, color, m, e) {
    return {
        x: x, y: y, r: r,
        vx: vx || 0, vy: vy || 0,
        ax: 0, ay: 0,
        m: m || r * r / 10,
        e: (e === undefined) ? 0.5 : e,
        color: color || randomColor()
    };
}

function randomColor() {
    return 'hsl(' + Math.floor(Math.random() * 360) + ', 70%, 50%)';
}

/* Gravity + air drag + Verlet integration, on both axes. */
function updateBall(b) {
    var A = Math.PI * b.r * b.r / 10000; // frontal area in m^2

    // Drag opposes motion, so use v * |v| to keep the correct sign
    var fx = -0.5 * rho * C_d * A * b.vx * Math.abs(b.vx);
    var fy = b.m * g - 0.5 * rho * C_d * A * b.vy * Math.abs(b.vy);

    b.x += (b.vx * dt + 0.5 * b.ax * dt * dt) * SCALE;
    b.y += (b.vy * dt + 0.5 * b.ay * dt * dt) * SCALE;

    var new_ax = fx / b.m;
    var new_ay = fy / b.m;
    b.vx += 0.5 * (b.ax + new_ax) * dt;
    b.vy += 0.5 * (b.ay + new_ay) * dt;
    b.ax = new_ax;   // store acceleration for the next step
    b.ay = new_ay;
}

/* Collision with the four sides of the box. */
function collideWalls(b) {
    if (b.y + b.r > box.bottom) { b.y = box.bottom - b.r; if (b.vy > 0) b.vy *= -b.e; }
    if (b.y - b.r < box.top) { b.y = box.top + b.r; if (b.vy < 0) b.vy *= -b.e; }
    if (b.x + b.r > box.right) { b.x = box.right - b.r; if (b.vx > 0) b.vx *= -b.e; }
    if (b.x - b.r < box.left) { b.x = box.left + b.r; if (b.vx < 0) b.vx *= -b.e; }
}

/* Circle-vs-circle collision with impulse-based response. */
function collideBalls(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minDist = a.r + b.r;

    if (dist >= minDist || dist === 0) return;  // not touching

    // Collision normal: unit vector from a to b
    var nx = dx / dist;
    var ny = dy / dist;

    // 1. Push the balls apart so they don't overlap (heavier ball moves less)
    var overlap = minDist - dist;
    var totalMass = a.m + b.m;
    a.x -= nx * overlap * (b.m / totalMass);
    a.y -= ny * overlap * (b.m / totalMass);
    b.x += nx * overlap * (a.m / totalMass);
    b.y += ny * overlap * (a.m / totalMass);

    // 2. Relative velocity along the normal
    var rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rvn > 0) return;  // already moving apart

    // 3. Impulse magnitude, then apply it to each ball
    var e = Math.min(a.e, b.e);  // the less bouncy ball wins
    var j = -(1 + e) * rvn / (1 / a.m + 1 / b.m);
    a.vx -= (j / a.m) * nx;
    a.vy -= (j / a.m) * ny;
    b.vx += (j / b.m) * nx;
    b.vy += (j / b.m) * ny;
}

function loop() {
    for (var i = 0; i < balls.length; i++) {
        updateBall(balls[i]);
    }
    for (var i = 0; i < balls.length; i++) {
        for (var j = i + 1; j < balls.length; j++) {
            collideBalls(balls[i], balls[j]);
        }
    }
    for (var i = 0; i < balls.length; i++) {
        collideWalls(balls[i]);
    }
    draw();
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // The enclosing rectangle
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);

    // Instruction text
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click the mouse to add a ball', width / 2, 35);

    for (var i = 0; i < balls.length; i++) {
        var b = balls[i];
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
    }

    drawPreview();
}

/* Faint preview of the ball that will be added, following the mouse inside the box. */
function drawPreview() {
    if (!mouse.inside) return;
    var s = getSettings();
    var x = Math.min(Math.max(mouse.x, box.left + s.r), box.right - s.r);
    var y = Math.min(Math.max(mouse.y, box.top + s.r), box.bottom - s.r);

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = s.randomColor ? 'gray' : s.color;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Arrow showing the launch direction and speed
    if (s.vx !== 0 || s.vy !== 0) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + s.vx * 10, y + s.vy * 10);
        ctx.stroke();
    }
}

/* ---------- User interface ---------- */

var mouse = { x: 0, y: 0, inside: false };

/* Read the current values from the controls. */
function getSettings() {
    return {
        r: parseFloat(document.getElementById('radius').value),
        m: parseFloat(document.getElementById('mass').value),
        e: parseFloat(document.getElementById('bounce').value),
        vx: parseFloat(document.getElementById('speedX').value),
        vy: parseFloat(document.getElementById('speedY').value),
        color: document.getElementById('color').value,
        randomColor: document.getElementById('randomColor').checked
    };
}

/* Show each slider's value next to it. */
['radius', 'mass', 'bounce', 'speedX', 'speedY'].forEach(function (id) {
    var input = document.getElementById(id);
    var label = document.getElementById(id + 'Val');
    function show() { label.textContent = input.value; }
    input.addEventListener('input', show);
    show();
});

document.getElementById('clearBtn').addEventListener('click', function () {
    balls = [];
});

/* Track the mouse for the preview. */
canvas.addEventListener('mousemove', function (evt) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = (evt.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (evt.clientY - rect.top) * (canvas.height / rect.height);
    mouse.inside = mouse.x > box.left && mouse.x < box.right &&
        mouse.y > box.top && mouse.y < box.bottom;
});
canvas.addEventListener('mouseleave', function () { mouse.inside = false; });

/* Click inside the box to add a ball using the current settings. */
canvas.addEventListener('click', function () {
    if (!mouse.inside) return;
    var s = getSettings();
    var x = Math.min(Math.max(mouse.x, box.left + s.r), box.right - s.r);
    var y = Math.min(Math.max(mouse.y, box.top + s.r), box.bottom - s.r);
    balls.push(createBall(x, y, s.r, s.vx, s.vy,
        s.randomColor ? randomColor() : s.color, s.m, s.e));
});

/* Starting balls */
balls.push(createBall(200, 120, 20, 1, 0, 'red'));
balls.push(createBall(215, 200, 30, -1, 0, 'blue'));
balls.push(createBall(500, 150, 10, 0, 0, 'green'));

/* A real project should use requestAnimationFrame, and you should time the frame rate and pass a variable "dt" to your physics function. This is just a simple brute force method of getting it done. */
setInterval(loop, dt * 1000);
