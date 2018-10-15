let nx = 512;
let ny = 512;
let size = 2;

let selection_size = 4;

let img;

let sketch = function(p) {
  let THE_SEED;

  p.preload = function() {
    img = p.loadImage('./img.jpg');
  };

  p.setup = function() {
    p.createCanvas(1024, 1024);

    p.pixelDensity(1);
    img.loadPixels();
    p.loadPixels();

    THE_SEED = p.floor(p.random(9999999));
    p.randomSeed(THE_SEED);
    p.noStroke();

    imgpixels = newArray(ny).map((x, j) =>
      newArray(nx).map((y, i) => {
        var loc = (i + j * img.width) * 4 * 5;
        return [img.pixels[loc + 0], img.pixels[loc + 1], img.pixels[loc + 2]];
      })
    );

    imgpixels = sortMatrix(imgpixels);
  };

  p.draw = function() {
    imgpixels.forEach((pxr, j) =>
      pxr.forEach((px, i) => {
        p.fill(px[0], px[1], px[2]);
        p.rect(size * i, size * j, size, size);
      })
    );
  };

  p.keyPressed = function() {
    if (p.keyCode === 80) p.saveCanvas('sketch_' + THE_SEED, 'jpeg');
  };

  function sortMatrix(mat) {
    let sorted = [];
    mat.forEach((pxr, i) => sorted.push(sortRow(mat, i, sorted)));
    return sorted;
  }

  function sortRow(mat, row_idx, so_far) {
    let arr = mat[row_idx];
    let sorted = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      let vert_arr = mat.map(row => row[i]);
      let origin =
        row_idx == 0
          ? sorted[i - 1]
          : meanCol(sorted[i - 1], so_far[row_idx - 1][i]);
      let cands = getRandoms(selection_size, i, arr.length);
      let vert_cands = getRandoms(selection_size, row_idx, mat.length);

      let bi_h = findBestMatch(origin, arr, cands);
      let bi_v = findBestMatch(origin, vert_arr, vert_cands);

      if (
        compareCols(origin, arr[bi_h]) < compareCols(origin, vert_arr[bi_v])
      ) {
        sorted.push([...arr[bi_h]]);
        arr[bi_h] = [...arr[i]];
      } else {
        sorted.push([...mat[bi_v][i]]);
        mat[bi_v][i] = [...arr[i]];
      }
    }
    return sorted;
  }

  function getRandoms(n, from, to) {
    let arr = newArray(to - from).map((x, i) => i + from);
    return p.shuffle(arr).slice(0, n);
  }

  function findBestMatch(origin, arr, idxs) {
    let best_idx = -1;
    let best_val = 100000;

    for (let i = 0; i < idxs.length; i++) {
      let val = compareCols(origin, arr[idxs[i]]);
      if (val < best_val) {
        best_val = val;
        best_idx = idxs[i];
      }
    }

    return best_idx;
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
