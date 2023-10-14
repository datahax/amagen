function createGradient(ctx, x, y, length, angle, colorStops) {
  const x1 = x + (Math.cos(angle - Math.PI / 2) * length) / 2;
  const y1 = y + (Math.sin(angle - Math.PI / 2) * length) / 2;
  const x2 = x + (Math.cos(angle + Math.PI / 2) * length) / 2;
  const y2 = y + (Math.sin(angle + Math.PI / 2) * length) / 2;

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));

  return gradient;
}

function calculateY(initialY, textLines, lineHeight, textHeight) {
  let y = initialY;
  if (textLines.length > 1) {
    y -= textHeight / 2 - lineHeight;
  } else {
    y += lineHeight / 2;
  }
  return y;
}

function drawTextLines(ctx, textLines, x, y, lineHeight) {
  for (let i = 0; i < textLines.length; i++) {
    ctx.fillText(textLines[i], x, y + i * lineHeight);
    ctx.strokeText(textLines[i], x, y + i * lineHeight);
  }
}

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

function drawDebugGrid(ctx, gridRows, gridCols) {
  ctx.beginPath();
  const rowHeight = ctx.canvas.height / gridRows;
  for (let row = rowHeight; row < ctx.canvas.height; row += rowHeight) {
    ctx.moveTo(0, row);
    ctx.lineTo(ctx.canvas.width, row);
  }

  const colWidth = ctx.canvas.width / gridCols;
  for (let col = colWidth; col < ctx.canvas.width; col += colWidth) {
    ctx.moveTo(col, 0);
    ctx.lineTo(col, ctx.canvas.height);
  }

  ctx.strokeStyle = "red";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,0,0,.2)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// Main function to generate image with styled text
function generateImage(text) {
  const imageObj = new Image();
  const canvas = document.getElementById("amaBoard");
  const ctx = canvas.getContext("2d");

  // Create the first offscreen canvas for text rendering
  const offscreenCanvas1 = document.createElement("canvas");
  offscreenCanvas1.width = canvas.width;
  offscreenCanvas1.height = canvas.height;
  const offscreenCtx1 = offscreenCanvas1.getContext("2d");

  // Create the second offscreen canvas for blur effect
  const offscreenCanvas2 = document.createElement("canvas");
  offscreenCanvas2.width = canvas.width;
  offscreenCanvas2.height = canvas.height;
  const offscreenCtx2 = offscreenCanvas2.getContext("2d");

  // Font setup and alignment
  offscreenCtx1.textAlign = "center";
  offscreenCtx1.font = "700 80px 'Poppins'";

  // Text line splitting
  const maxWidth = canvas.width * 0.83333;
  const lineHeight = canvas.height / 8;
  const debugMode = text.toUpperCase().substr(0, 5) === "DEBUG";
  const textLines = splitToLines(offscreenCtx1, text.toUpperCase(), maxWidth);
  let textWidth = 0;
  const textHeight = lineHeight * textLines.length;

  const baseY = canvas.height / 2 - 13;
  let x = canvas.width / 2;
  let y = calculateY(baseY, textLines, lineHeight, textHeight);

  for (let i = 0; i < textLines.length; i++) {
    const lineWidth = offscreenCtx1.measureText(textLines[i]).width;
    if (lineWidth > textWidth) {
      textWidth = lineWidth;
    }
  }

  // Text fill setup
  const length = Math.sqrt(textWidth * textWidth + textHeight * textHeight);
  const fillGradientColorStops = [
    [0, "#b59514"],
    [0.15, "#a68200"],
    [0.31, "#9e780b"],
    [0.4, "#c2c496"],
    [0.52, "#cad9dc"],
    [0.63, "#d1e7ff"],
    [0.76, "#b0bdaa"],
    [0.88, "#bab466"],
    [1, "#bab466"],
  ];
  const fillAngle = -50 * (Math.PI / 180);
  offscreenCtx1.fillStyle = createGradient(offscreenCtx1, x, y, length, fillAngle, fillGradientColorStops);

  // Text stroke setup
  const strokeGradientColorStops = [
    [0, "#b59514"],
    [0.04, "#c2c496"],
    [0.13, "#9e780b"],
    [0.25, "#cad9dc"],
    [0.36, "#d1e7ff"],
    [0.51, "#a68200"],
    [0.67, "#b0bdaa"],
    [0.88, "#bab466"],
    [1, "#bab466"],
  ];
  const strokeAngle = -130 * (Math.PI / 180);
  offscreenCtx1.strokeStyle = createGradient(offscreenCtx1, x, y, length, strokeAngle, strokeGradientColorStops);

  offscreenCtx1.lineWidth = 2;
  offscreenCtx1.shadowColor = "rgba(0, 0, 0, 0.5)";
  offscreenCtx1.shadowBlur = 1;
  offscreenCtx1.shadowOffsetX = 0;
  offscreenCtx1.shadowOffsetY = 2;

  imageObj.src = "public/canvas.jpg";
  imageObj.onload = function () {
    ctx.drawImage(imageObj, 0, 0);

    // Draw the fill text and shadowed stroke
    drawTextLines(offscreenCtx1, textLines, x, y, lineHeight);

    // Draw the offscreenCanvas1 onto offscreenCanvas2 with blur
    offscreenCtx2.filter = "blur(0.5px)";
    offscreenCtx2.drawImage(offscreenCanvas1, 0, 0);
    offscreenCtx2.filter = "none"; // Reset the filter

    // Draw the debugging grid and background over the blurred content
    if (debugMode) drawDebugGrid(offscreenCtx2, 8, 12);

    // Coordinates of the top-left corner of the TV screen
    const screenTopLeft = [102, 91];
    const screenWidth = 731;
    const screenHeight = 445;

    // Scale factors
    const xScale = screenWidth / offscreenCanvas2.width;
    const yScale = screenHeight / offscreenCanvas2.height;

    // Set transformation
    ctx.setTransform(xScale, 0, 0, yScale, screenTopLeft[0], screenTopLeft[1]);

    // Draw the offscreenCanvas2 onto the main canvas
    ctx.drawImage(offscreenCanvas2, 0, 0);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
}

// Event listener to update the image based on user input
const textInput = document.querySelector("#text");
textInput.addEventListener("input", (event) => {
  generateImage(event.target.value);
});

// Initial call to the function
const input = document.querySelector("input[type=text]");
generateImage(input.value);
