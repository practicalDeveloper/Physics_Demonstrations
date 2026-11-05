import { Application, CanvasUtils } from "../appMethods.js";
import { Brick } from "../Tools/stageElements.js";
import { Dynamometer } from "../Tools/dynamometer.js";

/**
 * Методы, связанные с темой 'Сложение сил, направленных под углом друг к другу'
 */
export class ForcesByAngleDemo {
  constructor() {
    this.dynamometers = undefined;
    this.canvas = undefined;
    this.ctx = undefined;
    this.dragRendering = undefined;
    this.dataContext = undefined;

    this.constants = Object.freeze({
      xBrickName: "xBrick",
      yBrickName: "yBrick",
      zBrickName: "zBrick",
      dynamometer: { radius: 120 },
      rope: {
        baseLength: 250,
        angleOffset: 45,
        hangYFactor: 3,
        lineWidth: 1,
        triangleWidth: 5,
      },
      box: { width: 250, height: 80, displacement: 30, radius: 5, stroke: 2 },
      cargo: { size: 40, displacement: 10, lineWidth: 2 },
      dropArea: { size: 100 },
      layout: { baseWidth: 960, baseHeight: 800 },
    });


    this.settings = {
      boxHeight: 80, // высота коробки с грузами
      boxWidth: 250, // ширина коробки с грузами
      boxRadius: 5,
      boxStroke: 2,
      boxCoord: { x: 0, y: 0 }, // координаты коробки с грузами

      cargoSize: 40,
      cargoSizeWithHook: 0,
      upperHookHeight: 0,

      xCargoCoord: { x: 0, y: 0 },
      yCargoCoord: { x: 0, y: 0 },
      zCargoCoord: { x: 0, y: 0 },

      dynamRadius: 120,

      leftDynamCoord: { x: 0, y: 0 },
      rightDynamCoord: { x: 0, y: 0 },
      hangCoord: { x: 0, y: 0 },

      curveLength: 250, // длина веревки для подвеса грузов
      ropeLineWidth: 1,
      triangleLineWidth: 5,
      dropAreaSize: 100, // размер области, где можно бросить движущийся груз
    };

    this.vars = {
      suspendedCount: 0, // количество подвешенных грузов
      startedDragCoord: { x: 0, y: 0 },
      totalWeight: 0, // подвешенный вес на веревке
    };
  }

  /**
   * Применяет масштаб к динамометрам, веревкам, точке подвеса, грузам и коробке
   */
  resizeForces() {
    CanvasUtils.applyScale(this);
    let cst = this.constants;
    this.resizeDynamometers(cst);
    this.resizeRope(cst);
    this.resizeHangCoord(cst);
    this.resizeBox(cst);
    this.resizeCargos(cst);
    this.resizeDropArea(cst);
  }

  resizeDynamometers(cst) {
    this.settings.dynamRadius = cst.dynamometer.radius * this.stageScale;
    this.resizeDynamometer(this.dynamometers.dynamLeft, cst);
    this.resizeDynamometer(this.dynamometers.dynamRight, cst);
  }

  resizeDynamometer(dynamometer, cst) {
    dynamometer.radius = cst.dynamometer.radius * this.stageScale;
  }

  resizeRope(cst) {
    this.settings.ropeLineWidth = cst.rope.lineWidth * this.stageScale;
    this.settings.triangleLineWidth = cst.rope.triangleWidth * this.stageScale;

    const angle = this.dataContext.topicVariables.angle;
    const baseLength = Application.isNumber(angle)
      ? cst.rope.baseLength + (angle - cst.rope.angleOffset)
      : cst.rope.baseLength;

    this.settings.curveLength = baseLength * this.stageScale;
  }

  resizeHangCoord(cst) {
    this.settings.hangCoord.x = this.canvas.clientWidth / 2;
    this.settings.hangCoord.y = cst.rope.hangYFactor * this.settings.dynamRadius;
  }

  resizeBox(cst) {
    this.settings.boxWidth = cst.box.width * this.stageScale;
    this.settings.boxHeight = cst.box.height * this.stageScale;
    this.settings.boxRadius = Math.max(1, cst.box.radius * this.stageScale);
    this.settings.boxStroke = Math.max(1, cst.box.stroke * this.stageScale);

    const displacement = cst.box.displacement * this.stageScale;
    this.settings.boxCoord.x = displacement;
    this.settings.boxCoord.y = this.canvas.clientHeight - displacement - this.settings.boxHeight;
  }

  resizeCargos(cst) {
    this.settings.cargoSize = cst.cargo.size * this.stageScale;

    const boxDisplacement = cst.box.displacement * this.stageScale;
    const cargoDisplacement = cst.cargo.displacement * this.stageScale;
    const xCoord = boxDisplacement + 2 * cargoDisplacement;
    const yCoord = this.settings.boxCoord.y + cargoDisplacement;

    this.settings.xCargoCoord.x = xCoord;
    this.settings.xCargoCoord.y = yCoord;
    this.settings.yCargoCoord.x = xCoord + this.settings.cargoSize + 4 * cargoDisplacement;
    this.settings.yCargoCoord.y = yCoord;
    this.settings.zCargoCoord.x = this.settings.yCargoCoord.x + this.settings.cargoSize + 4 * cargoDisplacement;
    this.settings.zCargoCoord.y = yCoord;

    this.resizeCargo(
      this.constants.xBrickName,
      this.settings.xCargoCoord,
      cst,
    );
    this.resizeCargo(
      this.constants.yBrickName,
      this.settings.yCargoCoord,
      cst,
    );
    this.resizeCargo(
      this.constants.zBrickName,
      this.settings.zCargoCoord,
      cst,
    );

    if (this.dragRendering.dragElements.length > 0) {
      this.settings.cargoSizeWithHook = this.dragRendering.dragElements[0].elem.geItemHeight();
      this.settings.upperHookHeight = this.dragRendering.dragElements[0].elem.getUpperHookSize();
    }
  }

  resizeCargo(id, coord, cst) {
    const found = this.dragRendering.findElem(id);
    if (found == undefined) {
      return;
    }

    found.elem.width = this.settings.cargoSize;
    found.elem.height = this.settings.cargoSize;
    found.elem.lineWidth = Math.max(1, cst.cargo.lineWidth * this.stageScale);
    found.elem.x = coord.x;
    found.elem.y = coord.y;
  }

  resizeDropArea(cst) {
    this.settings.dropAreaSize = cst.dropArea.size * this.stageScale;
  }

  /**
   * Инициализация
   */
  init() {
    this.vars.suspendedCount = 0;

    CanvasUtils.setBaseSize(
      this,
      this.constants.layout.baseWidth,
      this.constants.layout.baseHeight,
    );

    this.dragRendering.layered = true;

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
   * Начальное размещение элементов холста
   */
  initRender() {
    // левый динамометр
    let dynamLeft = new Dynamometer({
      centerX: 0,
      centerY: 0,
      radius: this.settings.dynamRadius,
      ringColor: "green",
      innerRingColor: "#ffcc00",
      canvas: this.canvas,
    });

    // правый динамометр
    let dynamRight = new Dynamometer({
      centerX: 0,
      centerY: 0,
      radius: this.settings.dynamRadius,
      ringColor: "red",
      innerRingColor: "#ffcc00",
      canvas: this.canvas,
    });

    this.dynamometers = {
      dynamLeft,
      dynamRight,
    };
    this.resizeForces();

    this.drawBox();
    this.drawRope();

    // Очищает перетаскиваемые элементы для холста
    this.dragRendering.dragElements = [];

    // Создает грузы на холсте overlay
    const overlay = this.dragRendering.overlayCanvas || this.canvas;

    const bricks = [
      {
        id: this.constants.xBrickName,
        elem: new Brick({
          x: this.settings.xCargoCoord.x,
          y: this.settings.xCargoCoord.y,
          width: this.settings.cargoSize,
          height: this.settings.cargoSize,
          canvas: overlay,
          itemText: "X",
        }),
      },

      {
        id: this.constants.yBrickName,
        elem: new Brick({
          x: this.settings.yCargoCoord.x,
          y: this.settings.yCargoCoord.y,
          width: this.settings.cargoSize,
          height: this.settings.cargoSize,
          canvas: overlay,
          itemText: "Y",
        }),
      },

      {
        id: this.constants.zBrickName,
        elem: new Brick({
          x: this.settings.zCargoCoord.x,
          y: this.settings.zCargoCoord.y,
          width: this.settings.cargoSize,
          height: this.settings.cargoSize,
          canvas: overlay,
          itemText: "Z",
        }),
      },
    ];

    // Добавляет грузы на холст
    this.dragRendering.addElements(bricks);
    this.settings.cargoSizeWithHook = this.dragRendering.dragElements[0].elem.geItemHeight();
    this.settings.upperHookHeight = this.dragRendering.dragElements[0].elem.getUpperHookSize();

    // Рисует динамометры
    dynamLeft.draw();
    dynamRight.draw();
    dynamRight.setStaticValue(0);
    dynamLeft.setStaticValue(0);

    return this.dynamometers;
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
   * Рисование веревки для подвеса грузов
   */
  drawRope() {
    if (
      this.dynamometers != undefined &&
      Application.isNumber(this.dataContext.topicVariables.angle)
    ) {
      this.ctx.beginPath();

      let x1 = this.settings.hangCoord.x;
      let y1 = this.settings.hangCoord.y;
      let r = this.settings.curveLength;

      let angle = this.dataContext.topicVariables.angle / 2 + 270;

      let angle2 = 270 - this.dataContext.topicVariables.angle / 2;

      let oppositeSideHeight = Math.cos(
        Application.degrToRad(this.dataContext.topicVariables.angle / 2)
      ) * r;

      let oppositeSideLength = Math.sqrt(
        r * r - oppositeSideHeight * oppositeSideHeight,
      );

      // Устанавливает левый динамометр.
      this.dynamometers.dynamLeft.centerX = x1 - oppositeSideLength;

      this.dynamometers.dynamLeft.centerY = y1 - oppositeSideHeight;

      // Устанавливает правый динамометр.
      this.dynamometers.dynamRight.centerX = x1 + oppositeSideLength;

      this.dynamometers.dynamRight.centerY = y1 - oppositeSideHeight;

      // Вращает динамометры.
      this.dynamometers.dynamRight.angle = this.dataContext.topicVariables.angle / 2;

      this.dynamometers.dynamLeft.angle = 360 - this.dataContext.topicVariables.angle / 2;

      this.ctx.moveTo(x1, y1);

      this.ctx.lineTo(
        x1 + r * Math.cos(Application.degrToRad(angle)),
        y1 + r * Math.sin(Application.degrToRad(angle)),
      );

      this.ctx.moveTo(x1, y1);

      this.ctx.lineTo(
        x1 + r * Math.cos(Application.degrToRad(angle2)),
        y1 + r * Math.sin(Application.degrToRad(angle2)),
      );

      this.ctx.lineWidth = this.settings.ropeLineWidth;
      this.ctx.stroke();

      // Маленький треугольник.
      this.ctx.save();
      this.ctx.beginPath();

      let shortSideLength = oppositeSideLength / 4;
      let sideLength = oppositeSideLength - shortSideLength;

      let shortSideHeight = sideLength / Math.tan(Application.degrToRad(this.dataContext.topicVariables.angle / 2));

      let smallTriangleY = y1 - oppositeSideHeight + shortSideHeight;

      let smallTriangleXLeft = x1 - oppositeSideLength + sideLength;

      let smallTriangleXRight = x1 + oppositeSideLength - sideLength;

      this.ctx.moveTo(x1 - oppositeSideLength, y1 - oppositeSideHeight);

      this.ctx.lineTo(smallTriangleXLeft, smallTriangleY);

      this.ctx.moveTo(x1 + oppositeSideLength, y1 - oppositeSideHeight);

      this.ctx.lineTo(smallTriangleXRight, smallTriangleY);

      this.ctx.lineWidth = this.settings.triangleLineWidth;
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  /**
   * Перерисовка во время перетаскивания грузов
   */
  refreshDrawDrag() {
    this.drawRope();
    this.drawBox();

    // сохраняет и восстанавливает значения динамометров
    let oldValueLeft = this.dynamometers.dynamLeft.value;

    let oldValueRight = this.dynamometers.dynamRight.value;

    this.dynamometers.dynamLeft.draw();
    this.dynamometers.dynamRight.draw();

    this.dynamometers.dynamLeft.setStaticValue(oldValueLeft);
    this.dynamometers.dynamRight.setStaticValue(oldValueRight);
  }

  /**
   * Функция, которая вызывается при начале перетаскивания
   */
  startedDrawDrag(dragElem) {
    let el = this.dragRendering.findElem(dragElem.id).elem;

    this.vars.startedDragCoord.x = el.x;
    this.vars.startedDragCoord.y = el.y;
  }

  /**
   * Получает координаты, где можно бросить перетскиваемый груз
   */
  getDropPosition() {
    let x = this.settings.hangCoord.x;

    let y =
      this.settings.hangCoord.y +
      this.settings.upperHookHeight +
      this.vars.suspendedCount * this.settings.cargoSizeWithHook;

    return { x: x, y: y };
  }

  /**
   * Функция, которая вызывается при остановке перетаскивания
   */
  stoppedDrawDrag(dropElem) {
    let el = this.dragRendering.findElem(dropElem.id).elem;

    let setPos = (x, y) => {
      el.x = x;
      el.y = y;
    };

    let xDrop = this.getDropPosition().x;
    let yDrop = this.getDropPosition().y;

    // если груз находится в пределах области бросания
    if (
      dropElem.elem.x > xDrop - this.settings.dropAreaSize &&
      dropElem.elem.x < xDrop + this.settings.dropAreaSize &&
      dropElem.elem.y > yDrop - this.settings.dropAreaSize &&
      dropElem.elem.y < yDrop + this.settings.dropAreaSize
    ) {
      setPos(xDrop - this.settings.cargoSize / 2, yDrop);

      // если элемент был взят из коробки
      if (
        el.x != this.vars.startedDragCoord.x &&
        el.y != this.vars.startedDragCoord.y
      ) {
        this.vars.suspendedCount++;

        this.dragRendering.redraw();

        this.vars.totalWeight += Number(el.weight);
      }
      // если элемент был взят с веревки
      else {
        this.vars.totalWeight -= Number(el.weight);

        this.vars.suspendedCount--;

        setPos(xDrop - this.settings.cargoSize / 2, yDrop);

        this.dragRendering.redraw();

        this.vars.suspendedCount++;

        this.vars.totalWeight += Number(el.weight);
      }
    }

    // возвращает элемент в коробку
    else {
      switch (dropElem.id) {
        case this.constants.xBrickName:
          setPos(this.settings.xCargoCoord.x, this.settings.xCargoCoord.y);
          break;
        case this.constants.yBrickName:
          setPos(this.settings.yCargoCoord.x, this.settings.yCargoCoord.y);
          break;
        case this.constants.zBrickName:
          setPos(this.settings.zCargoCoord.x, this.settings.zCargoCoord.y);
          break;
      }

      if (
        el.x != this.vars.startedDragCoord.x &&
        el.y != this.vars.startedDragCoord.y
      ) {
        this.vars.suspendedCount--;
        this.vars.totalWeight -= Number(el.weight);
      }
      this.dragRendering.redraw();
    }

    this.setDynamValues();
  }

  /**
   * Устанавливает флаг перетаскивания для грузов
   */
  setDraggingFlags() {
    // все грузы можно перетаскивать
    if (this.vars.suspendedCount == 0 || this.vars.suspendedCount == 1) {
      this.dragRendering.dragElements.forEach((element) => {
        element.isDraggable = true;
      });
    } else if (this.vars.suspendedCount > 1) {
      this.dragRendering.dragElements.forEach((element) => {
        element.isDraggable = false;
      });

      let setDragging = function (element, id, x) {
        if (element.id === id) {
          if (element.elem.x == x) {
            element.isDraggable = true;
          } else {
            element.isDraggable = false;
          }
        }
      };

      // только грузы в коробке можно перетаскивать
      this.dragRendering.dragElements.forEach((element) => {
        setDragging(
          element,
          this.constants.xBrickName,
          this.settings.xCargoCoord.x,
        );

        setDragging(
          element,
          this.constants.yBrickName,
          this.settings.yCargoCoord.x,
        );

        setDragging(
          element,
          this.constants.zBrickName,
          this.settings.zCargoCoord.x,
        );
      });

      // только последний груз на веревке можно перетаскивать
      const lastY =
        this.settings.hangCoord.y +
        this.settings.upperHookHeight +
        (this.vars.suspendedCount - 1) * this.settings.cargoSizeWithHook;

      this.dragRendering.dragElements.forEach((element) => {
        if (Math.abs(element.elem.y - lastY) < 1) {
          element.isDraggable = true;
        }
      });
    }
  }

  /**
   * Функция, которая вызывается при изменении данных в iframe
   */
  receivedMessage() {
    if (this.dynamometers != undefined) {
      this.resizeForces();

      // устанавливает вес грузов
      this.dragRendering.findElem(this.constants.xBrickName).elem.weight 
        = this.dataContext.topicVariables.xWeight;

      this.dragRendering.findElem(this.constants.yBrickName).elem.weight 
        = this.dataContext.topicVariables.yWeight;

      this.dragRendering.findElem(this.constants.zBrickName).elem.weight 
        = this.dataContext.topicVariables.zWeight;

      this.dynamometers.dynamLeft.maxValue 
        = this.dataContext.topicVariables.maxValue;

      this.dynamometers.dynamRight.maxValue 
        = this.dataContext.topicVariables.maxValue;

      this.clear();

      this.dragRendering.redrawAll();
    }
  }

  /**
   * Сбрасывает все значения и переменные
   */
  clear() {
    this.vars.suspendedCount = 0;
    this.vars.totalWeight = 0;

    if (this.dragRendering.dragElements.length > 0) {
      this.dragRendering.dragElements.forEach((element) => {
        element.isDraggable = true;
      });

      let setPos = (el, x, y) => {
        el.x = x;
        el.y = y;
      };

      setPos(
        this.dragRendering.findElem(this.constants.xBrickName).elem,
        this.settings.xCargoCoord.x,
        this.settings.xCargoCoord.y,
      );

      setPos(
        this.dragRendering.findElem(this.constants.yBrickName).elem,
        this.settings.yCargoCoord.x,
        this.settings.yCargoCoord.y,
      );

      setPos(
        this.dragRendering.findElem(this.constants.zBrickName).elem,
        this.settings.zCargoCoord.x,
        this.settings.zCargoCoord.y,
      );
    }

    if (this.dynamometers != undefined) {
      this.dynamometers.dynamLeft.setStaticValue(0);
      this.dynamometers.dynamRight.setStaticValue(0);
    }

    this.passFrameValue();
  }

  /**
   * Передает силу в iframe
   */
  passFrameValue() {
    let pass_data = {
      force: Application.roundTwoDigits(this.getForce()),
    };

    Application.sendFrameMessage(pass_data);
  }

  /**
   * Очищает все переменные
   */
  reset() {
    if (this.dynamometers !== undefined) {
        this.dynamometers.dynamLeft.stopAnimation();
        this.dynamometers.dynamRight.stopAnimation();
    }
    this.clear();
    this.dragRendering.layered = false;
    this.dynamometers = undefined;
  }

  /**
   * Устанавливает значения динамометров
   */
  setDynamValues() {
    this.dynamometers.dynamLeft.setValue(this.getForce()).then(() => {
      this.setDraggingFlags();
      this.passFrameValue();
    });

    this.dynamometers.dynamRight.setValue(this.getForce()).then(() => {
      this.setDraggingFlags();
      this.passFrameValue();
    });
  }

  /**
   * Рассчитывает силу, приложенную по углу и результирующую силу
   */
  getForce() {
    if (this.dataContext.topicVariables != undefined) {
      let angle = this.dataContext.topicVariables.angle;

      let force = this.vars.totalWeight / (2 * Math.cos(Application.degrToRad(angle / 2)));

      return Application.kgToNewton(force);
    }
  }
}
