let handpose, video, hands = [];
let stormNoise, filter, zenOsc;
let handStability = 0; 
let cleanProgress = 0; 
let prevTip = {x: 0, y: 0};
let hashtags = ["#FOMO", "#SCROLL", "#ADS", "#TIKTOK", "#ADHD", "#HYPER", "#MELDING", "#GIVEATTENTION", "#FASTCONTENT", "#REELS"];
let audioStarted = false;

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    video = createCapture(VIDEO, () => {
        handpose = ml5.handpose(video, () => console.log("Model Ready"));
        handpose.on("predict", results => { hands = results; });
    });
    video.size(640, 480); video.hide();

    filter = new p5.LowPass();
    stormNoise = new p5.Noise('pink');
    stormNoise.disconnect(); stormNoise.connect(filter);
    zenOsc = new p5.Oscillator('sine'); zenOsc.freq(120); zenOsc.amp(0);
}

function draw() {
    background(0, 45); // Trail effect voor chaos

    let tx = 0;
    let ty = 0;

    if (hands.length > 0) {
        // Gebruiker is aanwezig: UI updaten
        document.getElementById('idle-msg').style.display = 'none';
        document.getElementById('status-ui').style.opacity = '1';

        let tip = hands[0].annotations.indexFinger[3];
        tx = map(tip[0], 0, 640, width, 0);
        ty = map(tip[1], 50, 400, 0, height);

        // Bewegingscontrole
        let d = dist(tx, ty, prevTip.x, prevTip.y);
        let currentS = (d > 0.5 && d < 7) ? 1 : 0;
        handStability = lerp(handStability, currentS, 0.1);
        
        if (handStability > 0.5) {
            cleanProgress += 0.006; // Iets sneller zuiveren voor publiek
        } else if (d > 20) {
            cleanProgress -= 0.015; 
        }
        
        if (cleanProgress > 0.15) renderZen(tx, ty);
        prevTip = {x: tx, y: ty};
    } else {
        // Niemand aanwezig: Instructie tonen en langzaam terug naar chaos
        renderIdle();
        cleanProgress = lerp(cleanProgress, 0, 0.01); 
    }

    cleanProgress = constrain(cleanProgress, 0, 1);

    // De storm draait ALTIJD, intensiteit hangt af van progressie
    renderStorm();
    
    handleAudio();
    updateUI();
}

function renderStorm() {
    // Hoe schoner de geest (progress), hoe minder hashtags
    let intensity = map(cleanProgress, 0, 1, 18, 0); 
    
    for (let i = 0; i < intensity; i++) {
        push();
        fill(random() > 0.5 ? '#ff0044' : '#ffffff');
        textSize(random(30, 120));
        textFont('Arial Black');
        text(random(hashtags), random(width), random(height));
        pop();
    }
}

function renderZen(tx, ty) {
    push();
    noFill();
    stroke(0, 255, 204, map(cleanProgress, 0, 1, 40, 255));
    strokeWeight(2);
    let size = map(sin(frameCount * 0.05), -1, 1, 150, 450) * cleanProgress;
    ellipse(tx, ty, size, size);
    
    for(let i=0; i<8; i++) {
        let angle = random(TWO_PI);
        let r = random(50, 250);
        point(tx + cos(angle)*r, ty + sin(angle)*r);
    }
    pop();
}

function renderIdle() {
    document.getElementById('idle-msg').style.display = 'block';
    document.getElementById('status-ui').style.opacity = '0.4'; // UI blijft licht zichtbaar
}

function handleAudio() {
    if (!audioStarted) return;
    if (!zenOsc.started) { stormNoise.start(); zenOsc.start(); zenOsc.started = true; }

    let stormVol = map(cleanProgress, 0, 0.8, 0.4, 0);
    let zenVol = map(cleanProgress, 0.2, 1, 0, 0.3);
    
    filter.freq(map(cleanProgress, 0, 1, 5000, 150));
    stormNoise.amp(constrain(stormVol, 0, 0.4), 0.2);
    zenOsc.amp(constrain(zenVol, 0, 0.3), 0.5);
}

function updateUI() {
    let pBar = document.getElementById('clean-progress');
    let mainMsg = document.getElementById('main-msg');
    let subMsg = document.getElementById('sub-msg');
    
    if (pBar) pBar.style.width = (cleanProgress * 100) + "%";

    if (cleanProgress > 0.9) {
        document.body.classList.add('zen-active');
        mainMsg.innerText = "JE BENT ER ✨";
        subMsg.innerText = "Focus gevonden in de storm";
    } else {
        document.body.classList.remove('zen-active');
        mainMsg.innerText = cleanProgress > 0.1 ? "JE ZUIVERT DE RUIS..." : "DOORBREEK DE CHAOS";
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
    if (!audioStarted) {
        userStartAudio();
        audioStarted = true;
    }
    let fs = fullscreen();
    fullscreen(!fs);
}