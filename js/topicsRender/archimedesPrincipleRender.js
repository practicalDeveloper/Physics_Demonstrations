import { Application, CanvasUtils } from "../appMethods.js";
import { SpringDynamometer } from "../Tools/springDynamometer.js";
import { Brick } from "../Tools/stageElements.js";

/**
 * Методы, связанные с темой 'Закон Архимеда'
 */
export class ArchimedesPrincipleDemo {
  constructor() {
    this.dynamometer = undefined;
    this.canvas = undefined;
    this.ctx = undefined;
    this.cancelTimer = false;
    this.dragRendering = undefined;
    this.dataContext = undefined;
    this.animationFrame = null;

    this.constants = Object.freeze({
      brickName: "brick",
      dynamometer: { startX: 150, startY: 10, height: 60, length: 400 },
      box: { width: 120, height: 80, displacement: 30, radius: 5, stroke: 2 },
      cargo: {
        minSize: 40,
        displacement: 10,
        lineWidth: 2,
        weightSizeFactor: 0.2,
      },
      liquid: { width: 200, height: 160, radius: 5, stroke: 2 },
      dropArea: { size: 100 },
      animation: { moveSpeed: 3, decelerationDistance: 50 },
      layout: { baseWidth: 960, baseHeight: 800 },
    });

    this.settings = {
      boxCoord: { x: 0, y: 0 }, // координаты коробки с грузами
      boxWidth: 120,
      boxHeight: 80,
      boxRadius: 5,
      boxStroke: 2,
      bigLiquidBoxCoord: { x: 0, y: 0 }, // координаты большой коробки с жидкостью.
      bigLiquidBoxH: 160, // высота большой коробки с жидкостью
      liquidWidth: 200,
      liquidRadius: 5,
      liquidStroke: 2,
      liquidLevelH: 16, // высота уровня жидкости
      smallLiquidBoxH: 0, // высота маленькой коробки с жидкостью
      cargoSize: 40,
      dynamCoord: { x: 150, y: 10 },
      dynamWidth: 60,
      dynamLength: 400,
      cargoSizeWithHook: 0,
      upperHookHeight: 0,
      cargoCoord: { x: 0, y: 0 },
      dropPosition: { x: 0, y: 0 }, // координаты, где можно бросить перетаскиваемый груз
      dropAreaSize: 100,
      moveSpeed: 3,
      decelerationDistance: 50,
    };
  }

  /**
   * Применяет масштаб к динамометру, грузу, коробке и жидкости
   */
  resizeArchimedes() {
    CanvasUtils.applyScale(this);
    let cst = this.constants;
    this.resizeSpringDynamometer(cst);
    this.resizeBox(cst);
    this.resizeLiquid(cst);
    this.resizeCargo(cst);
    this.resizeDropArea(cst);
    this.resizeAnimation(cst);
  }

  resizeSpringDynamometer(cst) {
    this.settings.dynamCoord.x = cst.dynamometer.startX * this.stageScale;
    this.settings.dynamCoord.y = cst.dynamometer.startY * this.stageScale;
    this.settings.dynamWidth = cst.dynamometer.height * this.stageScale;
    this.settings.dynamLength = cst.dynamometer.length * this.stageScale;

    const dynam = this.dynamometers && this.dynamometers.springDynamometer;
    if (dynam === undefined) {
      return;
    }

    dynam.startX = this.settings.dynamCoord.x;
    dynam.startY = this.settings.dynamCoord.y;
    dynam.height = this.settings.dynamWidth;
    dynam.length = this.settings.dynamLength;
    dynam.updateGeometry();
  }

  resizeBox(cst) {
    this.settings.boxWidth = cst.box.width * this.stageScale;
    this.settings.boxHeight = cst.box.height * this.stageScale;
    this.settings.boxRadius = Math.max(1, cst.box.radius * this.stageScale);
    this.settings.boxStroke = Math.max(1, cst.box.stroke * this.stageScale);

    const displacement = cst.box.displacement * this.stageScale;
    this.settings.boxCoord.x =
      this.canvas.clientWidth - this.settings.boxWidth - displacement;
    this.settings.boxCoord.y =
      this.canvas.clientHeight - displacement - this.settings.boxHeight;
  }

  resizeLiquid(cst) {
    this.settings.liquidWidth = cst.liquid.width * this.stageScale;
    this.settings.bigLiquidBoxH = cst.liquid.height * this.stageScale;
    this.settings.liquidLevelH = this.settings.bigLiquidBoxH / 10;
    this.settings.liquidRadius = Math.max(
      1,
      cst.liquid.radius * this.stageScale,
    );
    this.settings.liquidStroke = Math.max(
      1,
      cst.liquid.stroke * this.stageScale,
    );

    const displacement = cst.box.displacement * this.stageScale;
    this.settings.bigLiquidBoxCoord.x = displacement;
    this.settings.bigLiquidBoxCoord.y =
      this.canvas.clientHeight - displacement - this.settings.bigLiquidBoxH;
  }

  resizeCargo(cst) {
    const weight = this.dataContext.topicVariables.weight;
    const baseSize = Application.isNumber(weight)
      ? weight * cst.cargo.weightSizeFactor + cst.cargo.minSize
      : cst.cargo.minSize;

    this.settings.cargoSize = baseSize * this.stageScale;

    const boxDisplacement = cst.box.displacement * this.stageScale;
    const cargoDisplacement = cst.cargo.displacement * this.stageScale;
    this.settings.cargoCoord.x =
      this.settings.boxCoord.x + boxDisplacement + 2 * cargoDisplacement;
    this.settings.cargoCoord.y = this.settings.boxCoord.y + cargoDisplacement;

    const found = this.dragRendering.findElem(cst.brickName);
    if (found == undefined) {
      return;
    }

    found.elem.width = this.settings.cargoSize;
    found.elem.height = this.settings.cargoSize;
    found.elem.lineWidth = Math.max(1, cst.cargo.lineWidth * this.stageScale);
    found.elem.x = this.settings.cargoCoord.x;
    found.elem.y = this.settings.cargoCoord.y;
  }

  resizeDropArea(cst) {
    this.settings.dropAreaSize = cst.dropArea.size * this.stageScale;
  }

  resizeAnimation(cst) {
    this.settings.moveSpeed = Math.max(
      1,
      cst.animation.moveSpeed * this.stageScale,
    );
    this.settings.decelerationDistance = Math.max(
      8,
      cst.animation.decelerationDistance * this.stageScale,
    );
  }

  passFrameValue(volume, buyonantForce, gravity) {
    let pass_data = {
      volume: volume,
      buyonantForce: buyonantForce,
      gravity: gravity,
    };

    Application.sendFrameMessage(pass_data);
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
    this.dynamometers = this.initRender();

    this.dragRendering.refresh = () => {
      this.refreshDrawDrag();
    };
    this.dragRendering.stoppedDragging = (elem) => {
      this.stoppedDrawDrag(elem);
    };
    this.dragRendering.startedDragging = (elem) => {
      this.startedDrawDrag(elem);
    };
  }

  /**
   * Перерисовка во время перетаскивания грузов
   */
  refreshDrawDrag() {
    this.drawBox();
    this.drawLiquidBoxBig();
    this.dynamometers.springDynamometer.draw();
  }

  /**
   * Функция, которая вызывается при начале перетаскивания
   */
  startedDrawDrag(dragElem) {}

  /**
   * Функция, которая вызывается при остановке перетаскивания
   */
  stoppedDrawDrag(dropElem) {
    let el = this.dragRendering.findElem(dropElem.id).elem;
    let setPos = (x, y) => {
      el.x = x;
      el.y = y;
    };

    let xEndDynam = this.getDropPosition().x;
    let yEndDynam = this.getDropPosition().y;

    // если груз находится в пределах области бросания
    if (
      dropElem.elem.x > xEndDynam - this.settings.dropAreaSize &&
      dropElem.elem.x < xEndDynam + this.settings.dropAreaSize &&
      dropElem.elem.y > yEndDynam - this.settings.dropAreaSize &&
      dropElem.elem.y < yEndDynam + this.settings.dropAreaSize
    ) {
      setPos(xEndDynam, yEndDynam);
      this.dragRendering.redraw();
      dropElem.isDraggable = false;

      // передает значения в iframe
      let weight = this.dataContext.topicVariables.weight;
      let bodyDensity = this.dataContext.topicVariables.bodyDensity;
      let liquidDensity = this.dataContext.topicVariables.liquidDensity;
      let volume = Application.roundTwoDigits(weight / bodyDensity);
      let buyonantForce = Application.roundTwoDigits(
        liquidDensity * Application.gravity * volume,
      );
      let gravityForce = this.getForce();
      this.cancelTimer = false;
      this.dynamometers.springDynamometer.setValue(gravityForce).then(() => {
        let force = gravityForce;
        if (buyonantForce > gravityForce) {
          force = 0;
        }

        if (gravityForce > buyonantForce) {
          force = gravityForce - buyonantForce;
        }

        this.animatePosition().then(() => {
          this.dynamometers.springDynamometer.setValue(force).then(() => {
            dropElem.isDraggable = true;
          });
        });
      });

      this.passFrameValue(
        volume,
        buyonantForce,
        Application.roundTwoDigits(this.getForce()),
      );
    }

    // возвращает элемент в коробку
    else {
      this.dynamometers.springDynamometer.setStaticValue(0);
      this.moveDynamometer(this.settings.dynamCoord.y);
      this.passFrameValue(0, 0, 0);
      setPos(this.settings.cargoCoord.x, this.settings.cargoCoord.y);
      this.dragRendering.redraw();
    }
  } // stoppedDrawDrag

  async animatePosition() {
    let currentPosition = this.settings.dynamCoord.y;

    const initPosition = currentPosition;

    // скорость в пикселях за кадр при 60 FPS
    const moveSpeed = this.settings.moveSpeed;

    // расстояние начала замедления
    const decelerationDistance = this.settings.decelerationDistance;

    // минимальная скорость в конце
    const minSpeedFactor = 0.2;

    const liquidLevelY =
      this.settings.bigLiquidBoxCoord.y + this.settings.liquidLevelH;

    const yEndDynam = this.getDropPosition().y;

    const oldPosition = this.dynamometers.springDynamometer.startY;

    const setCoord = oldPosition + (liquidLevelY - yEndDynam);

    let previousTime = null;

    return new Promise((resolve) => {
      const tick = (currentTime) => {
        if (this.cancelTimer === true) {
          this.animationFrame = null;
          resolve();
          return;
        }

        const elapsed = Application.getDeltaTime(previousTime, currentTime);

        previousTime = elapsed.previousTime;
        const deltaTime = elapsed.deltaTime;

        // расстояние до конечной точки
        const distance = Math.abs(setCoord - currentPosition);

        // коэффициент скорости (близок к 30 пикселов speedFactor = 1, близок к конечной точке speedFactor = 0.2)
        let speedFactor;

        if (distance >= decelerationDistance) {
          speedFactor = 1;
        } else {
          const normalizedDistance = distance / decelerationDistance;
          speedFactor =
            minSpeedFactor + (1 - minSpeedFactor) * normalizedDistance;
        }

        // учитывает реальное deltaTime.
        const step =
          Application.getAnimationStep(moveSpeed, deltaTime) * speedFactor;

        if (initPosition <= setCoord) {
          currentPosition += step;
          if (currentPosition >= setCoord) {
            currentPosition = setCoord;
          }

          this.moveDynamometer(currentPosition);
        }

        // достигнута конечная координата
        if (currentPosition >= setCoord) {
          this.moveDynamometer(setCoord);

          this.animationFrame = null;
          resolve();
          return;
        }

        // если cancelTimer true, разрешает promise
        if (this.cancelTimer === true) {
          this.animationFrame = null;
          resolve();
          return;
        }

        this.animationFrame = requestAnimationFrame(tick);
      };

      this.animationFrame = requestAnimationFrame(tick);
    });
  }

  /**
   * Перемещает динамометр в коробку с жидкостью
   */
  moveDynamometer(yPosition) {
    CanvasUtils.clearCanvas(this.canvas);
    this.drawBox();
    this.drawLiquidBoxBig();

    // перемещает динамометр
    this.dynamometers.springDynamometer.startY = yPosition;
    this.dynamometers.springDynamometer.draw();

    // перемещает груз
    this.getBrick().x = this.getDropPosition().x;
    this.getBrick().y = this.getDropPosition().y;

    this.dragRendering.drawElements();
  }

  /**
   * Рисование коробки для хранения перетаскиваемых грузов
   */
  drawBox() {
    this.ctx.save();
    CanvasUtils.roundRect(
      this.ctx,
      this.settings.boxCoord.x,
      this.settings.boxCoord.y,
      this.settings.boxWidth,
      this.settings.boxHeight,
      this.settings.boxRadius,
      this.settings.boxStroke,
      "#e4e4e4",
    );
    this.ctx.restore();
  }

  /**
   * Рисование большой коробки с жидкостью
   */
  drawLiquidBoxBig() {
    this.ctx.save();
    let strokeW = this.settings.liquidStroke;
    CanvasUtils.roundRect(
      this.ctx,
      this.settings.bigLiquidBoxCoord.x,
      this.settings.bigLiquidBoxCoord.y,
      this.settings.liquidWidth,
      this.settings.bigLiquidBoxH,
      this.settings.liquidRadius,
      strokeW,
      "lightBlue",
    );

    // скрывает верхнюю область коробки
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(
      this.settings.bigLiquidBoxCoord.x,
      this.settings.bigLiquidBoxCoord.y - strokeW,
      this.settings.liquidWidth,
      this.settings.liquidLevelH,
    );

    this.ctx.restore();
  }

  getDropPosition() {
    let x =
      this.dynamometers.springDynamometer.getFinishCoord().x -
      this.settings.cargoSize / 2;
    let y =
      this.dynamometers.springDynamometer.getFinishCoord().y +
      this.getBrick().getUpperHookSize();
    return { x, y };
  }

  /**
   * Начальное размещение элементов холста
   */
  initRender() {
    let springDynamometer = new SpringDynamometer({
      startX: this.settings.dynamCoord.x,
      startY: this.settings.dynamCoord.y,
      canvas: this.canvas,
      angle: 90,
      height: this.settings.dynamWidth,
      strokeColor: "black",
      value: 0,
    });

    this.dynamometers = { springDynamometer };
    this.resizeArchimedes();

    this.drawBox();
    this.drawLiquidBoxBig();

    // Очищает перетаскиваемые элементы для холста
    this.dragRendering.dragElements = [];

    const bricks = [
      {
        id: this.constants.brickName,
        elem: new Brick({
          x: this.settings.cargoCoord.x,
          y: this.settings.cargoCoord.y,
          height: this.settings.cargoSize,
          width: this.settings.cargoSize,
          canvas: this.canvas,
          itemText: "",
        }),
      },
    ];

    // Добавляет грузы на холст
    this.dragRendering.addElements(bricks);

    springDynamometer.draw();
    var drawBox = this.drawBox.bind(this);
    var drawLiquidBoxBig = this.drawLiquidBoxBig.bind(this);

    springDynamometer.valueOnChange = () => {
      CanvasUtils.clearCanvas(this.canvas);
      drawBox();
      drawLiquidBoxBig();
      this.dragRendering.drawElements();
    };

    return this.dynamometers;
  } // initRender

  /**
   *  Функция, которая вызывается при изменении данных в iframe
   */
  async receivedMessage() {
    // устанавливает вес грузов
    if (this.dynamometers != undefined) {
      this.resizeArchimedes();
      this.dynamometers.springDynamometer.maxValue =
        this.dataContext.topicVariables.maxValue;
      // возвращает динамометр в исходное положение
      if (
        this.dynamometers.springDynamometer.startY != this.settings.dynamCoord.y
      ) {
        this.dynamometers.springDynamometer.startY = this.settings.dynamCoord.y;
      }

      this.cancelTimer = true;
      this.dragRendering.dragElements[0].isDraggable = true;
      this.clear();
      this.dragRendering.redraw();
    }
  }

  /**
   * Рассчитывает силу (в Ньютонах) по весу
   */
  getForce() {
    if (this.dataContext.topicVariables != undefined) {
      let weight = this.dataContext.topicVariables.weight;
      return Application.kgToNewton(weight);
    }
  }

  getBrick() {
    return this.dragRendering.findElem(this.constants.brickName).elem;
  }

  // сбрасывает все значения и переменные
  clear() {
    this.getBrick().x = this.settings.cargoCoord.x;
    this.getBrick().y = this.settings.cargoCoord.y;

    if (
      this.dynamometers != undefined &&
      this.dynamometers.springDynamometer.value != 0
    ) {
      this.dynamometers.springDynamometer.stopAnimation();
      this.dynamometers.springDynamometer.setStaticValue(0);
    }

    this.passFrameValue(0, 0, 0);
  }

  // очищает все переменные
  reset() {
    this.cancelTimer = true;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (
      this.dynamometers != undefined &&
      this.dynamometers.springDynamometer != undefined
    ) {
      this.dynamometers.springDynamometer.stopAnimation();
    }
    this.dynamometers = undefined;
  }
} // archimedesPrincipleDemo
