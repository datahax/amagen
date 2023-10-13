// Helper function to split text into multiple lines
function splitToLines(ctx, text, maxWidth) {
  const words = text.split(" ");
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

    // Draw the fill text first
    for (let i = 0; i < textLines.length; i++) {
      offscreenCtx1.fillText(textLines[i], x, y);
      y += lineHeight;
    }

    // Reset y for shadowed stroke
    y = 305; // Center Y of the TV screen
    if (textLines.length > 1) {
      y -= (lineHeight * textLines.length) / 2 - lineHeight;
    } else {
      y += lineHeight / 2;
    }

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

    // Draw the shadowed stroke
    offscreenCtx1.strokeStyle = strokeGradient;

    offscreenCtx1.lineWidth = 2;
    offscreenCtx1.shadowColor = "rgba(0, 0, 0, 0.5)";
    offscreenCtx1.shadowBlur = 1;
    offscreenCtx1.shadowOffsetX = 0;
    offscreenCtx1.shadowOffsetY = 2;
    for (let i = 0; i < textLines.length; i++) {
      offscreenCtx1.strokeText(textLines[i], x, y);
      y += lineHeight;
    }

    // Draw the offscreenCanvas1 onto offscreenCanvas2 with transformation and blur
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
