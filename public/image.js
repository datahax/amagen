// Set true to show the red TV grid / lime outline overlay.
const DEBUG_MODE = false;

// Layout grid on the TV screen plane.
const GRID_ROWS = 16;
const GRID_COLS = 24;
// Outer safe-zone padding in grid cells.
const OUTER_PADDING_CELLS = 1;

function splitWordToWidth(ctx, word, maxWidth) {
  if (!word) {
    return [word];
  }
  if (ctx.measureText(word).width <= maxWidth) {
    return [word];
  }

  const parts = [];
  let rest = word;
  while (rest.length > 0) {
    if (ctx.measureText(rest).width <= maxWidth) {
      parts.push(rest);
      break;
    }

    // Largest prefix that fits, with a hyphen when more remains.
    let low = 1;
    let high = rest.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const candidate = `${rest.slice(0, mid)}-`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    parts.push(`${rest.slice(0, low)}-`);
    rest = rest.slice(low);
  }
  return parts;
}

// Helper function to split text into multiple lines
function splitToLines(ctx, text, maxWidth, maxLines) {
  const rawWords = text.split(" ");
  const words = [];
  for (const word of rawWords) {
    words.push(...splitWordToWidth(ctx, word, maxWidth));
  }

  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const next = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      currentLine = next;
    } else {
      if (lines.length >= maxLines - 1) {
        break;
      }
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (lines.length < maxLines && (currentLine || lines.length === 0)) {
    lines.push(currentLine);
  }

  return lines;
}

function invertHomography(H) {
  const a = H.a;
  const b = H.b;
  const c = H.c;
  const d = H.d;
  const e = H.e;
  const f = H.f;
  const g = H.g;
  const h = H.h;
  const i = 1;

  const A = e * i - f * h;
  const B = c * h - b * i;
  const C = b * f - c * e;
  const D = f * g - d * i;
  const E = a * i - c * g;
  const F = c * d - a * f;
  const G = d * h - e * g;
  const Hh = b * g - a * h;
  const I = a * e - b * d;
  const det = a * A + b * D + c * G;

  return {
    a: A / det,
    b: B / det,
    c: C / det,
    d: D / det,
    e: E / det,
    f: F / det,
    g: G / det,
    h: Hh / det,
    i: I / det,
  };
}

function mapHomography(M, x, y) {
  const w = M.g * x + M.h * y + M.i;
  return [(M.a * x + M.b * y + M.c) / w, (M.d * x + M.e * y + M.f) / w];
}

function sampleBilinear(data, width, height, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = x - x0;
  const fy = y - y0;

  const i00 = (y0 * width + x0) * 4;
  const i10 = (y0 * width + x1) * 4;
  const i01 = (y1 * width + x0) * 4;
  const i11 = (y1 * width + x1) * 4;

  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c += 1) {
    const v00 = data[i00 + c];
    const v10 = data[i10 + c];
    const v01 = data[i01 + c];
    const v11 = data[i11 + c];
    const v0 = v00 * (1 - fx) + v10 * fx;
    const v1 = v01 * (1 - fx) + v11 * fx;
    out[c] = v0 * (1 - fy) + v1 * fy;
  }
  return out;
}

/** Draw an image onto a destination quad with perspective (no triangle seams). */
function drawImageToQuad(ctx, image, corners) {
  const [tl, tr, br, bl] = corners;
  const srcCtx = image.getContext("2d");
  const src = srcCtx.getImageData(0, 0, image.width, image.height);
  const sw = image.width;
  const sh = image.height;

  const minX = Math.max(
    0,
    Math.floor(Math.min(tl[0], tr[0], br[0], bl[0])),
  );
  const maxX = Math.min(
    ctx.canvas.width,
    Math.ceil(Math.max(tl[0], tr[0], br[0], bl[0])),
  );
  const minY = Math.max(
    0,
    Math.floor(Math.min(tl[1], tr[1], br[1], bl[1])),
  );
  const maxY = Math.min(
    ctx.canvas.height,
    Math.ceil(Math.max(tl[1], tr[1], br[1], bl[1])),
  );
  const dw = maxX - minX;
  const dh = maxY - minY;
  if (dw <= 0 || dh <= 0) {
    return;
  }

  const out = ctx.createImageData(dw, dh);
  const inv = invertHomography(squareToQuad(tl, tr, br, bl));

  for (let y = 0; y < dh; y += 1) {
    for (let x = 0; x < dw; x += 1) {
      const [u, v] = mapHomography(inv, minX + x + 0.5, minY + y + 0.5);
      if (u < 0 || v < 0 || u > 1 || v > 1) {
        continue;
      }

      const rgba = sampleBilinear(src.data, sw, sh, u * (sw - 1), v * (sh - 1));
      if (rgba[3] < 1) {
        continue;
      }

      const i = (y * dw + x) * 4;
      out.data[i] = rgba[0];
      out.data[i + 1] = rgba[1];
      out.data[i + 2] = rgba[2];
      out.data[i + 3] = rgba[3];
    }
  }

  const tmp = document.createElement("canvas");
  tmp.width = dw;
  tmp.height = dh;
  tmp.getContext("2d").putImageData(out, 0, 0);
  ctx.drawImage(tmp, minX, minY);
}

// TV screen corners in image pixels: top-left, top-right, bottom-right, bottom-left.
const TV_CORNERS = [
  [117, 96],
  [847, 100],
  [842, 540],
  [131, 560],
];

/** Homography mapping unit square (0,0)/(1,0)/(1,1)/(0,1) -> p0/p1/p2/p3. */
function squareToQuad(p0, p1, p2, p3) {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;

  const dx1 = x1 - x2;
  const dy1 = y1 - y2;
  const dx2 = x3 - x2;
  const dy2 = y3 - y2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy3 = y0 - y1 + y2 - y3;

  let a;
  let b;
  let c;
  let d;
  let e;
  let f;
  let g;
  let h;

  if (dx3 === 0 && dy3 === 0) {
    a = x1 - x0;
    b = x2 - x1;
    c = x0;
    d = y1 - y0;
    e = y2 - y1;
    f = y0;
    g = 0;
    h = 0;
  } else {
    const invDet = 1 / (dx1 * dy2 - dx2 * dy1);
    g = (dx3 * dy2 - dx2 * dy3) * invDet;
    h = (dx1 * dy3 - dx3 * dy1) * invDet;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + h * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + h * y3;
    f = y0;
  }

  return { a, b, c, d, e, f, g, h };
}

function mapSquare(H, u, v) {
  const w = H.g * u + H.h * v + 1;
  return [(H.a * u + H.b * v + H.c) / w, (H.d * u + H.e * v + H.f) / w];
}

function drawDebugTvOverlay(ctx, corners, gridRows, gridCols) {
  const [tl, tr, br, bl] = corners;
  const H = squareToQuad(tl, tr, br, bl);

  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 0.5;
  for (let row = 0; row <= gridRows; row += 1) {
    const v = row / gridRows;
    const [x0, y0] = mapSquare(H, 0, v);
    const [x1, y1] = mapSquare(H, 1, v);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  for (let col = 0; col <= gridCols; col += 1) {
    const u = col / gridCols;
    const [x0, y0] = mapSquare(H, u, 0);
    const [x1, y1] = mapSquare(H, u, 1);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Main function to generate image with styled text
function generateImage(text) {
  const fontSize = 80;
  const font = `700 ${fontSize}px 'Poppins'`;

  // Measure/wrap only after Poppins is available — fallback metrics overflow.
  Promise.resolve(document.fonts.load(font)).then(() => {
    renderImage(text, fontSize, font);
  });
}

function renderImage(text, fontSize, font) {
  const imageObj = new Image();
  const canvas = document.getElementById("amaBoard");
  const ctx = canvas.getContext("2d");

  // Create the first offscreen canvas
  const offscreenCanvas1 = document.createElement("canvas");
  offscreenCanvas1.width = canvas.width;
  offscreenCanvas1.height = canvas.height;
  const offscreenCtx1 = offscreenCanvas1.getContext("2d");

  // Create the second offscreen canvas
  const offscreenCanvas2 = document.createElement("canvas");
  offscreenCanvas2.width = canvas.width;
  offscreenCanvas2.height = canvas.height;
  const offscreenCtx2 = offscreenCanvas2.getContext("2d");

  // Font/layout — text keeps the larger row size (2 fine cells); padding is 1 fine cell.
  const cellHeight = canvas.height / GRID_ROWS;
  const cellWidth = canvas.width / GRID_COLS;
  const padY = OUTER_PADDING_CELLS * cellHeight;
  const padX = OUTER_PADDING_CELLS * cellWidth;
  const lineHeight = cellHeight * 2;
  const maxLines = Math.floor((GRID_ROWS - OUTER_PADDING_CELLS * 2) / 2);
  offscreenCtx1.textAlign = "center";
  offscreenCtx1.font = font;

  // Leave room for stroke (2px) so ink stays inside the 1-cell pad.
  const maxWidth = canvas.width - padX * 2 - 4;
  const textLines = splitToLines(
    offscreenCtx1,
    text.toUpperCase(),
    maxWidth,
    maxLines,
  );
  const x = canvas.width / 2;

  // Center the ink box inside the padded content area.
  const metrics = offscreenCtx1.measureText(textLines[0] || "M");
  const ascent =
    metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent =
    metrics.actualBoundingBoxDescent || fontSize * 0.2;
  const blockHeight =
    ascent + descent + lineHeight * Math.max(textLines.length - 1, 0);
  const contentTop = padY;
  const contentHeight = canvas.height - padY * 2;
  let y = contentTop + (contentHeight - blockHeight) / 2 + ascent;

  let textWidth = 0;
  const textHeight = blockHeight;

  for (let i = 0; i < textLines.length; i++) {
    const lineWidth = offscreenCtx1.measureText(textLines[i]).width;
    if (lineWidth > textWidth) {
      textWidth = lineWidth;
    }
  }

  // Gradient setup
  const fillAngle = -50 * (Math.PI / 180);
  const length = Math.sqrt(textWidth * textWidth + textHeight * textHeight);
  const x1 = x + (Math.cos(fillAngle - Math.PI / 2) * length) / 2;
  const y1 = y + (Math.sin(fillAngle - Math.PI / 2) * length) / 2;
  const x2 = x + (Math.cos(fillAngle + Math.PI / 2) * length) / 2;
  const y2 = y + (Math.sin(fillAngle + Math.PI / 2) * length) / 2;

  const gradient = offscreenCtx1.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, "#b59514");
  gradient.addColorStop(0.15, "#a68200");
  gradient.addColorStop(0.31, "#9e780b");
  gradient.addColorStop(0.4, "#c2c496");
  gradient.addColorStop(0.52, "#cad9dc");
  gradient.addColorStop(0.63, "#d1e7ff");
  gradient.addColorStop(0.76, "#b0bdaa");
  gradient.addColorStop(0.88, "#bab466");
  gradient.addColorStop(1, "#bab466");
  offscreenCtx1.fillStyle = gradient;

  imageObj.src = "public/canvas.jpg";
  imageObj.onload = function () {
    ctx.drawImage(imageObj, 0, 0);

    // Draw text flat in screen space (no canvas transform).
    const startY = y;

    const strokeAngle = -130 * (Math.PI / 180);
    const strokeX1 = x + (Math.cos(strokeAngle - Math.PI / 2) * length) / 2;
    const strokeY1 = y + (Math.sin(strokeAngle - Math.PI / 2) * length) / 2;
    const strokeX2 = x + (Math.cos(strokeAngle + Math.PI / 2) * length) / 2;
    const strokeY2 = y + (Math.sin(strokeAngle + Math.PI / 2) * length) / 2;

    const strokeGradient = offscreenCtx1.createLinearGradient(
      strokeX1,
      strokeY1,
      strokeX2,
      strokeY2,
    );
    strokeGradient.addColorStop(0, "#b59514");
    strokeGradient.addColorStop(0.04, "#c2c496");
    strokeGradient.addColorStop(0.13, "#9e780b");
    strokeGradient.addColorStop(0.25, "#cad9dc");
    strokeGradient.addColorStop(0.36, "#d1e7ff");
    strokeGradient.addColorStop(0.51, "#a68200");
    strokeGradient.addColorStop(0.67, "#b0bdaa");
    strokeGradient.addColorStop(0.88, "#bab466");
    strokeGradient.addColorStop(1, "#bab466");

    // Draw fill first (original Firefox-approved look).
    offscreenCtx1.fillStyle = gradient;
    y = startY;
    for (let i = 0; i < textLines.length; i++) {
      offscreenCtx1.fillText(textLines[i], x, y);
      y += lineHeight;
    }

    // Draw stroke on top with subtle inset shadow.
    const isSafari =
      navigator.userAgent.includes("Safari") &&
      !navigator.userAgent.includes("Chrome") &&
      !navigator.userAgent.includes("Chromium");
    if (isSafari) {
      // Safari: build top-edge inset shadow from a text alpha mask.
      // This avoids horizontal side shadowing on vertical glyph strokes.
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext("2d");
      maskCtx.textAlign = "center";
      maskCtx.font = font;
      maskCtx.fillStyle = "#fff";
      y = startY;
      for (let i = 0; i < textLines.length; i++) {
        maskCtx.fillText(textLines[i], x, y);
        y += lineHeight;
      }

      const maskImage = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
      const maskData = maskImage.data;

      const insetCanvas = document.createElement("canvas");
      insetCanvas.width = canvas.width;
      insetCanvas.height = canvas.height;
      const insetCtx = insetCanvas.getContext("2d");
      const insetImage = insetCtx.createImageData(canvas.width, canvas.height);
      const insetData = insetImage.data;

      const width = canvas.width;
      const height = canvas.height;
      // Stronger at top edge, fades downward; no horizontal spread.
      const alphaRamp = [105, 85, 62, 42];
      for (let py = 1; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const i = (py * width + px) * 4;
          const a = maskData[i + 3];
          if (a === 0) {
            continue;
          }
          const topI = ((py - 1) * width + px) * 4;
          const topA = maskData[topI + 3];
          if (topA !== 0) {
            continue;
          }
          for (let d = 0; d < alphaRamp.length; d++) {
            const yy = py + d;
            if (yy >= height) {
              break;
            }
            const yi = (yy * width + px) * 4;
            if (maskData[yi + 3] === 0) {
              break;
            }
            const alpha = alphaRamp[d];
            if (alpha > insetData[yi + 3]) {
              insetData[yi + 3] = alpha;
            }
          }
        }
      }
      for (let i = 0; i < insetData.length; i += 4) {
        insetData[i] = 0;
        insetData[i + 1] = 0;
        insetData[i + 2] = 0;
      }
      insetCtx.putImageData(insetImage, 0, 0);
      offscreenCtx1.drawImage(insetCanvas, 0, 0);

      // Draw crisp gradient stroke on top without shadow.
      offscreenCtx1.strokeStyle = strokeGradient;
      offscreenCtx1.lineWidth = 2;
      offscreenCtx1.shadowColor = "transparent";
      offscreenCtx1.shadowBlur = 0;
      offscreenCtx1.shadowOffsetX = 0;
      offscreenCtx1.shadowOffsetY = 0;
      y = startY;
      for (let i = 0; i < textLines.length; i++) {
        offscreenCtx1.strokeText(textLines[i], x, y);
        y += lineHeight;
      }
    } else {
      offscreenCtx1.strokeStyle = strokeGradient;
      offscreenCtx1.lineWidth = 2;
      offscreenCtx1.shadowColor = "rgba(0, 0, 0, 0.5)";
      offscreenCtx1.shadowBlur = 1;
      offscreenCtx1.shadowOffsetX = 0;
      offscreenCtx1.shadowOffsetY = 2;
      y = startY;
      for (let i = 0; i < textLines.length; i++) {
        offscreenCtx1.strokeText(textLines[i], x, y);
        y += lineHeight;
      }
    }

    offscreenCtx2.filter = "blur(0.5px)";
    offscreenCtx2.drawImage(offscreenCanvas1, 0, 0);
    offscreenCtx2.filter = "none";

    // Project flat text plane onto the calibrated TV quad.
    drawImageToQuad(ctx, offscreenCanvas2, TV_CORNERS);

    if (DEBUG_MODE) {
      drawDebugTvOverlay(ctx, TV_CORNERS, GRID_ROWS, GRID_COLS);
    }
  };
}

// Event listener to update the image based on user input
const textInput = document.querySelector("#text");
textInput.addEventListener("input", (event) => {
  generateImage(event.target.value);
});

// Initial call to the function
generateImage("");
