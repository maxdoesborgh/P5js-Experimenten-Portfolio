let handpose, video;
let stormNoise, filter, zenOsc;
let hands = [];
let particles = [];
let hashtags = ["#FOMO", "#OVERPRIKKELD", "#MELDING", "#DOOMSCROLLEN", "#CHAOS", "#TIKTOKBREIN"];
let zenWords = ["静寂", "調和"];

let audioActive = false;
let handStability = 0; 
let prevTipY = 0;
let glitchTimer = 0;

function setup() {
    // Gebruik de volledige monitorgrootte
    createCanvas(windowWidth, windowHeight);
    
    video = createCapture(VIDEO, () => {
        console.log("Camera actief");
        handpose = ml5.handpose(video, modelReady);
        handpose.on("predict", results => { hands = results; });
    });
    video.size(640, 480);
    video.hide();

    // Audio Setup
    filter = new p5.LowPass();
    stormNoise = new p5.Noise('pink');
    stormNoise.disconnect();
    stormNoise.connect(filter);
    
    zenOsc = new p5.Oscillator('sine'); 
    zenOsc.amp(0);
    zenOsc.freq(110); 

    for (let i = 0; i < 350; i++) {
        particles.push(new Particle());
    }
}

function modelReady() {
    document.getElementById('loader').innerText = "STORM ACTIEF ⚡";
}

function draw() {
    let bgAlpha = map(handStability, 0, 1, 30, 100);
    background(0, bgAlpha); 
    
    let handDetected = false;
    let tx = mouseX, ty = mouseY;

    if (hands && hands.length > 0) {
        handDetected = true;
        let tip = hands[0].annotations.indexFinger[3];
        
        // --- VERTICALE FIX: Mapping voor staand scherm ---
        let mappedY = map(tip[1], 100, 350, 0, height);
        tx = map(tip[0], 0, 640, width, 0);
        ty = constrain(mappedY, 0, height);

        let tipVelocity = abs(tip[1] - prevTipY);
        prevTipY = tip[1];
        let targetStability = map(tipVelocity, 0, 12, 1, 0); 
        handStability = lerp(handStability, constrain(targetStability, 0, 1), 0.05);
        updateUI();
    } else {
        handStability = lerp(handStability, 0, 0.02);
    }

    // --- AUDIO ENGINE ---
    if (audioActive) {
        if (!zenOsc.started) { zenOsc.start(); stormNoise.start(); zenOsc.started = true; }
        let vol = document.getElementById('volumeSlider').value;
        
        let chaosAmt = 1 - handStability;
        filter.freq(map(chaosAmt, 0, 1, 100, 6000));
        stormNoise.amp(map(chaosAmt, 0, 1, 0, 0.4) * vol, 0.1);
        
        let zenAmp = map(handStability, 0.6, 1, 0, 0.25);
        zenOsc.amp(constrain(zenAmp, 0, 0.25) * vol, 0.2);
        zenOsc.freq(110 + sin(frameCount * 0.02) * 3);
    }

    // --- VISUAL MODES ---
    if (handStability < 0.5) {
        applyGlitch(); 
        drawChaosTypo();
    } else if (handStability > 0.8) {
        drawZenTypo();
    }

    for (let p of particles) {
        if (handDetected) p.attract(tx, ty);
        else p.float();
        p.update(handStability);
        p.show(handStability);
    }
}

function applyGlitch() {
    glitchTimer++;
    if (glitchTimer % 15 === 0) {
        let x = random(width), y = random(height);
        let w = random(100, 400), h = random(5, 50);
        let img = get(x, y, w, h);
        image(img, x + random(-30, 30), y + random(-5, 5));
    }
}

function drawChaosTypo() {
    let numWords = map(handStability, 0, 0.5, 10, 0);
    for (let i = 0; i < numWords; i++) {
        if (random() > 0.9) {
            fill(random() > 0.5 ? color(255, 0, 50) : color(0, 150, 255), 200);
            textSize(random(50, 120)); // EXTRA GROOT
            textFont('Arial Black'); // HEEL BOLD
            
            // Glow effect voor extra impact
            drawingContext.shadowColor = color(255, 0, 0, 200);
            drawingContext.shadowBlur = 25;
            
            textAlign(CENTER);
            text(random(hashtags), random(width), random(height));
            drawingContext.shadowBlur = 0;
        }
    }
}

function drawZenTypo() {
    fill(255, 120);
    textSize(35);
    textFont('serif');
    textStyle(ITALIC);
    textAlign(CENTER);
    let word = zenWords[0];
    text(word[0], width - 60, 100);
    text(word[1], width - 60, 145);
}

function updateUI() {
    let loader = document.getElementById('loader');
    let ui = document.getElementById('status-ui');
    if (handStability > 0.75) {
        loader.innerText = "SEIJAKU (STILTE) ✨";
        ui.className = "zen-ui";
    } else {
        loader.innerText = "ATTENTION STORM ⚡";
        ui.className = "";
    }
    document.getElementById('stability-meter').innerText = "Focus: " + floor(handStability * 100) + "%";
}

function mousePressed() { if (!audioActive) { userStartAudio(); audioActive = true; } }

class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-1, 1), random(-1, 1));
        this.acc = createVector(0, 0);
        this.type = random() > 0.5 ? 'rect' : 'ellipse';
    }

    attract(tx, ty) {
        let force = p5.Vector.sub(createVector(tx, ty), this.pos);
        let d = force.mag();
        let r = map(handStability, 0, 1, width, width * 0.3);
        if (d < r) { force.setMag(0.25); this.acc.add(force); }
    }

    float() {
        let n = noise(this.pos.x * 0.005, this.pos.y * 0.005, frameCount * 0.01);
        this.acc.add(p5.Vector.fromAngle(TWO_PI * n).mult(0.06));
    }

    update(stability) {
        this.vel.add(this.acc);
        this.vel.limit(map(stability, 0, 1, 8, 1.2));
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.vel.mult(0.97);
        if (this.pos.y > height) this.pos.y = 0; if (this.pos.y < 0) this.pos.y = height;
        if (this.pos.x > width) this.pos.x = 0; if (this.pos.x < 0) this.pos.x = width;
    }

    show(stability) {
        if (stability < 0.6) {
            fill(random() > 0.5 ? color(255, 0, 50, 180) : color(0, 200, 255, 180));
            noStroke();
            let sz = map(this.vel.mag(), 0, 8, 5, 65);
            if (this.type === 'rect') rect(this.pos.x, this.pos.y, sz, sz/2);
            else ellipse(this.pos.x, this.pos.y, sz, sz);
        } else {
            stroke(255, map(stability, 0.6, 1, 0, 200));
            strokeWeight(map(stability, 0.6, 1, 5, 1.5));
            point(this.pos.x, this.pos.y);
        }
    }
}