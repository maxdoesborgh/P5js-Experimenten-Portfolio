let handpose, video, hands = [];
let stormNoise, filter, zenOsc;
let handStability = 0; // Hoe traag/vloeiend beweegt de gebruiker
let cleanProgress = 0; // Hoeveel van het scherm is "schoon"
let prevTip = {x: 0, y: 0};
let hashtags = ["#FOMO", "#SCROLL", "#ADS", "#TIKTOK", "#ADHD", "#HYPER", "#MELDING", "#GIVEATTENTION"];
let audioStarted = false;

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    video = createCapture(VIDEO, () => {
        handpose = ml5.handpose(video, () => console.log("Model Ready"));
        handpose.on("predict", results => { hands = results; });
    });
    video.size(640, 480); video.hide();

    // Audio Engine
    filter = new p5.LowPass();
    stormNoise = new p5.Noise('pink');
    stormNoise.disconnect(); stormNoise.connect(filter);
    zenOsc = new p5.Oscillator('sine'); zenOsc.freq(120); zenOsc.amp(0);
}

function draw() {
    background(0, 40); // Trail effect

    if (hands.length > 0) {
        let tip = hands[0].annotations.indexFinger[3];
        let tx = map(tip[0], 0, 640, width, 0);
        let ty = map(tip[1], 50, 400, 0, height);

        // 1. Bereken vloeibaarheid (Velocity check)
        let d = dist(tx, ty, prevTip.x, prevTip.y);
        
        // Alleen trage beweging geeft 'stabiliteit' (tussen 1 en 8 pixels per frame)
        let currentS = (d > 0.5 && d < 7) ? 1 : 0;
        handStability = lerp(handStability, currentS, 0.1);
        
        // 2. Update Progressie
        if (handStability > 0.5) {
            cleanProgress += 0.005; // Scherm wordt langzaam schoon
        } else if (d > 20) {
            cleanProgress -= 0.02; // Te snel bewegen = straf (weer vuil)
        }
        cleanProgress = constrain(cleanProgress, 0, 1);

        // 3. Render Visuals
        renderStorm(tx, ty);
        if (cleanProgress > 0.2) renderZen(tx, ty);

        prevTip = {x: tx, y: ty};
    } else {
        renderIdle();
    }

    handleAudio();
    updateUI();
}

function renderStorm(tx, ty) {
    let intensity = map(cleanProgress, 0, 1, 15, 0);
    for (let i = 0; i < intensity; i++) {
        push();
        fill(random() > 0.5 ? '#ff0044' : '#ffffff');
        textSize(random(20, 100));
        textFont('Arial Black');
        text(random(hashtags), random(width), random(height));
        pop();
    }
}

function renderZen(tx, ty) {
    // Een groeiende 'bloem' of rimpeling rond de hand
    push();
    noFill();
    stroke(0, 255, 204, map(cleanProgress, 0, 1, 50, 255));
    strokeWeight(2);
    let size = map(sin(frameCount * 0.05), -1, 1, 100, 400) * cleanProgress;
    ellipse(tx, ty, size, size);
    
    // Deeltjes die naar de hand vloeien
    for(let i=0; i<5; i++) {
        let angle = random(TWO_PI);
        let r = random(100, 300);
        point(tx + cos(angle)*r, ty + sin(angle)*r);
    }
    pop();
}

function renderIdle() {
    fill(255, 100);
    textAlign(CENTER);
    textSize(24);
    text("STEEK JE HAND UIT OM TE STARTEN", width/2, height/2);
}

function handleAudio() {
    if (!audioStarted) return;
    if (!zenOsc.started) { stormNoise.start(); zenOsc.start(); zenOsc.started = true; }

    let stormVol = map(cleanProgress, 0, 0.8, 0.4, 0);
    let zenVol = map(cleanProgress, 0.2, 1, 0, 0.3);
    
    filter.freq(map(cleanProgress, 0, 1, 5000, 200));
    stormNoise.amp(constrain(stormVol, 0, 0.4), 0.2);
    zenOsc.amp(constrain(zenVol, 0, 0.3), 0.5);
}

function updateUI() {
    let pBar = document.getElementById('clean-progress');
    let mainMsg = document.getElementById('main-msg');
    let subMsg = document.getElementById('sub-msg');
    
    pBar.style.width = (cleanProgress * 100) + "%";

    if (cleanProgress > 0.9) {
        document.body.classList.add('zen-active');
        mainMsg.innerText = "JE BENT ER ✨";
        subMsg.innerText = "Blijf in deze flow voor volledige rust";
    } else {
        document.body.classList.remove('zen-active');
        mainMsg.innerText = cleanProgress > 0.1 ? "JE ZUIVERT DE STORM..." : "DOORBREEK DE RUIS";
    }
}

function mousePressed() {
    if (!audioStarted) {
        userStartAudio();
        audioStarted = true;
    }
}