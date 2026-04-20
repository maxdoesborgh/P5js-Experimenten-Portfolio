let handpose, video;
let stormNoise, filter, osc;
let hands = [];
let particles = [];
let hashtags = ["#FOMO", "#OVERPRIKKELD", "#MELDING", "#SCROLLEN", "#CHAOS", "#TIKTOKBREIN", "#DOOMSCROLLEN", "#DRUK", "#ALTIJDAAN", "#SENSORYOVERLOAD"];

let audioActive = false;
let handStability = 0; 
let prevTipY = 0;
let volumeSlider;

function setup() {
    createCanvas(windowWidth, windowHeight);
    volumeSlider = document.getElementById('volumeSlider');
    // Voorkom dat klikken op de slider p5-events triggert
    volumeSlider.addEventListener('mousedown', (e) => e.stopPropagation());

    video = createCapture(VIDEO, () => {
        handpose = ml5.handpose(video, modelReady);
        handpose.on("predict", results => { hands = results; });
    });
    video.size(640, 480);
    video.hide();

    filter = new p5.LowPass();
    stormNoise = new p5.Noise('pink');
    stormNoise.disconnect();
    stormNoise.connect(filter);
    osc = new p5.Oscillator('sine');
    osc.amp(0);

    for (let i = 0; i < 300; i++) {
        particles.push(new Particle());
    }
}

function modelReady() {
    document.getElementById('loader').innerText = "STORM ACTIEF ⚡";
}

function draw() {
    let bgAlpha = map(handStability, 0, 1, 20, 100);
    background(0, bgAlpha); 
    
    let handDetected = false;
    let targetX = mouseX;
    let targetY = mouseY;

    if (hands && hands.length > 0) {
        handDetected = true;
        let tip = hands[0].annotations.indexFinger[3];
        targetX = map(tip[0], 0, 640, width, 0);
        targetY = map(tip[1], 50, 380, 0, height);

        let tipVelocity = abs(tip[1] - prevTipY);
        prevTipY = tip[1];
        let currentTargetStability = map(tipVelocity, 0, 12, 1, 0); 
        handStability = lerp(handStability, constrain(currentTargetStability, 0, 1), 0.05);

        updateUI();
    } else {
        handStability = lerp(handStability, 0, 0.02);
        document.getElementById('loader').innerText = "GEEN FOCUS - CHAOS ⚡";
    }

    // Audio Engine
    if (audioActive) {
        if (!osc.started) { osc.start(); stormNoise.start(); osc.started = true; }
        let mVol = volumeSlider.value;
        let chaosLevel = 1 - handStability;
        filter.freq(map(chaosLevel, 0, 1, 100, 6000));
        stormNoise.amp(map(chaosLevel, 0, 1, 0, 0.4) * mVol, 0.1); 
        osc.amp(map(handStability, 0, 1, 0, 0.25) * mVol, 0.1);
        osc.freq(map(handStability, 0, 1, 60, 45));
    }

    // Teken Typografie Chaos
    if (handStability < 0.7) {
        drawTypoChaos();
    }

    // Teken deeltjes
    for (let p of particles) {
        if (handDetected) p.attract(targetX, targetY);
        else p.float();
        p.update(handStability);
        p.show(handStability);
    }
}

function drawTypoChaos() {
    let numWords = map(handStability, 0, 0.7, 15, 0);
    
    for (let i = 0; i < numWords; i++) {
        if (random() > 0.9) { 
            let word = random(hashtags);
            let x = random(width);
            let y = random(height);
            let size = random(20, 80) * (1 - handStability);
            
            push();
            translate(x, y);
            rotate(random(-0.1, 0.1));
            
            if (random() > 0.5) fill(255, 0, 50, 150);
            else fill(0, 200, 255, 150);
            
            textAlign(CENTER);
            textSize(size);
            textStyle(BOLD);
            text(word, random(-5, 5), random(-5, 5));
            pop();
        }
    }
}

function updateUI() {
    let loader = document.getElementById('loader');
    let ui = document.getElementById('status-ui');
    if (handStability > 0.75) {
        loader.innerText = "HARMONIE GEVONDEN ✨";
        ui.classList.add('rust-ui');
    } else {
        loader.innerText = "ZOEK NAAR RUST...";
        ui.classList.remove('rust-ui');
    }
    document.getElementById('stability-meter').innerText = "Focus Niveau: " + floor(handStability * 100) + "%";
}

function mousePressed() {
    if (!audioActive) {
        userStartAudio();
        audioActive = true;
    }
}

class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-1, 1), random(-1, 1));
        this.acc = createVector(0, 0);
        this.shapeType = random() > 0.5 ? 'rect' : 'ellipse'; 
    }
    attract(tx, ty) {
        let target = createVector(tx, ty);
        let force = p5.Vector.sub(target, this.pos);
        let d = force.mag();
        let radius = map(handStability, 0, 1, width * 1.0, width * 0.4);
        if (d < radius) {
            force.setMag(0.25);
            this.acc.add(force);
        }
    }
    float() {
        let n = noise(this.pos.x * 0.005, this.pos.y * 0.005, frameCount * 0.01);
        let steer = p5.Vector.fromAngle(TWO_PI * n);
        this.acc.add(steer.mult(0.06));
    }
    update(stability) {
        let maxSpeed = map(stability, 0, 1, 8, 1.3);
        this.vel.add(this.acc);
        this.vel.limit(maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.vel.mult(0.97);
        if (this.pos.y > height) this.pos.y = 0; if (this.pos.y < 0) this.pos.y = height;
        if (this.pos.x > width) this.pos.x = 0; if (this.pos.x < 0) this.pos.x = width;
    }
    show(stability) {
        if (stability < 0.6) {
            fill(lerpColor(color(255, 0, 50, 150), color(0, 200, 255, 150), random()));
            noStroke();
            let sz = map(this.vel.mag(), 0, 8, 5, 50);
            if (this.shapeType === 'rect') rect(this.pos.x, this.pos.y, sz, sz/2);
            else ellipse(this.pos.x, this.pos.y, sz, sz);
        } else {
            stroke(200, 230, 255, 180);
            strokeWeight(map(stability, 0.6, 1, 4, 1.5));
            point(this.pos.x, this.pos.y);
        }
    }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }