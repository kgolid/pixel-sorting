const maxWidth = 1200;
const maxHeight = 800;
const speed = 500;
const expand_with_diagonals = false;
const expansion_candidates = 30;
const selection_size = 18;
const reversed = false;
const include_original = false;

const local_swap = true;
const max_swap_dist = 50;

let nx, ny;
let img, imgpixels;
let candidates;
let pixels_placed;

let ready_for_processing;
let front;

let sketch = function (p) {
  p.setup = function () {
    const c = p.createCanvas(600, 600);
    ready_for_processing = false;

    p.fill(255);
    p.textSize(21);
    p.textAlign(p.CENTER);

    p.pixelDensity(1);
    c.drop(gotFile, fileDropped);
    c.dragOver(fileDropped);
  };

  p.draw = function () {
    if (ready_for_processing) {
      if (pixels_placed < nx * ny - speed) placePixels(speed);
      else if (pixels_placed < nx * ny) placePixels(nx * ny - pixels_placed);
    } else {
      p.background('#888');
      p.text('Drop an image here!', p.width / 2, p.height / 2);
      p.noLoop();
    }
  };

  function fileDropped() {
    ready_for_processing = false;
  }

  function gotFile(file) {
    if (file.type === 'image') {
      p.loadImage(file.data, imageLoaded);
    } else {
      console.log('Not an image file!');
    }
  }

  function imageLoaded(img) {
    if (img.height / maxHeight > img.width / maxWidth) {
      if (img.height > maxHeight) img.resize(0, maxHeight);
    } else {
      if (img.width > maxWidth) img.resize(maxWidth, 0);
    }

    img.loadPixels();

    nx = Math.floor(img.width);
    ny = Math.floor(img.height);
    p.resizeCanvas(nx, ny);

    originalpixels = newArray(ny).map((_, j) =>
      newArray(nx).map((_, i) => {
        var loc = (i + j * img.width) * 4;
        return [img.pixels[loc + 0], img.pixels[loc + 1], img.pixels[loc + 2]];
      })
    );

    imgpixels = newArray(ny).map((_, j) =>
      newArray(nx).map((_, i) => {
        var loc = (i + j * img.width) * 4;
        return [img.pixels[loc + 0], img.pixels[loc + 1], img.pixels[loc + 2], i, j];
      })
    );

    front = newArray(ny).map((_, j) =>
      newArray(nx).map((_, i) => {
        return { bx: i, by: j, filled: false, adjacent: false, dist: -1, ndiff: -1 };
      })
    );
    drawImage(imgpixels);

    const centre = [Math.floor(Math.random() * nx), Math.floor(Math.random() * ny)];
    //const centre = [Math.floor(nx / 2), Math.floor(ny / 2)];
    front[centre[1]][centre[0]] = {
      bx: centre[0],
      by: centre[1],
      filled: true,
      neighbor: true,
      dist: 0,
      ndiff: 0,
    };

    drawPixel(centre);
    candidates = expandNeighborhood([centre], centre);

    pixels_placed = 1;
    ready_for_processing = true;
    p.loop();
  }

  function drawImage(image) {
    image.forEach((pxr, j) =>
      pxr.forEach((px, i) => {
        drawPixel([i, j], px);
      })
    );
  }

  function drawPixel(pos) {
    const col = colorInBack(pos);
    p.stroke(...col);
    p.point(...pos);
  }

  function placePixels(n) {
    for (i = 0; i < n; i++) {
      // Find expansion pixel and expand candidates accordingly.
      const currentPos = getNearest(candidates);
      candidates = expandNeighborhood(candidates, currentPos);

      // Find best matching pixel among selection.
      let origin = getSurroundingColor(currentPos);
      let cands = getRandoms(selection_size, pixels_placed, nx * ny, currentPos);
      let best = findBestMatch(origin, cands, currentPos);
      let frontBest = positionInFront(best);

      // Swap expansion pixel with matching pixel.
      swap_refs(currentPos[0], currentPos[1], frontBest[0], frontBest[1], false);

      front[currentPos[1]][currentPos[0]].filled = true;

      // Draw the swapped pixels.
      drawPixel(currentPos);
      drawPixel(frontBest);

      let row = Math.floor(pixels_placed / nx);
      let col = pixels_placed % nx;
      let frontScanPos = positionInFront([col, row]);

      // Swap in back array to consolidate (critical for performance).
      swap_refs(currentPos[0], currentPos[1], frontScanPos[0], frontScanPos[1], true);

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

  p.keyPressed = function () {
    if (p.keyCode === 80) p.saveCanvas('sketch_', 'jpeg');
  };

  // --- UTILS ---

  function positionInFront([x, y]) {
    return [imgpixels[y][x][3], imgpixels[y][x][4]];
  }

  function colorInBack([x, y]) {
    let front_item = front[y][x];
    return imgpixels[front_item.by][front_item.bx].slice(0, 3);
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

  function getRandoms(n, from, to, cpos) {
    let arr = [];
    let tick = 0;
    while (arr.length < n) {
      let rand = Math.floor(p.random() * (to - from)) + from;

      if (local_swap && cpos != null) {
        let yy = Math.floor(rand / nx);
        let xx = rand % nx;
        var pos = [imgpixels[yy][xx][3], imgpixels[yy][xx][4]];

        if (dist(pos, cpos) < max_swap_dist || tick > 6000) arr.push(rand);
        tick++;
      } else {
        arr.push(rand);
      }
    }
    return arr;
  }

  function getNearest(rs) {
    //const reverse = p.random() > 0.97 ? !reversed : reversed;
    let closest = reversed ? 0 : Number.MAX_VALUE;
    let closest_item = null;

    let sign = reversed ? -1 : 1;

    let selection = getRandoms(expansion_candidates, 0, rs.length - 1);
    selection.forEach((r) => {
      let dist = front[rs[r][1]][rs[r][0]].ndiff;
      if (sign * dist < sign * closest) {
        closest_item = rs[r];
        closest = dist;
      }
    });
    return closest_item;
  }

  function getAdjacentIndices(q, include_diagonals) {
    let indices = [];
    if (q[0] < nx - 1) indices.push([q[0] + 1, q[1]]);
    if (q[1] < ny - 1) indices.push([q[0], q[1] + 1]);
    if (q[0] > 0) indices.push([q[0] - 1, q[1]]);
    if (q[1] > 0) indices.push([q[0], q[1] - 1]);

    if (include_diagonals) {
      if (q[0] < nx - 1) {
        if (q[1] < ny - 1) indices.push([q[0] + 1, q[1] + 1]);
        if (q[1] > 0) indices.push([q[0] + 1, q[1] - 1]);
      }
      if (q[0] > 0) {
        if (q[1] < ny - 1) indices.push([q[0] - 1, q[1] + 1]);
        if (q[1] > 0) indices.push([q[0] - 1, q[1] - 1]);
      }
    }
    return indices;
  }

  function expandNeighborhood(neighborhood, next) {
    if (!neighborhood.includes(next)) {
      console.error('Next pixel is not from the neighboorhood', neighborhood);
      return neighborhood;
    }

    let expansion = getAdjacentIndices(next, expand_with_diagonals).filter(
      (pos) => !front[pos[1]][pos[0]].filled
    );

    expansion.forEach((pos) => {
      front[pos[1]][pos[0]].dist = front[next[1]][next[0]].dist + 1;
      front[pos[1]][pos[0]].ndiff = compareCols(
        originalpixels[pos[1]][pos[0]],
        originalpixels[next[1]][next[0]]
      );
    });

    expansion = expansion.filter((pos) => !front[pos[1]][pos[0]].adjacent);
    expansion.forEach((pos) => {
      front[pos[1]][pos[0]].adjacent = true;
    });

    const next_index = neighborhood.indexOf(next);
    neighborhood.splice(next_index, 1);

    return neighborhood.concat(expansion);
  }

  function getSurroundingColor(q) {
    const adj = getAdjacentIndices(q, true)
      .filter((pos) => front[pos[1]][pos[0]].filled)
      .map((ind) => colorInBack(ind));
    if (include_original) adj.push(originalpixels[q[1]][q[0]]);
    return meanColor(adj);
  }

  function meanColor(arr) {
    let sx = arr.map((x) => x[0]).reduce((a, b) => a + b, 0);
    let sy = arr.map((x) => x[1]).reduce((a, b) => a + b, 0);
    let sz = arr.map((x) => x[2]).reduce((a, b) => a + b, 0);

    return [sx / arr.length, sy / arr.length, sz / arr.length];
  }

  function dist(a, b) {
    return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
  }
};
new p5(sketch);
