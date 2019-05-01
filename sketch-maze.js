let nx = 512;
let ny = 512;
let size = 2;
let img_resolution = 5;

let expansion_candidates = 8;
let selection_size = 500;
let reversed = true;
let include_original = true;

let tick = 0;
let img, imgpixels;
let result;
let candidates;
let pixels_placed;

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

    originalpixels = newArray(ny).map((_, j) =>
      newArray(nx).map((_, i) => {
        var loc = (i + j * img.width) * 4 * img_resolution;
        return [img.pixels[loc + 0], img.pixels[loc + 1], img.pixels[loc + 2]];
      })
    );

    imgpixels = newArray(ny).map((_, j) =>
      newArray(nx).map((_, i) => {
        var loc = (i + j * img.width) * 4 * img_resolution;
        return [img.pixels[loc + 0], img.pixels[loc + 1], img.pixels[loc + 2]];
      })
    );
    result = newArray(ny).map(() => newArray(nx, null));

    const centre = [Math.floor(nx / 2), Math.floor(ny / 2), 0];
    const start = [
      ...imgpixels[Math.floor(Math.random() * nx)][
        Math.floor(Math.random() * ny)
      ]
    ];
    result[centre[0]][centre[1]] = start;

    drawPixel([centre[0], centre[1]], start);
    candidates = expandNeighborhood([centre], centre);

    pixels_placed = 0;

    //drawImage(imgpixels);
  };

  p.draw = function() {
    if (pixels_placed < nx * ny - 500) placePixels(500);
    else if (pixels_placed < nx * ny) placePixels(nx * ny - pixels_placed - 1);
  };

  function drawImage(image) {
    image.forEach((pxr, j) =>
      pxr.forEach((px, i) => {
        drawPixel([j, i], px);
      })
    );
  }

  function drawPixel(pos, col) {
    p.fill(col[0], col[1], col[2]);
    p.rect(size * pos[1], size * pos[0], size, size);
  }

  function placePixels(n) {
    for (i = 0; i < n; i++) {
      const resultPos = getNearest(
        [Math.floor(nx / 2), Math.floor(ny / 2)],
        candidates,
        reversed
      );

      let origin = getSurroundingColor(resultPos);
      let cands = getRandoms(selection_size, pixels_placed, nx * ny);
      let bi = findBestMatch(origin, cands);

      candidates = expandNeighborhood(candidates, resultPos);

      let pixel_to_swap = [...imgpixels[bi[0]][bi[1]]];

      let row = Math.floor(pixels_placed / nx);
      let col = pixels_placed % nx;
      imgpixels[bi[0]][bi[1]] = [...imgpixels[row][col]];

      result[resultPos[0]][resultPos[1]] = pixel_to_swap;

      drawPixel([...resultPos], pixel_to_swap);
      pixels_placed++;
    }
  }

  function findBestMatch(origin, candidates) {
    //console.log(candidates);
    let best_idx = -1;
    let best_val = Number.MAX_VALUE;

    for (let i = 0; i < candidates.length; i++) {
      let yy = p.floor(candidates[i] / nx);
      let xx = candidates[i] % nx;
      let val = compareCols(origin, imgpixels[yy][xx]);

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

function getNearest(q, rs, reverse) {
  let closest = reverse ? 0 : Number.MAX_VALUE;
  let closest_item = null;

  let sign = reverse ? -1 : 1;

  let selection = getRandoms(expansion_candidates, 0, rs.length - 1);
  selection.forEach(r => {
    let dist = rs[r][2];
    if (sign * dist < sign * closest) {
      closest_item = rs[r];
      closest = dist;
    }
  });
  return closest_item;
}

function distance(a, b) {
  return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
}

function getAdjacentIndices(q, include_diagonals) {
  let indices = [];
  if (q[0] < nx - 1) indices.push([q[0] + 1, q[1], q[2] + 1]);
  if (q[1] < ny - 1) indices.push([q[0], q[1] + 1, q[2] + 1]);
  if (q[0] > 0) indices.push([q[0] - 1, q[1], q[2] + 1]);
  if (q[1] > 0) indices.push([q[0], q[1] - 1, q[2] + 1]);

  if (include_diagonals) {
    if (q[0] < nx - 1) {
      if (q[1] < nx - 1) indices.push([q[0] + 1, q[1] + 1, q[2] + 1]);
      if (q[1] > 0) indices.push([q[0] + 1, q[1] - 1, q[2] + 1]);
    }
    if (q[0] > 0) {
      if (q[1] < nx - 1) indices.push([q[0] - 1, q[1] + 1, q[2] + 1]);
      if (q[1] > 0) indices.push([q[0] - 1, q[1] - 1, q[2] + 1]);
    }
  }
  return indices;
}

function expandNeighborhood(neighborhood, next) {
  if (!neighborhood.includes(next)) {
    console.error('Next pixel is not from the neighboorhood', neighborhood);
    return neighborhood;
  }
  const expansion = getAdjacentIndices(next, false).filter(
    pos => result[pos[0]][pos[1]] === null
  );

  const next_index = neighborhood.indexOf(next);
  neighborhood.splice(next_index, 1);

  return union(neighborhood, expansion); // return union
}

function getSurroundingColor(q) {
  const adj = getAdjacentIndices(q, true)
    .filter(pos => result[pos[0]][pos[1]] !== null)
    .map(ind => result[ind[0]][ind[1]]);
  if (include_original) adj.push(originalpixels[q[0]][q[1]]);
  return meanColor(adj);
}
function meanColor(arr) {
  let sx = arr.map(x => x[0]).reduce((a, b) => a + b, 0);
  let sy = arr.map(x => x[1]).reduce((a, b) => a + b, 0);
  let sz = arr.map(x => x[2]).reduce((a, b) => a + b, 0);

  return [sx / arr.length, sy / arr.length, sz / arr.length];
}

function union(a, b) {
  let c = [...b];
  a.forEach(x => {
    if (!b.some(y => eq(x, y))) c.push(x);
  });
  return c;
}

function eq(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
