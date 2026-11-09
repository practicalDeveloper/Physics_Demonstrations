import { Application, CanvasUtils } from "../appMethods.js";
import { Spring } from "../Tools/spring.js";
import { Ruler } from "../Tools/ruler.js";
import { Brick, Hook } from "../Tools/stageElements.js";

/**
 * Методы, связанные с темой 'Затухающие колебания'
 */
export class OscillationsDemo {
  constructor() {
    this.canvas = undefined;
    this.ctx = undefined;
    this.dataContext = undefined;
    this.dragRendering = undefined;
    this.animationFrame = null;
    this.isHanging = false;
    this.cancelOscillation = false;
    this.oscillationId = 0;
    this.oscillationResolve = null;

    this.spring = undefined;
    this.ruler = undefined;
    this.hook = undefined;

    this.constants = Object.freeze({
      brickName: "brick",
      spring: { startX: 80, startY: 30, length: 100, radius: 30, swings: 20 },
      ruler: { length: 350, maxValue: 80 },
      hook: { size: 25, lineWidth: 1.5 },
      box: { width: 120, height: 80, displacement: 30, radius: 5, stroke: 2 },
      cargo: {
        minSize: 40,
        displacement: 10,
        lineWidth: 2,
        weightSizeFactor: 4,
      },
      dropArea: { size: 100 },
      oscillation: { minLengthFactor: 0.35 },
      layout: { baseWidth: 900, baseHeight: 700 },
    });

    this.settings = {
      mass: 0,
      stiffness: 0,
      damping: 0,
      displacement: 0,
      frequency: 0,
      boxCoord: { x: 0, y: 0 },
      boxWidth: 120,
      boxHeight: 80,
      boxRadius: 5,
      boxStroke: 2,
      cargoSize: 40,
      cargoCoord: { x: 0, y: 0 },
      dropAreaSize: 100,
      restLength: 100,
    };
  }

  /**
   * Применяет масштабирование к пружине, линейке, крюку, коробке и грузу
   */
  resizeOscillations() {
    CanvasUtils.applyScale(this);
    let cst = this.constants;
    this.resizeSpring(cst);
    this.resizeRuler(cst);
    this.resizeHook(cst);
    this.resizeBox(cst);
    this.resizeDropArea(cst);
    this.resizeCargo(cst);
  }

  resizeSpring(cst) {
    if (this.spring == undefined) {
      return;
    }

    this.spring.startX = this.canvas.clientWidth / 2;
    this.spring.startY = cst.spring.startY * this.stageScale;
    this.spring.radius = cst.spring.radius * this.stageScale;
    this.spring.angle = 90;

    const minLength = cst.spring.length * this.stageScale;
    const thirdHeight = this.canvas.clientHeight / 3 - this.spring.startY;
    this.settings.restLength = Math.max(minLength, thirdHeight);

    const displacement = this.dataContext.topicVariables.displacement;
    const value = Application.isNumber(displacement) ? Number(displacement) : 0;
    const rulerLength = cst.ruler.length * this.stageScale;
    const stretch = (value / cst.ruler.maxValue) * rulerLength;

    this.spring.length = this.settings.restLength + stretch;
  }

  resizeRuler(cst) {
    if (this.ruler == undefined || this.spring == undefined) {
      return;
    }

    this.ruler.height = this.spring.radius * 2.4;
    this.spring.radius = this.ruler.height / 3;
    this.ruler.startX = this.spring.startX + this.ruler.height / 2;
    this.ruler.startY = this.spring.startY + this.settings.restLength;
    this.ruler.length = cst.ruler.length * this.stageScale;
    this.ruler.maxValue = cst.ruler.maxValue;
    this.ruler.angle = 90;
  }

  resizeHook(cst) {
    if (this.hook == undefined || this.spring == undefined) {
      return;
    }

    this.hook.x = this.spring.startX;
    this.hook.y = this.spring.startY + this.spring.length;
    this.hook.size = cst.hook.size * this.stageScale;
    this.hook.lineWidth = Math.max(1, cst.hook.lineWidth * this.stageScale);
    this.hook.angle = 0;
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

  resizeDropArea(cst) {
    this.settings.dropAreaSize = cst.dropArea.size * this.stageScale;
  }

  resizeCargo(cst) {
    const mass = this.dataContext.topicVariables.mass;
    const baseSize = Application.isNumber(mass)
      ? mass * cst.cargo.weightSizeFactor + cst.cargo.minSize
      : cst.cargo.minSize;

    this.settings.cargoSize = baseSize * this.stageScale;

    const boxDisplacement = cst.box.displacement * this.stageScale;
    const cargoDisplacement = cst.cargo.displacement * this.stageScale;
    this.settings.cargoCoord.x =
      this.settings.boxCoord.x + boxDisplacement + 2 * cargoDisplacement;
    this.settings.cargoCoord.y = this.settings.boxCoord.y + cargoDisplacement;

    const found =
      this.dragRendering && this.dragRendering.findElem(cst.brickName);
    if (found == undefined) {
      return;
    }

    found.elem.width = this.settings.cargoSize;
    found.elem.height = this.settings.cargoSize;
    found.elem.lineWidth = Math.max(1, cst.cargo.lineWidth * this.stageScale);

    if (found.isDragging) {
      return;
    }

    if (this.isHanging) {
      const pos = this.getDropPosition();
      found.elem.x = pos.x;
      found.elem.y = pos.y;
    } else {
      found.elem.x = this.settings.cargoCoord.x;
      found.elem.y = this.settings.cargoCoord.y;
    }
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

    this.isHanging = false;

    this.spring = new Spring({
      canvas: this.canvas,
      swings: this.constants.spring.swings,
    });

    this.ruler = new Ruler({
      canvas: this.canvas,
      strokeColor: "black",
      showBottom: false,
      maxValue: this.constants.ruler.maxValue,
    });

    this.hook = new Hook({
      canvas: this.canvas,
      size: this.constants.hook.size,
      lineWidth: this.constants.hook.lineWidth,
      angle: 0,
    });

    this.resizeOscillations();

    this.dragRendering.dragElements = [];
    this.dragRendering.refresh = () => {
      this.refreshDrawDrag();
    };
    this.dragRendering.stoppedDragging = (elem) => {
      this.stoppedDrawDrag(elem);
    };
    this.dragRendering.startedDragging = () => {};

    this.dragRendering.addElements([
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
    ]);

    this.refreshStage();
  }

  /**
   * Перерисовка во время перетаскивания груза
   */
  refreshDrawDrag() {
    this.ruler.draw();
    this.spring.draw();
    this.hook.draw();
    this.drawBox();
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

    let xEndHook = this.getDropPosition().x;
    let yEndHook = this.getDropPosition().y;

    if (
      dropElem.elem.x > xEndHook - this.settings.dropAreaSize &&
      dropElem.elem.x < xEndHook + this.settings.dropAreaSize &&
      dropElem.elem.y > yEndHook - this.settings.dropAreaSize &&
      dropElem.elem.y < yEndHook + this.settings.dropAreaSize
    ) {
      this.isHanging = true;
      setPos(xEndHook, yEndHook);
      this.dragRendering.redraw();
      dropElem.isDraggable = false;

      const vars = this.dataContext.topicVariables;
      const rulerMeters = this.constants.ruler.maxValue / 100;
      const scale =
        (this.constants.ruler.length * this.stageScale) / rulerMeters;

      this.animateDampedOscillation({
        startY: this.hook.y,
        mass: Number(vars.mass),
        stiffness: Number(vars.stiffness),
        damping: Number(vars.damping),
        initialDisplacement: Number(vars.displacement) / 100,
        scale: scale,
        onUpdate: (y) => this.applyOscillationY(y),
      })
        .then(() => {
          dropElem.isDraggable = true;
        })
        .catch(() => {
          dropElem.isDraggable = true;
        });
    } else {
      this.isHanging = false;
      dropElem.isDragging = false;
      this.refreshStage();
    }
  }

  /**
   * Моделирование затухающих колебаний пружинного маятника.
   */
  animateDampedOscillation({
    startY,
    mass,
    stiffness,
    damping,
    initialDisplacement,
    scale = 100,
    onUpdate = null,
  }) {
    this.stopOscillation();

    const positionThreshold = 0.001; // 1 мм
    const velocityThreshold = 0.01; // 1 см/с
    const maxDuration = 60000; // 60 секунд

    return new Promise((resolve, reject) => {
      const sag = Application.kgToNewton(mass) / stiffness; // растяжение пружины под действием груза
      const equilibriumY = startY + (sag - initialDisplacement) * scale; // координата равновесия с грузом. Колебания идут вокруг этой точки.

      // x — смещение от равновесия с грузом
      let x = initialDisplacement - sag;
      let v = 0;

      const startTime = performance.now();
      let lastTime = startTime;

      this.cancelOscillation = false;
      this.oscillationResolve = resolve;
      const runId = this.oscillationId;

      // стрелочная функция сохраняет внешний this
      const step = (time) => {
        //условие остановки анимации
        if (this.cancelOscillation || runId !== this.oscillationId) {
          this.animationFrame = null;
          return;
        }

        const dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        // ускорение вокруг равновесия с грузом
        const a = (-stiffness * x - damping * v) / mass;

        // обновление скорости и позиции
        v += a * dt;
        x += v * dt;

        // координата груза на холсте
        const y = equilibriumY + x * scale;

        if (typeof onUpdate === "function") {
          onUpdate(y);
        }

        const elapsed = time - startTime;

        // проверяет, остановились ли колебания
        const stopped =
          Math.abs(x) < positionThreshold && Math.abs(v) < velocityThreshold;

        const timeout = elapsed >= maxDuration;

        if (stopped || timeout) {
          this.animationFrame = null;
          this.oscillationResolve = null;
          resolve();
          return;
        }

        this.animationFrame = requestAnimationFrame(step);
      };

      this.animationFrame = requestAnimationFrame(step);
    });
  }

  applyOscillationY(y) {
    if (!this.isHanging) {
      return;
    }

    const minLength =
      this.settings.restLength * this.constants.oscillation.minLengthFactor;
    const cargoGap =
      this.hook.size +
      this.settings.cargoSize +
      this.getBrick().getUpperHookSize();
    const maxLength =
      this.canvas.clientHeight -
      this.spring.startY -
      cargoGap -
      10 * this.stageScale;

    let length = y - this.spring.startY;

    if (length < minLength) {
      length = minLength;
    }

    if (length > maxLength) {
      length = maxLength;
    }

    this.spring.length = length;
    this.hook.x = this.spring.startX;
    this.hook.y = this.spring.startY + this.spring.length;

    const pos = this.getDropPosition();
    const brick = this.getBrick();
    brick.x = pos.x;
    brick.y = pos.y;

    CanvasUtils.clearCanvas(this.canvas);
    this.ruler.draw();
    this.spring.draw();
    this.hook.draw();
    this.drawBox();
    this.dragRendering.drawElements();
  }

  stopOscillation() {
    this.cancelOscillation = true;
    this.oscillationId += 1;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.oscillationResolve) {
      const resolve = this.oscillationResolve;
      this.oscillationResolve = null;
      resolve();
    }
  }

  getDropPosition() {
    let x = this.hook.x - this.settings.cargoSize / 2;
    let y = this.hook.y + this.hook.size + this.getBrick().getUpperHookSize();
    return { x, y };
  }

  getBrick() {
    return this.dragRendering.findElem(this.constants.brickName).elem;
  }

  /**
   * Рисование коробки для хранения перетаскиваемого груза
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
   *  функция, которая вызывается при изменении данных в IFrame
   */
  receivedMessage() {
    if (
      this.spring == undefined ||
      this.ruler == undefined ||
      this.hook == undefined
    ) {
      return;
    }

    this.settings.mass = Number(this.dataContext.topicVariables.mass);
    this.settings.stiffness = Number(this.dataContext.topicVariables.stiffness);
    this.settings.damping = Number(this.dataContext.topicVariables.damping);
    this.settings.displacement = Number(
      this.dataContext.topicVariables.displacement,
    );
    this.settings.frequency = Number(this.dataContext.topicVariables.frequency);

    this.clear();
    this.refreshStage();
  }

  // возвращает груз в коробку
  clear() {
    this.stopOscillation();
    this.isHanging = false;

    if (this.dragRendering == undefined) {
      return;
    }

    const found = this.dragRendering.findElem(this.constants.brickName);
    if (found == undefined) {
      return;
    }

    found.isDraggable = true;
    found.isDragging = false;
    found.elem.x = this.settings.cargoCoord.x;
    found.elem.y = this.settings.cargoCoord.y;
  }

  /**
   * Перерисовка элементов сцены
   */
  refreshStage() {
    this.resizeOscillations();
    CanvasUtils.clearCanvas(this.canvas);
    this.ruler.draw();
    this.spring.draw();
    this.hook.draw();
    this.drawBox();

    if (this.dragRendering != undefined) {
      this.dragRendering.drawElements();
    }
  }

  // очищает все переменные
  reset() {
    this.stopOscillation();
    this.isHanging = false;
    this.spring = undefined;
    this.ruler = undefined;
    this.hook = undefined;
  }
} // OscillationsDemo
