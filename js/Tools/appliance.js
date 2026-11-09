import { Application, CanvasUtils } from "../appMethods.js";

/**
 * Нарисованный на холсте объект для создания циферблата инструментов
 * таких как часы, динамометры, таймеры
 * dynamometers, timers
 */
export class Appliance {
  #fieldsAppl; // private поля устройства
  propsAppl; // public свойства устройства

  constructor(options = {}) {
    // значения по умолчанию для устройства
    Object.assign(
      this,
      {
        centerX: 0, // X центральная координата
        centerY: 0, // Y центральная координата
        radius: 50, // радиус циферблата устройства
        angle: 0, // угол вращения
        ringColor: "#5f5f5f", // цвет внешнего кольца
        innerRingColor: "#e9e9e9", // цвет внутреннего кольца
        backRingColor: "#7e7e7e", // цвет заднего кольца
        pointerColor: "#d95358", // цвет стрелки
        canvas: undefined, // холст, на котором рисуется устройство
      },
      options,
    );

    // контекст холста
    this.context = this.canvas.getContext("2d");

    /**
     * Private методы устройства
     */
    this.#fieldsAppl = {
      /**
       * Рисует центральную точку
       */
      drawCenterDot: () => {
        this.context.beginPath();

        this.context.fillStyle = "black";

        this.context.arc(
          this.centerX,
          this.centerY,
          this.radius * 0.02,
          0,
          Application.arcPath,
        );

        this.context.fill();
      }, // drawCenterDot

      /**
       * Рисует circle
       */
      drawArc: ({
        fillStyle,
        strokeStyle,
        lineWidth,
        shadowColor,
        shadowOffset,
        shadowBlur,
        radius = this.radius,
      }) => {
        this.context.save();

        this.context.beginPath();

        // цвет тени
        if (shadowColor != undefined) {
          this.context.shadowColor = shadowColor;
        }

        // смещение тени
        if (shadowOffset != undefined) {
          this.context.shadowOffsetX = shadowOffset;
          this.context.shadowOffsetY = shadowOffset;
        }

        // размытие тени
        if (shadowBlur != undefined) {
          this.context.shadowBlur = shadowBlur;
        }

        // стиль заливки
        if (fillStyle != undefined) {
          this.context.fillStyle = fillStyle;
        }

        // стиль обводки
        if (strokeStyle != undefined) {
          this.context.strokeStyle = strokeStyle;
        }

        // ширина линии
        if (lineWidth != undefined) {
          this.context.lineWidth = lineWidth;
        }

        this.context.arc(
          this.centerX,
          this.centerY,
          radius,
          0,
          Application.arcPath,
        );

        this.context.fill();

        if (strokeStyle != undefined) {
          this.context.stroke();
        }

        this.context.restore();
      }, // drawArc
    }; // #fieldsAppl

    /**
     * Свойства для внутреннего использования
     */
    this.propsAppl = {
      getShadowBlur: () => this.radius * 0.2,

      getShadowOffset: () => this.radius * 0.05,

      getInnerCircleWidth: () => this.radius * 0.1,

      getInnerRadius: () => this.radius * 0.88,

      getFaceLineWidth: () => this.radius * 0.02,

      getLineOutCoord: () =>
        this.propsAppl.getInnerRadius() -
        this.propsAppl.getFaceLineWidth() -
        this.propsAppl.getInnerCircleWidth() / 2,

      getCenterRingWidth: () => this.radius * 0.25,

      getCenterInnerRingWidth: () => this.radius * 0.15,

      /**
       * Вращает холст
       */
      rotateCanvas: () => {
        CanvasUtils.rotateCanvas(
          this.context,
          this.centerX,
          this.centerY,
          this.angle,
        );
      },

      /**
       * Получает координаты
       */
      coordCalc: (angle, lineLength) => {
        let shiftCoordOut =
          this.propsAppl.getInnerRadius() -
          lineLength -
          this.propsAppl.getInnerCircleWidth() / 2;

        let x1_out =
          this.centerX + this.propsAppl.getLineOutCoord() * Math.cos(angle);

        let y1_out =
          this.centerY + this.propsAppl.getLineOutCoord() * Math.sin(angle);

        let x2_out = this.centerX + shiftCoordOut * Math.cos(angle);

        let y2_out = this.centerY + shiftCoordOut * Math.sin(angle);

        return {
          x1_out,
          y1_out,
          x2_out,
          y2_out,
        };
      }, // coordCalc

      /**
       * Рисует текст на циферблате устройства
       */
      drawText: (angle, shiftRatio, font, text) => {
        let { x2_out, y2_out } = this.propsAppl.coordCalc(
          angle,
          this.radius * shiftRatio,
        );

        this.context.beginPath();

        CanvasUtils.drawCenterText(this.context, font, text, x2_out, y2_out);

        this.context.stroke();
      }, // drawText

      /**
       * Эффект блика стекла: белый highlight к более темному innerRingColor.
       */
      createGlassGradient: () => {
        const ctx = this.context;
        const previous = ctx.fillStyle;
        ctx.fillStyle = this.innerRingColor;
        const color = ctx.fillStyle;
        ctx.fillStyle = previous;

        const white = "rgb(255,255,255)";

        const mix = (amount) => {
          const c = Application.colorInterpolate(white, color, amount);
          return "rgb(" + c.r + "," + c.g + "," + c.b + ")";
        };

        const radius = this.propsAppl.getInnerRadius();

        const gradient = ctx.createRadialGradient(
          this.centerX - radius * 0.32,
          this.centerY - radius * 0.32,
          radius * 0.08,
          this.centerX,
          this.centerY,
          radius,
        );

        gradient.addColorStop(0, mix(0));
        gradient.addColorStop(0.35, mix(0.25));
        gradient.addColorStop(0.7, mix(0.55));
        gradient.addColorStop(1, mix(0.85));

        return gradient;
      }, // createGlassGradient

      /**
       * Рисует внутренние окружности циферблата устройства
       */
      drawInnerFace: () => {
        let grad = this.context.createLinearGradient(
          this.centerX,
          this.centerY + this.radius * 0.25,
          this.centerX,
          this.centerY - this.radius,
        );

        // внутренняя окружность
        this.#fieldsAppl.drawArc({
          fillStyle: this.propsAppl.createGlassGradient(),
          strokeStyle: this.backRingColor,
          lineWidth: this.propsAppl.getInnerCircleWidth(),
          shadowColor: "black",
          shadowOffset: 1,
          shadowBlur: 1,
          radius: this.propsAppl.getInnerRadius(),
        });

        // центральная внешняя окружность
        grad.addColorStop(0, "white");
        grad.addColorStop(0.5, this.backRingColor);

        this.#fieldsAppl.drawArc({
          fillStyle: grad,
          shadowColor: "black",
          shadowOffset: 1,
          shadowBlur: 1,
          radius: this.propsAppl.getCenterRingWidth(),
        });

        // центральная внутренняя окружность
        grad = this.context.createLinearGradient(
          this.centerX,
          this.centerY + this.radius * 0.7,
          this.centerX,
          this.centerY - this.radius,
        );

        grad.addColorStop(0, this.backRingColor);
        grad.addColorStop(0.5, "white");

        this.#fieldsAppl.drawArc({
          fillStyle: grad,
          shadowColor: "black",
          shadowOffset: 1,
          shadowBlur: 1,
          radius: this.propsAppl.getCenterInnerRingWidth(),
        });
      }, // drawInnerFace

      /**
       * Рисует внешнюю окружность с тенью циферблата устройства
       */
      drawOuterFace: () => {
        this.#fieldsAppl.drawArc({
          fillStyle: this.ringColor,
          strokeStyle: "black",
          lineWidth: 1,
          shadowColor: "#464646",
          shadowOffset: this.propsAppl.getShadowOffset(),
          shadowBlur: this.propsAppl.getShadowBlur(),
        });
      }, // drawOuterFace
    }; // propsAppl
  } // constructor

  /**
   * Рисует устройство
   */
  draw() {
    this.context.save();

    this.propsAppl.rotateCanvas();

    // внешняя окружность
    this.propsAppl.drawOuterFace();

    // внутренние окружности
    this.propsAppl.drawInnerFace();

    this.context.restore();

    // маленькая центральная точка
    this.#fieldsAppl.drawCenterDot();
  } // draw

  /**
   * Рисует стрелку индикатора
   */
  drawPointer(angle = 0, arcWidth = 10) {
    this.context.save();

    this.propsAppl.rotateCanvas(
      this.centerX,
      this.centerY,
      this.radius,
      this.radius,
    );

    this.context.beginPath();

    this.context.strokeStyle = "black"; // цвет обводки стрелки

    let startAngle = Application.degrToRad(angle);

    let a_end_ang = Application.degrToRad(angle + 180 + arcWidth);

    let a_start_ang = Application.degrToRad(angle + 180 - arcWidth);

    this.context.shadowColor = "#464646";
    this.context.shadowOffsetX = 5;
    this.context.shadowOffsetY = 5;
    this.context.shadowBlur = 5;

    let y1_out =
      this.centerY + this.propsAppl.getLineOutCoord() * Math.sin(startAngle);

    let x1_out =
      this.centerX + this.propsAppl.getLineOutCoord() * Math.cos(startAngle);

    // координата конца стрелки
    this.context.moveTo(x1_out, y1_out);

    this.context.arc(
      this.centerX,
      this.centerY,
      0.3 * this.radius,
      a_start_ang,
      a_end_ang,
    );

    this.context.lineTo(x1_out, y1_out);

    this.context.fillStyle = this.pointerColor;

    this.context.fill();

    this.context.stroke();

    this.context.restore();

    this.#fieldsAppl.drawCenterDot();
  } // drawPointer
} // Appliance
