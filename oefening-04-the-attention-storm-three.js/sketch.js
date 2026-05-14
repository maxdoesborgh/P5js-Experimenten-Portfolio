// --- GLOBALE VARIABELEN ---
let handpose, video, hands = [];
let stormNoise, filter, zenOsc;
let handStability = 0, cleanProgress = 0;
let hashtags = ["#FOMO", "#SCROLL", "#ADS", "#TIKTOK", "#ADHD", "#HYPER", "#MELDING"];
let audioStarted = false;

// Three.js variabelen
let scene, camera, renderer, starPoints;
let particleCount = 6000; // Iets verlaagd voor betere performance

function setup() {
    // 1. Three.js Setup (Direct starten)
    initThree();

    // 2. P5 Setup (Transparante laag bovenop)
    let p5Canvas = createCanvas(windowWidth, windowHeight);
    p5Canvas.class("p5Canvas");

    // 3. Camera pas laden nadat de rest staat
    video = createCapture(VIDEO, () => {
        console.log("Camera actief");
        handpose = ml5.handpose(video, () => {
            console.log("ML5 Ready");
            let msg = document.getElementById('main-msg');
            if (msg) msg.innerText = "DOORBREEK DE RUIS";
        });
        handpose.on("predict", results => { hands = results; });
    });
    video.size(640, 480);
    video.hide();

    setupAudio();
}

function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, windowWidth / windowHeight, 1, 2000);
    camera.position.z = 600;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(windowWidth, windowHeight);
    renderer.setPixelRatio(min(window.devicePixelRatio, 2)); // Beperk resolutie voor performance
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = THREE.MathUtils.randFloatSpread(1500);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00ffcc,
        size: 2,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    starPoints = new THREE.Points(geometry, material);
    scene.add(starPoints);
    
    animateThree(); // Start de loop buiten p5 draw voor stabiliteit
}

function animateThree() {
    requestAnimationFrame(animateThree);
    updateThreeLogic();
    renderer.render(scene, camera);
}

function draw() {
    clear(); // Cruciaal om Three.js erdoorheen te zien

    if (hands.length > 0) {
        let tip = hands[0].annotations.indexFinger[3];
        let tx = map(tip[0], 0, 640, width, 0);
        let ty = map(tip[1], 50, 400, 0, height);

        let d = dist(tx, ty, pmouseX, pmouseY);
        let currentS = (d > 0.1 && d < 7) ? 1 : 0;
        handStability = lerp(handStability, currentS, 0.1);
        
        if (handStability > 0.6) cleanProgress += 0.005;
        else if (d > 15) cleanProgress -= 0.015;
        cleanProgress = constrain(cleanProgress, 0, 1);

        if (cleanProgress < 0.95) drawHashtags();
    }

    updateUI();
    if (audioStarted) handleAudio();
}

function updateThreeLogic() {
    const positions = starPoints.geometry.attributes.position.array;
    let time = Date.now() * 0.001;

    for (let i = 0; i < particleCount; i++) {
        let i3 = i * 3;
        if (cleanProgress > 0.05) {
            let angle = i * 0.1 + time;
            let radius = (200 + sin(time * 1.5) * 40) * cleanProgress;
            
            let targetX = cos(angle) * radius * sin(i * 0.01);
            let targetY = sin(angle) * radius * cos(i * 0.01);
            let targetZ = cos(i * 0.02) * radius * 0.5;

            positions[i3] = THREE.MathUtils.lerp(positions[i3], targetX, 0.05);
            positions[i3+1] = THREE.MathUtils.lerp(positions[i3+1], targetY, 0.05);
            positions[i3+2] = THREE.MathUtils.lerp(positions[i3+2], targetZ, 0.05);
        }
    }
    starPoints.geometry.attributes.position.needsUpdate = true;
    starPoints.rotation.y += 0.001;
}

function drawHashtags() {
    let amt = map(cleanProgress, 0, 1, 8, 0);
    for (let i = 0; i < amt; i++) {
        push();
        fill(random() > 0.8 ? '#ff0044' : 255, random(50, 150));
        textSize(random(20, 80));
        text(random(hashtags), random(width), random(height));
        pop();
    }
}

// ... setupAudio, handleAudio, updateUI, mousePressed en windowResized blijven gelijk ...