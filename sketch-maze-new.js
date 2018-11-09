let nx;
let ny;
let size = 2;
let img_resolution = 5;

let expand_with_diagonals = false;
let expansion_candidates = 10;
let selection_size = 50;
let reversed = true;
let include_original = false;

let img, imgpixels;
let candidates;
let pixels_placed;

let front;

let sketch = function(p) {
  let THE_SEED;

  p.preload = function() {
    img = p.loadImage('https://raw.githubusercontent.com/kgolid/pixel-sorting/master/img.jpg');
  };

  p.setup = function() {
    nx = Math.floor(img.width / img_resolution);
    ny = Math.floor(img.height / img_resolution);
    p.createCanvas(nx * size, ny * size);
    p.pixelDensity(1);
    img.loadPixels();
    p.loadPixels();

    THE_SEED = p.floor(p.random(9999999));
    console.log('Seed: ', THE_SEED);
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
        return [
          img.pixels[loc + 0],
          img.pixels[loc + 1],
          img.pixels[loc + 2],
          i,
          j
        ];
      })
    );

    front = newArray(ny).map((_, j) =>
      newArray(nx).map((_, i) => {
        return { bx: i, by: j, filled: false };
      })
    );
    drawImage(imgpixels);

    const centre = [Math.floor(nx / 2), Math.floor(ny / 2), 0];
    front[centre[1]][centre[0]] = {
      bx: centre[0],
      by: centre[1],
      filled: true
    };

    drawPixel([centre[1], centre[0]]);
    candidates = expandNeighborhood([centre], centre);

    pixels_placed = 1;
  };

  p.draw = function() {
    if (pixels_placed < nx * ny - 500) placePixels(500);
    else if (pixels_placed < nx * ny) placePixels(nx * ny - pixels_placed);
  };

  function drawImage(image) {
    image.forEach((pxr, j) =>
      pxr.forEach((px, i) => {
        drawPixel([i, j], px);
      })
    );
  }

  function drawPixel(pos) {
    const col = colorInBack(pos);
    p.fill(col[0], col[1], col[2]);
    p.rect(size * pos[0], size * pos[1], size, size);
  }

  function placePixels(n) {
    for (i = 0; i < n; i++) {
      // Find expansion pixel and expand candidates accordingly.
      const currentPos = getNearest(candidates, reversed);
      candidates = expandNeighborhood(candidates, currentPos);

      // Find best matching pixel among selection.
      let origin = getSurroundingColor(currentPos);
      let cands = getRandoms(selection_size, pixels_placed, nx * ny);
      let best = findBestMatch(origin, cands);
      let frontBest = positionInFront(best);

      // Swap expansion pixel with matching pixel.
      swap_refs(
        currentPos[0],
        currentPos[1],
        frontBest[0],
        frontBest[1],
        false
      );

      front[currentPos[1]][currentPos[0]].filled = true;

      // Draw the swapped pixels.
      drawPixel(currentPos);
      drawPixel(frontBest);

      let row = Math.floor(pixels_placed / nx);
      let col = pixels_placed % nx;
      let frontScanPos = positionInFront([col, row]);

      // Swap in back array to consolidate (critical for performance).
      swap_refs(
        currentPos[0],
        currentPos[1],
        frontScanPos[0],
        frontScanPos[1],
        true
      );

      pixels_placed++;
    }
  }

  function findBestMatch(origin, candidates) {
    let best_idx = -1;
    let best_val = Number.MAX_VALUE;

    for (let i = 0; i < candidates.length; i++) {
      let yy = Math.floor(candidates[i] / nx);
      let xx = candidates[i] % nx;
      let val = compareCols(origin, imgpixels[yy][xx]);

      if (val < best_val) {
        best_val = val;
        best_idx = [xx, yy];
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

  // --- UTILS ---

  function positionInFront([x, y]) {
    return [imgpixels[y][x][3], imgpixels[y][x][4]];
  }

  function colorInBack([x, y]) {
    let front_item = front[y][x];
    return imgpixels[front_item.by][front_item.bx];
  }

  function swap_refs(px, py, rx, ry, swap_colors_in_back) {
    const pfront = { bx: front[py][px].bx, by: front[py][px].by };
    const rfront = { bx: front[ry][rx].bx, by: front[ry][rx].by };

    const pcol = imgpixels[pfront.by][pfront.bx].slice(0);
    const rcol = imgpixels[rfront.by][rfront.bx].slice(0);

    front[py][px].bx = rfront.bx;
    front[py][px].by = rfront.by;
    front[ry][rx].bx = pfront.bx;
    front[ry][rx].by = pfront.by;

    imgpixels[pfront.by][pfront.bx][3] = rcol[3];
    imgpixels[pfront.by][pfront.bx][4] = rcol[4];
    imgpixels[rfront.by][rfront.bx][3] = pcol[3];
    imgpixels[rfront.by][rfront.bx][4] = pcol[4];

    if (swap_colors_in_back) {
      imgpixels[pfront.by][pfront.bx] = rcol;
      imgpixels[rfront.by][rfront.bx] = pcol;
    }
  }

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
      let rand = Math.floor(p.random() * (to - from)) + from;
      arr.push(rand);
    }
    return arr;
  }

  function getNearest(rs, reverse) {
    reverse = p.random() > 0.98 ? !reverse : reverse;
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

  function getAdjacentIndices(q, include_diagonals) {
    let indices = [];
    if (q[0] < nx - 1) indices.push([q[0] + 1, q[1], q[2] + 1]);
    if (q[1] < ny - 1) indices.push([q[0], q[1] + 1, q[2] + 1]);
    if (q[0] > 0) indices.push([q[0] - 1, q[1], q[2] + 1]);
    if (q[1] > 0) indices.push([q[0], q[1] - 1, q[2] + 1]);

    if (include_diagonals) {
      if (q[0] < nx - 1) {
        if (q[1] < ny - 1) indices.push([q[0] + 1, q[1] + 1, q[2] + 1]);
        if (q[1] > 0) indices.push([q[0] + 1, q[1] - 1, q[2] + 1]);
      }
      if (q[0] > 0) {
        if (q[1] < ny - 1) indices.push([q[0] - 1, q[1] + 1, q[2] + 1]);
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
    const expansion = getAdjacentIndices(next, expand_with_diagonals).filter(
      pos => !front[pos[1]][pos[0]].filled
    );

    const next_index = neighborhood.indexOf(next);
    neighborhood.splice(next_index, 1);

    return union(neighborhood, expansion); // return union
  }

  function getSurroundingColor(q) {
    const adj = getAdjacentIndices(q, true)
      .filter(pos => front[pos[1]][pos[0]].filled)
      .map(ind => colorInBack(ind));
    if (include_original) adj.push(originalpixels[q[1]][q[0]]);
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
};
new p5(sketch);
