let font;
let points = [];
let rotationY = 0;
let centerX = 0;
let centerY = 0;
let centerZ = 0;
let touchLastX = 0;

let WORD = "Wen Weng";
let FONT_SIZE = 120;
let DEPTH = 20; // 線框的厚度（z 軸延伸距離）
let JUMP_THRESHOLD = 15; // 兩點距離超過這個值就視為新的封閉路徑，不連線
let STRUT_STEP = 1; // 每隔幾個點畫一條前後連接線，數字越小線越密
let SCROLL_SENSITIVITY = 0.0025;
let TOUCH_SENSITIVITY = 0.05; // 手指滑動的靈敏度，跟滾輪分開調
let TILT_X = 0.15; // 固定的 X 軸傾斜角度
let TILT_Z = 0.1; // 固定的 Z 軸傾斜角度
let OUTLINE_COLOR = [255,30]; // 前後輪廓線的顏色 [R, G, B]
let STRUT_COLOR = [0,80]; // 中間支架線的顏色 [R, G, B]
let AUTO_ROTATE_SPEED = 0.003; 

function preload() {
  font = loadFont("ZenDots-Regular.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(255);
  textFont(font);
  // x, y 是文字起始位置，目前用負值把文字整體往左移，讓它大致置中
  // 之後可以先量出 textBounds 的寬度再精準置中
  points = font.textToPoints(WORD, 0, 0, FONT_SIZE, {
    sampleFactor: 0.25, // 記得：太大會導致點數爆炸甚至卡死，先從 0.2~0.3 開始試
    simplifyThreshold: 0,
  });
  // 量出所有點的 x, y 範圍，算出中心點 —— 這個中心點就是等一下旋轉的軸心
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  centerX = (minX + maxX) / 2;
  centerY = (minY + maxY) / 2;
  centerZ = -DEPTH / 2; // z 軸是從 0 到 -DEPTH，中心點自然是 -DEPTH/2
  noFill();
  strokeWeight(1);
  ortho(); // 改成正交投影，不會有透視的近大遠小
}

function draw() {
  rotationY += AUTO_ROTATE_SPEED; 
  push();
  rotateY(rotationY);
  rotateX(TILT_X);
  rotateZ(TILT_Z); // 固定的傾斜角度，純視覺效果，不會被互動改變
  translate(-centerX, -centerY, -centerZ);
  drawWireframe(points, DEPTH, JUMP_THRESHOLD, STRUT_STEP);
  pop();
}

// 滑鼠滾動 → 控制 Y 軸旋轉（只有滑鼠在這個 canvas 範圍內時才會觸發）
function mouseWheel(event) {
  rotationY += event.delta * SCROLL_SENSITIVITY;
  return false; // 阻止頁面本身跟著滾動
}

// 手指觸控（滑動）→ 控制 Y 軸旋轉，同樣只有手指在這個 canvas 範圍內才會觸發
function touchStarted() {
  touchLastX = mouseX;
  return false;
}

function touchMoved() {
  let deltaX = mouseX - touchLastX;
  rotationY += deltaX * TOUCH_SENSITIVITY;
  touchLastX = mouseX;
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  ortho(); // 畫布尺寸變了，投影範圍要重新算一次
}

/**
 * 把 textToPoints() 的 2D 點陣列畫成 3D 線框
 * @param {Array<{x:number,y:number}>} pts
 * @param {number} depth          z 軸延伸深度
 * @param {number} jumpThreshold  超過這個距離就不連線（避免連錯封閉路徑）
 * @param {number} strutStep      每幾個點畫一條前後連接線
 */
function drawWireframe(pts, depth, jumpThreshold, strutStep) {
  if (!pts || pts.length === 0) return;
  // 前面（z=0）與背面（z=-depth）的輪廓線
  stroke(...OUTLINE_COLOR);
  [0, -depth].forEach((z) => {
    beginShape(LINES);
    for (let i = 0; i < pts.length - 1; i++) {
      let a = pts[i];
      let b = pts[i + 1];
      if (dist(a.x, a.y, b.x, b.y) < jumpThreshold) {
        vertex(a.x, a.y, z);
        vertex(b.x, b.y, z);
      }
    }
    endShape();
  });
  // 前後連接線，讓文字看起來有厚度 —— 顏色跟輪廓線分開設定
  stroke(...STRUT_COLOR);
  beginShape(LINES);
  for (let i = 0; i < pts.length; i += strutStep) {
    vertex(pts[i].x, pts[i].y, 0);
    vertex(pts[i].x, pts[i].y, -depth);
  }
  endShape();
}
