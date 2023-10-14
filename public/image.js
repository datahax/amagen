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
  const maxCharsPerLine = 14;
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
  const maxWidth = 1000;
  const lineHeight = canvas.height / 8;
  const debugMode = text.toUpperCase().substr(0, 5) === "DEBUG";
  const textLines = splitToLines(offscreenCtx1, text.toUpperCase(), maxWidth);
  const resetY = () => canvas.height / 2 - 13;
  let x = canvas.width / 2;
  let y = resetY();

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

  // Text fill setup
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

  // Text stroke setup
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
  offscreenCtx1.strokeStyle = strokeGradient;
  offscreenCtx1.lineWidth = 2;

  offscreenCtx1.shadowColor = "rgba(0, 0, 0, 0.5)";
  offscreenCtx1.shadowBlur = 1;
  offscreenCtx1.shadowOffsetX = 0;
  offscreenCtx1.shadowOffsetY = 2;

  imageObj.src = "public/canvas.jpg";
  imageObj.onload = function () {
    ctx.drawImage(imageObj, 0, 0);

    // Draw the fill text first
    for (let i = 0; i < textLines.length; i++) {
      offscreenCtx1.fillText(textLines[i], x, y);
      y += lineHeight;
    }

    // Reset y for shadowed stroke
    y = resetY();
    if (textLines.length > 1) {
      y -= (lineHeight * textLines.length) / 2 - lineHeight;
    } else {
      y += lineHeight / 2;
    }

    // Draw the shadowed stroke
    for (let i = 0; i < textLines.length; i++) {
      offscreenCtx1.strokeText(textLines[i], x, y);
      y += lineHeight;
    }

    // Draw the offscreenCanvas1 onto offscreenCanvas2 with blur
    offscreenCtx2.filter = "blur(0.5px)";
    offscreenCtx2.drawImage(offscreenCanvas1, 0, 0);
    offscreenCtx2.filter = "none"; // Reset the filter

    // Draw the debugging grid and background over the blurred content
    const rowHeight = offscreenCanvas2.height / 8;
    for (let row = rowHeight; row < offscreenCanvas2.height; row += rowHeight) {
      offscreenCtx2.moveTo(0, row);
      offscreenCtx2.lineTo(offscreenCanvas2.width, row);
    }

    const colWidth = offscreenCanvas2.width / 12;
    for (let col = colWidth; col < offscreenCanvas2.width; col += colWidth) {
      offscreenCtx2.moveTo(col, 0);
      offscreenCtx2.lineTo(col, offscreenCanvas2.height);
    }

    offscreenCtx2.strokeStyle = "red";
    offscreenCtx2.lineWidth = 0.5;
    if (debugMode) offscreenCtx2.stroke();

    offscreenCtx2.fillStyle = "rgba(255,0,0,.2)";

    if (debugMode) offscreenCtx2.fillRect(0, 0, canvas.width, canvas.height);

    const topLeft = [113, 92];
    const topRight = [846, 96];
    const bottomRight = [842, 540];
    const bottomLeft = [123, 558];

    const width = Math.sqrt(
      Math.pow(topRight[0] - topLeft[0], 2) +
      Math.pow(topRight[1] - topLeft[1], 2)
    );
    const height = Math.sqrt(
      Math.pow(bottomLeft[0] - topLeft[0], 2) +
      Math.pow(bottomLeft[1] - topLeft[1], 2)
    );

    // Scaling factors
    const xScale = width / offscreenCanvas2.width;
    const yScale = height / offscreenCanvas2.height;

    // Set transformation
    ctx.setTransform(xScale, 0, 0, yScale, topLeft[0], topLeft[1]);

    // Draw the text onto the main canvas
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
