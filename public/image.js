function splitToLines(ctx, text, maxWidth) {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + " " + word).width;
    console.log(`Word: ${word}, Width: ${width}, MaxWidth: ${maxWidth}`);
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);

  console.log(lines);

  return lines;
}

function generateImage(text) {
  const imageObj = new Image();
  const canvas = document.getElementById("amaBoard");
  var ctx = canvas.getContext("2d");

  var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop("0", "gold");
  gradient.addColorStop("0.5", "white");
  gradient.addColorStop("1.0", "gold");

  ctx.textAlign = "center";
  ctx.font = "800 60px Arial";
  ctx.fillStyle = gradient;
  ctx.strokeStyle = gradient;
  ctx.color = "red";
  ctx.shadowBlur = 5;
  ctx.shadowColor = "gold";

  var maxWidth = 800;
  var lineHeight = 70;
  var textLines = splitToLines(ctx, text.toUpperCase(), maxWidth);
  var x = canvas.width / 2 - 90;
  var y = canvas.height / 2;

  if (textLines.length > 1) {
    y -= (lineHeight * textLines.length) / 2 - lineHeight;
  }

  imageObj.src = "public/canvas.jpg";
  imageObj.onload = function () {
    ctx.drawImage(imageObj, 0, 0);

    for (var i = 0; i < textLines.length; i++) {
      ctx.fillText(textLines[i], x, y);
      y += lineHeight;
    }
  };
}

const textInput = document.querySelector("#text");
textInput.addEventListener("input", (event) => {
  generateImage(event.target.value);
});

generateImage("");
