import { Application, CanvasUtils } from "../appMethods.js";

/**
 * Нарисованный на холсте объект для физических экспериментов, таких как груз, крюк и т.д.
 */
export class StageItem {
  constructor(options = {}) {
    /**
     *  значения по умолчанию для элемента
     */
    Object.assign(
      this,
      {
        x: 0, // левая верхняя начальная координата X элемента
        y: 0, // левая верхняя начальная координата Y элемента
        width: 40, // ширина элемента в пикселях
        height: 40, // высота элемента в пикселях
        fill: "#7aa7ca", // цвет фона элемента
        strokeColor: "black", // цвет обводки элемента
        weight: 1, // вес элемента (может быть кг, г, фунт и т.д.)
        itemText: "item", // текст на элементе
        lineWidth: 2, // ширина обводки элемента
        canvas: undefined, // холст, на котором рисуется элемент
      },
      options,
    );

    /**
     * свойства StageItem для внутреннего использования
     */
    this.props = {
      getItemFont: () => this.width * 0.35 + "px Tahoma",

      /**
       * Эффект металлического цилиндра, затенение слева.
       * Края остаются близки к this.fill, светлая полоса находится слева от центра.
       */
      linearGradient: (ctx) => {
        let previous = ctx.fillStyle;
        ctx.fillStyle = this.fill;
        let color = ctx.fillStyle;
        ctx.fillStyle = previous;

        const black = "rgb(0,0,0)";
        const white = "rgb(255,255,255)";
        const mix = (toward, amount) => {
          const c = Application.colorInterpolate(color, toward, amount);
          return "rgb(" + c.r + "," + c.g + "," + c.b + ")";
        };

        let gradient = ctx.createLinearGradient(
          this.x,
          this.y,
          this.x + this.width,
          this.y,
        );

        gradient.addColorStop(0, mix(black, 0.45));
        gradient.addColorStop(0.12, mix(white, 0.35));
        gradient.addColorStop(0.32, mix(white, 0.92));
        gradient.addColorStop(0.55, mix(white, 0.15));
        gradient.addColorStop(0.82, mix(black, 0.2));
        gradient.addColorStop(1, mix(black, 0.5));

        return gradient;
      }, // linearGradient

      /**
       * рисует крюк для элемента
       */
      drawHook: (ctx) => {
        let xCoord = this.x + this.width / 2;
        let yCoord = this.y + this.height;

        ctx.lineWidth = this.lineWidth;

        ctx.beginPath();

        let hLine = this.getUpperHookSize();

        // рисует верхнюю линию
        ctx.moveTo(this.x + this.width / 2, this.y);

        ctx.lineTo(this.x + this.width / 2, this.y - hLine);

        ctx.stroke();

        let hook = new Hook({
          x: xCoord,
          y: yCoord,
          size: this.getHookSize(),
        });

        hook.canvas = this.canvas;

        hook.draw();
      }, // drawHook
    }; // props
  } // constructor

  /**
   * Получает ширину и высоту нижнего крюка
   */
  getHookSize() {
    return this.height / 2;
  }

  /**
   * Получает высоту верхнего крюка
   */
  getUpperHookSize() {
    return this.height / 5;
  }

  /**
   * Получает общую высоту элемента
   */
  geItemHeight() {
    return this.height + this.getHookSize() + this.getUpperHookSize();
  }
}

/**
 * Нарисованный на холсте объект груза
 */
export class Brick extends StageItem {
  constructor(options = {}) {
    super(options);

    // значения по умолчанию для груза
    Object.assign(
      this,
      {
        roundRadius: 5, // радиус округления прямоугольника
      },
      options,
    );
  } // constructor

  draw() {
    let ctx = this.canvas.getContext("2d");

    // рисует элемент
    ctx.save();

    CanvasUtils.applyShadow(ctx);

    CanvasUtils.roundRect(
      ctx,
      this.x,
      this.y,
      this.width,
      this.height,
      this.roundRadius,
      this.lineWidth,
      this.props.linearGradient(ctx),
    );

    ctx.restore();

    // рисует текст и крюк
    ctx.save();

    this.props.drawHook(ctx);

    CanvasUtils.drawCenterText(
      ctx,
      this.props.getItemFont(),
      this.itemText,
      this.x + this.width / 2,
      this.y + this.height / 2,
    );

    ctx.restore();
  } // draw
}

/**
 * Нарисованный на холсте объект шарика
 */
export class Ball extends StageItem {
  constructor(options = {}) {
    super(options);

    // значения по умолчанию для шарика
    Object.assign(this, options);
  } // constructor

  draw() {
    let ctx = this.canvas.getContext("2d");

    ctx.save();

    // фон
    ctx.beginPath();

    CanvasUtils.applyShadow(ctx);

    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      this.height / 2,
      0,
      0,
      2 * Math.PI,
    );

    ctx.fillStyle = this.fill;

    ctx.closePath();

    ctx.fill();

    ctx.restore();

    ctx.save();

    // обводка
    ctx.beginPath();

    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      0,
      2 * Math.PI,
      false,
    );

    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";

    ctx.stroke();

    // крюк
    this.props.drawHook(ctx);

    CanvasUtils.drawCenterText(
      ctx,
      this.props.getItemFont(),
      this.itemText,
      this.x + this.width / 2,
      this.y + this.height / 2,
    );

    ctx.restore();
  } // draw
}

/**
 * Нарисованный на холсте объект крюка
 */
export class Hook {
  constructor(options = {}) {
    /**
     * значения по умолчанию для крюка
     */
    Object.assign(
      this,
      {
        x: 0, // верхний центр начальная координата X крюка
        y: 0, // верхний центр начальная координата Y крюка
        size: 40, // ширина и высота крюка в пикселях
        lineWidth: 2, // ширина обводки крюка
        canvas: undefined,
        angle: 0, // угол вращения относительно верхнего центра точки
        strokeColor: "black",
      },
      options,
    );
  } // constructor

  /**
   * рисует крюк
   */
  draw() {
    let ctx = this.canvas.getContext("2d");

    ctx.save();

    CanvasUtils.rotateCanvas(ctx, this.x, this.y, this.angle);

    ctx.lineWidth = this.lineWidth;

    ctx.beginPath();

    let hLine = this.size / 6;
    let hookR = this.size / 2;

    ctx.strokeStyle = this.strokeColor;

    // рисует верхнюю линию
    ctx.moveTo(this.x, this.y);

    ctx.lineTo(this.x, this.y + this.size - 2 * (hookR - hLine));

    ctx.stroke();

    // рисует половину окружности
    ctx.beginPath();

    ctx.arc(
      this.x,
      this.y + hLine + hookR,
      hookR - hLine,
      Application.degrToRad(270),
      Application.degrToRad(180),
    );

    ctx.stroke();

    ctx.restore();
  } // draw
}
