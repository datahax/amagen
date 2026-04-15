function splitLongWords(words, maxWidth) {
  const result = [];

  words.forEach((word) => {
    if (word.length > maxWidth) {
      for (let i = 0; i < word.length; i += maxWidth) {
        result.push(
          word.slice(i, i + maxWidth) + (i + maxWidth < word.length ? "-" : ""),
        );
      }
    } else {
      result.push(word);
    }
  });

  return result;
}

// Helper function to split text into multiple lines
function splitToLines(ctx, text, maxWidth) {
  const maxCharsPerLine = 18;
  const words = splitLongWords(text.split(" "), maxCharsPerLine);
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(`${currentLine}  ${word}`).width;
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      // Check if the maximum number of lines is reached
      if (lines.length >= 5) {
        // considering the current line will be the 5th
        break;
      }

      lines.push(currentLine);
      currentLine = word;
    }
  }

  // Add the current line if there's space left
  if (lines.length < 6) {
    lines.push(currentLine);
  }

  return lines;
}

// Matrix class for affine transformations
class Matrix {
  constructor(points) {
    if (points.length !== 6) {
      throw new Error("Matrix initialization requires an array of 6 points.");
    }
    this.data = [...points];
  }

  invert() {
    const [a, b, c, d, e, f] = this.data;
    const det = a * d - b * c;
    if (!det) {
      throw new Error("Matrix is non-invertible.");
    }
    return new Matrix([
      d / det,
      -b / det,
      -c / det,
      a / det,
      (c * f - d * e) / det,
      (b * e - a * f) / det,
    ]);
  }

  multiply(matrix) {
    const [a1, b1, c1, d1, e1, f1] = this.data;
    const [a2, b2, c2, d2, e2, f2] = matrix.data;

    return new Matrix([
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ]);
  }
}

// Helper function to set canvas transformation
function setTransform(ctx, src, dst) {
  const a = new Matrix(src);
  const b = new Matrix(dst);
  const c = b.multiply(a.invert());
  ctx.setTransform(c.a, c.b, c.c, c.d, c.e, c.f);
}

// Main function to generate image with styled text
function generateImage(text) {
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

  // Font setup and alignment
  offscreenCtx1.textAlign = "center";
  offscreenCtx1.font = "700 51px 'Poppins'";

  // Text line splitting
  const maxWidth = 700;
  const lineHeight = 70;
  const textLines = splitToLines(offscreenCtx1, text.toUpperCase(), maxWidth);
  let x = 479; // Center X of the TV screen
  let y = 305; // Center Y of the TV screen

  if (textLines.length > 1) {
    y -= (lineHeight * textLines.length) / 2 - lineHeight;
  } else {
    y += lineHeight / 2;
  }

  let textWidth = 0;
  const textHeight = lineHeight * textLines.length;

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

    // Set the transformation for the TV screen projection
    const srcPoints = [112, 90, 847, 96, 126, 560];
    const dstPoints = [0, 0, canvas.width, 0, 0, canvas.height];
    setTransform(offscreenCtx1, srcPoints, dstPoints);
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
      maskCtx.font = "700 51px 'Poppins'";
      setTransform(maskCtx, srcPoints, dstPoints);
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

    // Keep original second-pass projection + blur.
    offscreenCtx2.filter = "blur(0.5px)";
    setTransform(offscreenCtx2, srcPoints, dstPoints);
    offscreenCtx2.drawImage(offscreenCanvas1, 0, 0);
    offscreenCtx2.filter = "none"; // Reset the filter

    // Draw the offscreen canvas onto the main canvas
    ctx.drawImage(offscreenCanvas2, 0, 0);
  };
}

// Event listener to update the image based on user input
const textInput = document.querySelector("#text");
textInput.addEventListener("input", (event) => {
  generateImage(event.target.value);
});

// Initial call to the function
generateImage("");
