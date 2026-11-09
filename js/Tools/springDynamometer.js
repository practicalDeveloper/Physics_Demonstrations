import { Application, CanvasUtils } from "../appMethods.js";
import { Spring } from "../Tools/spring.js";
import { Ruler } from "../Tools/ruler.js";
import { Hook } from "../Tools/stageElements.js";

/**
 * Нарисованный на холсте пружинный динамометр
 */
export class SpringDynamometer {
  #animationFrame = null; // фрейм для анимации
  #running = false;

  #spring;
  #ruler;
  #hook;

  constructor(options = {}) {
    // значения по умолчанию для пружинного динамометра
    Object.assign(
      this,
      {
        canvas: undefined, // холст, на котором рисуется динамометр
        startX: 0, // левая верхняя начальная координата X
        startY: 0, // левая верхняя начальная координата Y
        length: 200, // длина пружинного динамометра
        height: 50, // высота пружинного динамометра
        maxValue: 10, // максимальное возможное значение
        backColor: "orange", // цвет фона
        strokeColor: "black", // цвет обводки
        angle: 0, // угол вращения
        animatedHolder: false, // флаг, указывающий, что держатель и крюк анимированы
        value: 0, // текущее значение
        animationStep: undefined, // скорость анимации
      },
      options,
    );

    // функция, которая вызывается при изменении значения
    this.valueOnChange = function (value) {};

    this.#init();
  } // constructor

  /**
   * Различные метрики пружинного динамометра
   */
  #getMeasures() {
    let initialSpringL = this.length / 5;

    let swingWidth = initialSpringL / 30;

    let rulerL = this.length - initialSpringL - swingWidth;

    let animationStep =
      this.animationStep === undefined
        ? this.maxValue * 0.018
        : this.animationStep;

    let springH = this.height - this.height / 3;

    let holderL = 0;

    if (this.animatedHolder) {
      holderL = this.length - (initialSpringL + swingWidth);
    } else {
      holderL = this.length - swingWidth + this.length / 20;
    }

    let valueLength = this.value > this.maxValue ? this.maxValue : this.value;

    let springValueL = initialSpringL + valueLength * (rulerL / this.maxValue);

    let holderValueL = holderL - springValueL;

    let initialLeftX =
      this.startX - springH * Math.sin(Application.degrToRad(this.angle));

    let initialLeftY =
      this.startY + springH * Math.cos(Application.degrToRad(this.angle));

    let hookSize = this.height / 2.5;

    let hookX = 0;
    let hookY = 0;

    if (this.animatedHolder) {
      hookX =
        initialLeftX +
        Math.cos(Application.degrToRad(this.angle)) *
          (springValueL + swingWidth + holderL);

      hookY =
        initialLeftY +
        Math.sin(Application.degrToRad(this.angle)) *
          (springValueL + swingWidth + holderL);
    } else {
      hookX =
        initialLeftX +
        Math.cos(Application.degrToRad(this.angle)) * (swingWidth + holderL);

      hookY =
        initialLeftY +
        Math.sin(Application.degrToRad(this.angle)) * (swingWidth + holderL);
    }

    let springX =
      initialLeftX + Math.cos(Application.degrToRad(this.angle)) * swingWidth;

    let springY =
      initialLeftY + Math.sin(Application.degrToRad(this.angle)) * swingWidth;

    let l = swingWidth + initialSpringL;

    let rulerX = this.startX + l * Math.cos(Application.degrToRad(this.angle));

    let rulerY = this.startY + l * Math.sin(Application.degrToRad(this.angle));

    return {
      initialSpringL,
      swingWidth,
      rulerL,
      animationStep,
      springH,
      holderL,
      holderValueL,
      springValueL,
      initialLeftX,
      initialLeftY,
      hookX,
      hookY,
      hookSize,
      springX,
      springY,
      rulerX,
      rulerY,
    };
  } // #getMeasures

  /**
   * Инициализация
   */
  #init() {
    let measures = this.#getMeasures();

    let swingsN = measures.initialSpringL / measures.swingWidth;

    this.#spring = new Spring({
      radius: this.height / 4,
      swings: swingsN,
      swingWidth: Math.max(1, this.height / 20),
    });

    this.#ruler = new Ruler({
      showBackground: false,
      showBottom: false,
    });

    this.#applyRulerStyle();

    this.#hook = new Hook();
  } // #init

  /**
   * Перестраивает внутреннюю пружину, линейку и крюк после изменения размера или длины
   */
  updateGeometry() {
    this.#init();
  }

  /**
   * Применяет стиль линейки
   */
  #applyRulerStyle() {
    this.#ruler.showMinorLines = this.showMinorLines;

    this.#ruler.showOddMarks = this.showOddMarks;

    this.#ruler.maxValue = this.maxValue;
  } // #applyRulerStyle

  /**
   * Получает общую высоту динамометра с держателем и крюком
   */
  getTotalLength() {
    let measures = this.#getMeasures();

    return (
      measures.springValueL +
      measures.swingWidth +
      measures.holderL +
      measures.hookSize
    );
  } // getTotalLength

  /**
   * Получает координаты конца крюка на держателе
   */
  getFinishCoord() {
    let measures = this.#getMeasures();

    let x =
      measures.hookX +
      Math.cos(Application.degrToRad(this.angle)) * measures.hookSize;

    let y =
      measures.hookY +
      Math.sin(Application.degrToRad(this.angle)) * measures.hookSize;

    return {
      x,
      y,
    };
  } // getFinishCoord

  /**
   * Рисует весь пружинный динамометр
   */
  draw() {
    let ctx = this.canvas.getContext("2d");

    let measures = this.#getMeasures();

    ctx.save();

    CanvasUtils.rotateCanvas(ctx, this.startX, this.startY, this.angle);

    // фон
    ctx.beginPath();

    ctx.strokeStyle = this.strokeColor;

    ctx.fillStyle = this.backColor;

    ctx.fillRect(this.startX, this.startY, this.length, this.height);

    ctx.rect(this.startX, this.startY, this.length, this.height);

    ctx.stroke();

    // линия держателя груза
    ctx.beginPath();

    let lineY = this.startY + measures.springH;

    let lineX = this.startX + measures.springValueL + measures.swingWidth;

    let endLineX = this.animatedHolder
      ? lineX + measures.holderL
      : lineX + measures.holderValueL;

    ctx.moveTo(lineX, lineY);

    ctx.lineTo(endLineX, lineY);

    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.restore();

    // инициализация крюка
    this.#hook.x = measures.hookX;

    this.#hook.y = measures.hookY;

    this.#hook.size = measures.hookSize;

    this.#hook.canvas = this.canvas;

    this.#hook.angle = this.angle - 90;

    this.#hook.strokeColor = this.strokeColor;

    // инициализация пружины
    this.#spring.startX = measures.springX;

    this.#spring.startY = measures.springY;

    this.#spring.canvas = this.canvas;

    this.#spring.length = measures.springValueL;

    this.#spring.angle = this.angle;

    this.#spring.swingWidth = measures.swingWidth;

    // инициализация линейки
    this.#ruler.startX = measures.rulerX;

    this.#ruler.startY = measures.rulerY;

    this.#ruler.canvas = this.canvas;

    this.#ruler.length = measures.rulerL;

    this.#ruler.height = this.height;

    this.#ruler.angle = this.angle;

    this.#ruler.strokeColor = this.strokeColor;

    this.#applyRulerStyle();

    this.#spring.length = measures.springValueL;

    this.#ruler.draw();
    this.#spring.draw();
    this.#hook.draw();
  } // draw

  /**
   * Устанавливает значение пружины без анимации
   */
  setStaticValue(valuePointer = 0) {
    this.value = valuePointer;

    this.valueOnChange(valuePointer);

    this.draw();
  } // setStaticValue

  /**
   * Устанавливает значение пружины с анимацией
   */
  async setValue(valuePointer = 0) {
    if (valuePointer < 0) {
      return;
    }

    this.stopAnimation();
    this.#running = true;

    const moveSpeed = this.#getMeasures().animationStep;

    let currentValue = this.value;

    const maxValue =
      valuePointer <= this.maxValue ? valuePointer : this.maxValue;

    const startValue = currentValue;

    // Общая дистанция движения
    const maxDistance = Math.abs(maxValue - startValue);

    // Минимальная скорость вблизи цели
    const MIN_SPEED_FACTOR = 0.25;

    let previousTime = null;

    return new Promise((resolve) => {
      const tick = (currentTime) => {
        if (!this.#running) {
          return;
        }

        const elapsed = Application.getDeltaTime(previousTime, currentTime);

        previousTime = elapsed.previousTime;

        const deltaTime = elapsed.deltaTime;

        const distance = Math.abs(maxValue - currentValue);

        // 1.0 в начале движения
        // 0.0 непосредственно перед целью
        const normalizedDistance =
          maxDistance === 0 ? 0 : distance / maxDistance;

        // Скорость( далеко  100%, близко минимальная 25%)
        const speedFactor =
          MIN_SPEED_FACTOR + (1 - MIN_SPEED_FACTOR) * normalizedDistance;

        const step =
          Application.getAnimationStep(moveSpeed, deltaTime) * speedFactor;

        if (currentValue < maxValue) {
          currentValue += step;

          if (currentValue >= maxValue) {
            currentValue = maxValue;
          }
        } else if (currentValue > maxValue) {
          currentValue -= step;

          if (currentValue <= maxValue) {
            currentValue = maxValue;
          }
        }

        this.value = currentValue;

        // Сначала перерисовывается сцена
        this.valueOnChange(currentValue);

        // Затем перерисовывается динамометр поверх него
        this.draw();

        if (currentValue === maxValue) {
          this.#running = false;
          this.#animationFrame = null;
          resolve();
          return;
        }

        this.#animationFrame = requestAnimationFrame(tick);
      };

      this.#animationFrame = requestAnimationFrame(tick);
    });
  } // setValue

  /**
   * Останавливает анимацию
   */
  stopAnimation() {
    this.#running = false;

    if (this.#animationFrame !== null) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }
  } // stopAnimation
} // SpringDynamometer
