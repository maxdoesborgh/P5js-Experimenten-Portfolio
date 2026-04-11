let x = 0;
let r = 255;
let g = 255;
let b = 255;
let speed = 3;

function setup() {
  createCanvas(600, 400);
}

function draw() {
let bgKleur = map(x, 0, width, 0, 255);
background(bgKleur);
  
  if (x > width || x < 0) {
    speed = speed * -1; 

    r = random(255);
    g = random(255);
    b = random(255);
  }

  x = x + speed;

  stroke(255);
  strokeWeight(4);
  fill(r, g, b); 
  ellipse(x, 200, 100, 100);
}