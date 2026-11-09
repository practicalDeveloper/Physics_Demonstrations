import { Application, CanvasUtils } from "../appMethods.js";

/**
 * Методы, связанные с темой 'Механические колебания'
 */
export class PendulumDemo {
  constructor() {
    this.canvas = undefined;
    this.ctx = undefined;
    this.dataContext = undefined;
    this.animationFrame = null;
    this.motionId = 0;

    this.constants = Object.freeze({
      ballRadius: 20,
      smallBallRadius: 6,
      rodWidth: 3,
      ballStroke: 5,
      smallBallStroke: 2,
      hang: { y: 100 },
      lengthUnit: 800 / 15,
      layout: { baseWidth: 960, baseHeight: 800 },
    });

    this.settings = {
      pendulumLength: 0,
      pendulumLength2: 0,
      pendulumCoord: { x: 0, y: 0 }, // координаты центра маятника
      ballRadius: 20,
      smallBallRadius: 6,
      rodWidth: 3,
      ballStroke: 5,
      smallBallStroke: 2,
    };
  }

  resizePendulum() {
    CanvasUtils.applyScale(this);
    let cst = this.constants;
    this.resizeHangCoord(cst);
    this.resizeBalls(cst);
    this.resizeRod(cst);
    this.resizeLengths(cst);
  }

  resizeHangCoord(cst) {
    this.settings.pendulumCoord.x = this.canvas.clientWidth / 2;
    this.settings.pendulumCoord.y = cst.hang.y * this.stageScale;
  }

  resizeBalls(cst) {
    this.settings.ballRadius = cst.ballRadius * this.stageScale;
    this.settings.smallBallRadius = cst.smallBallRadius * this.stageScale;
    this.settings.ballStroke = Math.max(1, cst.ballStroke * this.stageScale);
    this.settings.smallBallStroke = Math.max(
      1,
      cst.smallBallStroke * this.stageScale,
    );
  }

  resizeRod(cst) {
    this.settings.rodWidth = Math.max(1, cst.rodWidth * this.stageScale);
  }

  resizeLengths(cst) {
    const unit = cst.lengthUnit * this.stageScale;
    const first = this.dataContext.topicVariables.firstLength;
    const second = this.dataContext.topicVariables.secondLength;

    this.settings.pendulumLength =
      unit * (Application.isNumber(first) ? first : 1);
    this.settings.pendulumLength2 =
      unit * (Application.isNumber(second) ? second : 1);
  }

  /**
   * Инициализация
   */
  init() {
    CanvasUtils.setBaseSize(
      this,
      this.constants.layout.baseWidth,
      this.constants.layout.baseHeight,
    );
    this.resizePendulum();
  }

  /**
   * Рисование маятника
   */
  drawPendulum(xCoord, yCoord, ballColor) {
    //holder
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(
      this.settings.pendulumCoord.x,
      this.settings.pendulumCoord.y,
    );
    this.ctx.lineTo(xCoord, yCoord);
    this.ctx.strokeStyle = "#003300";
    this.ctx.lineWidth = this.settings.rodWidth;
    this.ctx.stroke();
    this.ctx.fill();
    this.ctx.restore();

    this.drawShadedBall(
      xCoord,
      yCoord,
      this.settings.ballRadius,
      ballColor,
      this.settings.ballStroke,
    );

    this.drawShadedBall(
      this.settings.pendulumCoord.x,
      this.settings.pendulumCoord.y,
      this.settings.smallBallRadius,
      "yellow",
      this.settings.smallBallStroke,
    );
  } // drawPendulum

  /**
   * Затенение сферы: светлый угол, темный край.
   */
  drawShadedBall(x, y, radius, fillColor, strokeWidth) {
    const ctx = this.ctx;

    ctx.save();

    const previous = ctx.fillStyle;
    ctx.fillStyle = fillColor;
    const color = ctx.fillStyle;
    ctx.fillStyle = previous;

    const black = "rgb(0,0,0)";
    const white = "rgb(255,255,255)";
    const mix = (toward, amount) => {
      const c = Application.colorInterpolate(color, toward, amount);
      return "rgb(" + c.r + "," + c.g + "," + c.b + ")";
    };

    const gradient = ctx.createRadialGradient(
      x - radius * 0.32,
      y - radius * 0.32,
      radius * 0.08,
      x,
      y,
      radius,
    );

    gradient.addColorStop(0, mix(white, 0.92));
    gradient.addColorStop(0.22, mix(white, 0.35));
    gradient.addColorStop(0.5, mix(white, 0.12));
    gradient.addColorStop(0.82, mix(black, 0.2));
    gradient.addColorStop(1, mix(black, 0.45));

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 180);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = "#003300";
    ctx.stroke();

    ctx.restore();
  }

  animatePendulum(startAngle, timeInterval, startAngle2, timeInterval2) {
    const canvas = this.canvas;

    // функция для расчета настроек для маятника
    const calculateSettings = (angle) => {
      let endAngle = 0;

      if (angle >= 180 && angle <= 270) {
        angle = 270 + (270 - angle);
      }

      if (angle > 90 && angle < 180) {
        angle = 90 - (angle - 90);
      }

      if (angle >= 0 && angle <= 90) {
        endAngle = 180 - angle;
      }

      if (angle >= 270 && angle <= 360) {
        endAngle = angle + 360 - 2 * (angle - 270);
      }

      if (angle > 90) {
        return {
          startAngle: endAngle,
          endAngle: angle,
        };
      }

      return {
        startAngle: angle,
        endAngle: endAngle,
      };
    };

    // настройки для первого маятника
    const firstSettings = calculateSettings(startAngle);
    // настройки для второго маятника
    const secondSettings = calculateSettings(startAngle2);

    // функция для получения угла маятника
    const getAngle = (startAngle, endAngle, period, elapsed) => {
      const halfPeriod = period / 2;
      // время внутри текущего периода
      const timeInPeriod = elapsed % period;

      // первая половина периода (startAngle -> endAngle)
      if (timeInPeriod <= halfPeriod) {
        const progress = timeInPeriod / halfPeriod;
        return startAngle + (endAngle - startAngle) * progress;
      }

      // вторая половина периода (endAngle -> startAngle)
      const progress = (timeInPeriod - halfPeriod) / halfPeriod;

      return endAngle - (endAngle - startAngle) * progress;
    };

    // координаты маятников
    const currentPosition = {
      x: 0,
      y: 0,
    };

    const currentPosition2 = {
      x: 0,
      y: 0,
    };

    const radius = this.settings.pendulumLength;
    const radius2 = this.settings.pendulumLength2;

    // время начала анимации
    let startTime = null;

    const motionId = this.motionId;

    const step = (timestamp) => {
      if (motionId !== this.motionId) {
        return;
      }

      if (startTime === null) {
        startTime = timestamp;
      }

      // время, прошедшее с начала анимации
      const elapsed = timestamp - startTime;

      // =====================================================
      //  ПЕРВЫЙ МАЯТНИК
      // =====================================================
      const currentAngle = getAngle(
        firstSettings.startAngle,
        firstSettings.endAngle,
        timeInterval,
        elapsed,
      );

      currentPosition.x =
        this.settings.pendulumCoord.x +
        Math.cos(Application.degrToRad(currentAngle)) * radius;

      currentPosition.y =
        this.settings.pendulumCoord.y +
        Math.sin(Application.degrToRad(currentAngle)) * radius;

      // =====================================================
      // ВТОРОЙ МАЯТНИК
      // =====================================================
      const currentAngle2 = getAngle(
        secondSettings.startAngle,
        secondSettings.endAngle,
        timeInterval2,
        elapsed,
      );

      currentPosition2.x =
        this.settings.pendulumCoord.x +
        Math.cos(Application.degrToRad(currentAngle2)) * radius2;

      currentPosition2.y =
        this.settings.pendulumCoord.y +
        Math.sin(Application.degrToRad(currentAngle2)) * radius2;

      CanvasUtils.clearCanvas(canvas);

      this.drawPendulum(currentPosition.x, currentPosition.y, "red");

      this.drawPendulum(currentPosition2.x, currentPosition2.y, "blue");

      // следующий кадр
      this.animationFrame = requestAnimationFrame(step);
    };

    // начало анимации
    this.animationFrame = requestAnimationFrame(step);
  }

  /**
   *  функция, которая вызывается при изменении данных в iframe
   */
  async receivedMessage() {
    this.resizePendulum();
    this.stopTimer();

    this.animatePendulum(
      Number(this.dataContext.topicVariables.firstAngle),
      this.dataContext.topicVariables.firstPeriod * 1000,
      Number(this.dataContext.topicVariables.secondAngle),
      this.dataContext.topicVariables.secondPeriod * 1000,
    );
  }

  stopTimer() {
    this.motionId += 1;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);

      this.animationFrame = null;
    }
  }

  // очищает все переменные
  reset() {
    this.stopTimer();
  }
} // pendulumDemo
