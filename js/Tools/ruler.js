import { Application, CanvasUtils } from "../appMethods.js";

/**
 * Нарисованный на холсте объект линейки
 */
export class Ruler {
  constructor({
    canvas = undefined, // холст, на котором рисуется линейка
    startX = 0, // начальная координата X линейки
    startY = 0, // начальная координата Y линейки
    length = 200, // длина линейки
    height = 50, // высота линейки
    maxValue = 10, // максимальное значение
    backColor = "orange", // цвет фона
    strokeColor = "black", // цвет обводки
    showBackground = true, // флаг, указывающий, что фон рисуется
    showBottom = true, // флаг, указывающий, что нижняя часть рисуется
    angle = 0, // угол вращения
  }) {
    this.canvas = canvas;
    this.startX = startX;
    this.startY = startY;
    this.length = length;
    this.height = height;
    this.maxValue = maxValue;
    this.backColor = backColor;
    this.strokeColor = strokeColor;
    this.showBackground = showBackground;
    this.showBottom = showBottom;
    this.angle = angle;
  }

  draw() {
    let ctx = this.canvas.getContext("2d");
    let endX = this.startX + this.length;
    let divisor = 10;
    let step = (endX - this.startX) / (this.maxValue * divisor);
    let shortLineHeight = this.height / 6;
    let lineHeight = shortLineHeight;
    let fontSize = this.height * 0.18;
    let font = fontSize + "px Times New Roman";
    let stepHideCondition = step > 2;
    let showLabels = fontSize >= 6;

    ctx.save();
    CanvasUtils.rotateCanvas(ctx, this.startX, this.startY, this.angle);
    ctx.font = font;

    if (this.showBackground) {
      ctx.beginPath();
      ctx.fillStyle = this.backColor;
      ctx.strokeStyle = this.strokeColor;
      ctx.fillRect(this.startX, this.startY, this.length, this.height);
      ctx.rect(this.startX, this.startY, this.length, this.height);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    ctx.fillStyle = this.strokeColor;
    ctx.lineWidth = Math.max(0.5, this.height / 60);

    const labelFits = (xCoord, text) => {
      let metrics = ctx.measureText(text);
      return (
        xCoord - metrics.width / 2 > this.startX &&
        xCoord + metrics.width / 2 < endX
      );
    };

    const drawLabel = (text, xCoord) => {
      if (!showLabels || !labelFits(xCoord, text)) {
        return;
      }
      CanvasUtils.drawCenterText(
        ctx,
        font,
        text,
        xCoord,
        this.startY + this.height / 2,
      );
    };

    for (let x = 1; x <= this.maxValue * divisor - 1; x++) {
      let xCoord = this.startX + x * step;

      if (x % divisor == 0) // long lines
      {
        lineHeight = this.height / 3;
        let currentValue = x / divisor;

        // рисует метки с текстом, в зависимости от максимального значения
        let drawCondition = (intervalStart, intervalEnd, conditionNumber) => {
          if (this.maxValue > intervalStart && this.maxValue <= intervalEnd) {
            // условие рисования большого интервала
            if (currentValue % conditionNumber == 0) {
              drawLabel(currentValue, xCoord);
            } else {
              // условие рисования маленького интервала
              if (currentValue % Math.round(conditionNumber / divisor) == 0) {
                lineHeight = shortLineHeight;
              } else {
                lineHeight = 0;
              }
            }
          }
        };

        let conditionNumber = stepHideCondition ? 1 : divisor;
        let interval = 100;

        // интервал 10 -100
        drawCondition(divisor, interval, conditionNumber);

        // интервал 100 -1000
        for (let i = 1; i < divisor; i++) {
          let beginInterval = i * interval;
          let endInterval = beginInterval + interval;
          let condition = i * conditionNumber;

          drawCondition(beginInterval, endInterval, condition);
        }

        if (this.maxValue <= divisor) {
          drawLabel(x / divisor, xCoord);
        }
      }
      // короткие линии
      else {
        lineHeight = stepHideCondition ? shortLineHeight : 0;
      }

      // линии линейки
      ctx.moveTo(xCoord, this.startY);
      ctx.lineTo(xCoord, this.startY + lineHeight);

      if (this.showBottom) {
        ctx.moveTo(xCoord, this.startY + this.height);
        ctx.lineTo(xCoord, this.startY + this.height - lineHeight);
      }
    }

    ctx.stroke();
    ctx.restore();
  }
} // Ruler
