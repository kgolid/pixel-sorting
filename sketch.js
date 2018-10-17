let nx = 512;
let ny = 512;
let size = 2;
let img_resolution = 5;

let selection_size = 6;
let diagonal = false;

let tick = 0;
let img;

let sketch = function(p) {
  let THE_SEED;

  p.preload = function() {
    img = p.loadImage(
      'https://raw.githubusercontent.com/kgolid/pixel-sorting/master/img.jpg'
    );
  };

  p.setup = function() {
    p.createCanvas(nx * size, nx * size);
    p.pixelDensity(1);
    img.loadPixels();
    p.loadPixels();

    THE_SEED = p.floor(p.random(9999999));
    p.randomSeed(THE_SEED);
    p.noStroke();

    imgpixels = newArray(ny).map((_, j) =>
      newArray(nx).map((_, i) => {
        var loc = (i + j * img.width) * 4 * img_resolution;
        return [img.pixels[loc + 0], img.pixels[loc + 1], img.pixels[loc + 2]];
      })
    );

    drawImage(imgpixels);
  };

  p.draw = function() {
    if (tick < ny) {
      sortRow(imgpixels, tick);
      tick++;
      sortRow(imgpixels, tick);
      tick++;
    }
  };

  function drawImage(image) {
    image.forEach((pxr, j) =>
      pxr.forEach((px, i) => {
        drawPixel([j, i], px);
      })
    );
  }

  function drawPixel(pos, col) {
    p.fill(...col);
    p.rect(size * pos[1], size * pos[0], size, size);
  }

  function sortRow(mat, row) {
    for (let col = 0; col < mat[row].length; col++) {
      if (row !== 0) {
        let origin = diagonal
          ? getDiagonalOrigin(mat, col, row)
          : getOrigin(mat, col, row);
        let cands = getRandoms(selection_size, nx * row + col, nx * ny);
        let bi = findBestMatch(origin, mat, cands);

        let pixel_to_swap = [...mat[bi[0]][bi[1]]];

        drawPixel(bi, mat[row][col]);
        drawPixel([row, col], pixel_to_swap);

        mat[bi[0]][bi[1]] = [...mat[row][col]];
        mat[row][col] = pixel_to_swap;
      }
    }
  }

  function getOrigin(mat, x, y) {
    let row_above = mat[y - 1];
    if (x < 1) return meanCol(row_above[x], row_above[x + 1]);
    if (x >= mat[y].length - 1) return meanCol(row_above[x - 1], row_above[x]);
    return meanCol(row_above[x], meanCol(row_above[x - 1], row_above[x + 1]));
  }

  function getDiagonalOrigin(mat, x, y) {
    if (x === 0) return mat[y - 1][x];
    return meanCol(mat[y - 1][x], mat[y][x - 1]);
  }

  function findBestMatch(origin, arr, candidates) {
    let best_idx = -1;
    let best_val = Number.MAX_VALUE;

    for (let i = 0; i < candidates.length; i++) {
      let yy = p.floor(candidates[i] / nx);
      let xx = candidates[i] % nx;
      let val = compareCols(origin, arr[yy][xx]);

      if (val < best_val) {
        best_val = val;
        best_idx = [yy, xx];
      }
    }
    return best_idx;
  }

  function compareCols(a, b) {
    let dx = a[0] - b[0];
    let dy = a[1] - b[1];
    let dz = a[2] - b[2];
    return p.sqrt(p.pow(dx, 2) + p.pow(dy, 2) + p.pow(dz, 2));
  }

  function meanCol(a, b) {
    let sx = a[0] + b[0];
    let sy = a[1] + b[1];
    let sz = a[2] + b[2];
    return [sx / 2, sy / 2, sz / 2];
  }

  p.keyPressed = function() {
    if (p.keyCode === 80) p.saveCanvas('sketch_' + THE_SEED, 'jpeg');
  };
};
new p5(sketch);

// --- UTILS ---

function newArray(n, value) {
  n = n || 0;
  var array = new Array(n);
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
}

function getRandoms(n, from, to) {
  let arr = [];
  while (arr.length < n) {
    let rand = Math.floor(Math.random() * (to - from)) + from;
    arr.push(rand);
  }
  return arr;
}
