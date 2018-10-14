let nx = 512;
let ny = 512;
let size = 2;
let tick;

let selection_size = 20;

let img;

let sketch = function(p) {
  let THE_SEED;

  p.preload = function() {
    img = p.loadImage('./insta3.jpg');
  };

  p.setup = function() {
    p.createCanvas(1024, 1024);

    p.pixelDensity(1);
    img.loadPixels();
    p.loadPixels();

    THE_SEED = p.floor(p.random(9999999));
    p.randomSeed(THE_SEED);
    p.noStroke();
    //p.noLoop();

    tick = 0;

    imgpixels = newArray(ny).map((x, j) =>
      newArray(nx).map((y, i) => {
        var loc = (i + j * img.width) * 4 * 2;
        return [img.pixels[loc + 0], img.pixels[loc + 1], img.pixels[loc + 2]];
      })
    );

    imgpixels.forEach((pxr, j) =>
      pxr.forEach((px, i) => {
        p.fill(px[0], px[1], px[2]);
        p.rect(size * i, size * j, size, size);
      })
    );

    //imgpixels = sortMatrix(imgpixels);
  };

  p.draw = function() {
    if (tick < ny) {
      imgpixels[tick] = sortRow(imgpixels, tick);

      imgpixels[tick].forEach((px, i) => {
        p.fill(px[0], px[1], px[2]);
        p.rect(size * i, size * tick, size, size);
      });
      tick++;
    }
  };

  p.keyPressed = function() {
    if (p.keyCode === 80) p.saveCanvas('sketch_' + THE_SEED, 'jpeg');
  };

  function sortRow(mat, row_idx) {
    let sorted = [];
    for (let i = 0; i < mat[row_idx].length; i++) {
      if (i === 0 && row_idx === 0) {
        sorted.push(mat[row_idx][i]);
      } else {
        let origin = getOrigin(i, row_idx, mat, sorted);

        let cands = getRandoms(selection_size, nx * row_idx + i, nx * ny);
        let bi = findBestMatch(origin, mat, cands);
        let pixel_to_swap = [...mat[bi[0]][bi[1]]];
        drawPixel(bi, mat[row_idx][i]);
        sorted.push(pixel_to_swap);
        mat[bi[0]][bi[1]] = [...mat[row_idx][i]];
      }
    }
    return sorted;
  }

  function getOrigin(col_idx, row_idx, mat, sorted) {
    if (col_idx === 0) return mat[row_idx - 1][col_idx];

    if (row_idx === 0) return sorted[col_idx - 1];
    return meanCol(sorted[col_idx - 1], mat[row_idx - 1][col_idx]);
  }

  function getUniqueRandoms(n, from, to) {
    let arr = newArray(to - from).map((x, i) => i + from);
    return p.shuffle(arr).slice(0, n);
  }

  function getRandoms(n, from, to) {
    let arr = [];
    while (arr.length < n) {
      let randomnumber = Math.floor(Math.random() * (to - from)) + from;
      arr.push(randomnumber);
    }

    return arr;
  }

  function findBestMatch(origin, arr, idxs) {
    let best_idx = -1;
    let best_val = 100000;

    for (let i = 0; i < idxs.length; i++) {
      let yy = p.floor(idxs[i] / nx);
      let xx = idxs[i] % nx;
      let val = compareCols(origin, arr[yy][xx]);
      if (val < best_val) {
        best_val = val;
        best_idx = [yy, xx];
      }
    }

    return best_idx;
  }

  function drawPixel(pos, col) {
    p.fill(col[0], col[1], col[2]);
    p.rect(size * pos[1], size * pos[0], size, size);
  }

  function compareCols(a, b) {
    //console.log(a, b);
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
};
new p5(sketch);

// --- UTILS ---

function swap(arr, i1, i2) {
  let v1 = arr[i1];
  let v2 = arr[i2];

  arr[i1] = v2;
  arr[i2] = v1;
}

function newArray(n, value) {
  n = n || 0;
  var array = new Array(n);
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
}
