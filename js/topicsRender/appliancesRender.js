import { Application, CanvasUtils } from "../appMethods.js";
import { Spring } from "../Tools/spring.js";
import { Ruler } from "../Tools/ruler.js";
import { SpringDynamometer } from "../Tools/springDynamometer.js";
import { Dynamometer } from "../Tools/dynamometer.js";
import { Appliance } from "../Tools/appliance.js";
import { Ball, Brick, Hook } from "../Tools/stageElements.js";

/**
 * Методы, связанные с темой 'Приборы'
 */
export class AppliancesDemo {
  constructor() {
    this.canvas = undefined;
    this.dataContext = undefined;
    this.ctx = undefined;

    this.arrowDynamometer = undefined;
    this.springDynamometer = undefined;
    this.ruler = undefined;
    this.spring = undefined;
    this.appliance = undefined;
    this.brick = undefined;
    this.ball = undefined;
    this.hook = undefined;

    this.constants = Object.freeze({
      springDynam: { startX: 100, startY: 50, length: 400, height: 60 },
      ruler: { startX: 200, startY: 50, length: 500, height: 60 },
      spring: { startX: 200, startY: 150, length: 200, radius: 30 },
      arrowDynam: { centerX: 250, centerY: 300, radius: 100 },
      appliance: { centerX: 600, centerY: 300, radius: 100 },
      ball: { x: 510, y: 130, size: 40 },
      brick: { x: 450, y: 130, size: 40, lineWidth: 2 },
      hook: { x: 580, y: 130, size: 40, lineWidth: 2 },
      layout: { baseWidth: 900, baseHeight: 700 },
    });

    this.baseWidth = 0;
    this.baseHeight = 0;

    this.stageScale = 1;
  }

  /**
   * Применяет масштабирование ко всем приборам
   */
  resizeAppliances() {
    CanvasUtils.applyScale(this);
    let cst = this.constants;
    this.resizeSpringDynamometer(cst);
    this.resizeRuler(cst);
    this.resizeSpring(cst);
    this.resizeArrowDynamometer(cst);
    this.resizeAppliance(cst);
    this.resizeBall(cst);
    this.resizeBrick(cst);
    this.resizeHook(cst);
  }

  resizeSpringDynamometer(cst) {
    this.springDynamometer.startX = cst.springDynam.startX * this.stageScale;
    this.springDynamometer.startY = cst.springDynam.startY * this.stageScale;

    this.springDynamometer.length = cst.springDynam.length * this.stageScale;
    this.springDynamometer.height = cst.springDynam.height * this.stageScale;
    this.springDynamometer.updateGeometry();
  }

  resizeRuler(cst) {
    this.ruler.startX = cst.ruler.startX * this.stageScale;
    this.ruler.startY = cst.ruler.startY * this.stageScale;

    this.ruler.length = cst.ruler.length * this.stageScale;
    this.ruler.height = cst.ruler.height * this.stageScale;
  }

  resizeSpring(cst) {
    this.spring.startX = cst.spring.startX * this.stageScale;
    this.spring.startY = cst.spring.startY * this.stageScale;

    this.spring.radius = cst.spring.radius * this.stageScale;
    this.spring.length = cst.spring.length * this.stageScale;
  }

  resizeArrowDynamometer(cst) {
    this.arrowDynamometer.centerX = cst.arrowDynam.centerX * this.stageScale;
    this.arrowDynamometer.centerY = cst.arrowDynam.centerY * this.stageScale;

    this.arrowDynamometer.radius = cst.arrowDynam.radius * this.stageScale;
  }

  resizeAppliance(cst) {
    this.appliance.centerX = cst.appliance.centerX * this.stageScale;
    this.appliance.centerY = cst.appliance.centerY * this.stageScale;

    this.appliance.radius = cst.appliance.radius * this.stageScale;
  }

  resizeBall(cst) {
    this.ball.x = cst.ball.x * this.stageScale;
    this.ball.y = cst.ball.y * this.stageScale;

    this.ball.width = cst.ball.size * this.stageScale;
    this.ball.height = cst.ball.size * this.stageScale;
  }

  resizeBrick(cst) {
    this.brick.x = cst.brick.x * this.stageScale;
    this.brick.y = cst.brick.y * this.stageScale;

    this.brick.width = cst.brick.size * this.stageScale;
    this.brick.height = cst.brick.size * this.stageScale;
  }

  resizeHook(cst) {
    this.hook.x = cst.hook.x * this.stageScale;
    this.hook.y = cst.hook.y * this.stageScale;

    this.hook.size = cst.hook.size * this.stageScale;
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

    this.springDynamometer = new SpringDynamometer({
      canvas: this.canvas,
      angle: 90,
      strokeColor: "black",
      value: 0,
      animatedHolder: true,
      maxValue: 50,
    });

    this.springDynamometer.valueOnChange = () => {
      this.refreshStage();
    };

    this.ruler = new Ruler({
      canvas: this.canvas,
      strokeColor: "black",
      maxValue: 500,
    });

    this.spring = new Spring({
      canvas: this.canvas,
      swings: 20,
    });

    this.arrowDynamometer = new Dynamometer({
      ringColor: "red",
      innerRingColor: "yellow",
      canvas: this.canvas,
      angle: 45,
      maxValue: 20,
    });

    this.appliance = new Appliance({
      canvas: this.canvas,
    });

    this.ball = new Ball({
      itemText: "Ball",
      canvas: this.canvas,
    });

    this.brick = new Brick({
      fill: "LightGray",
      strokeColor: "black",
      itemText: "Brick",
      lineWidth: 2,
      canvas: this.canvas,
    });

    this.hook = new Hook({
      x: 580,
      y: 130,
      size: 40,
      lineWidth: 2,
      canvas: this.canvas,
      angle: 0,
    });

    this.resizeAppliances();
    this.refreshStage();
  } // init

  /**
   * Функция, которая вызывается при изменении данных в iframe
   */
  receivedMessage() {
    if (
      this.arrowDynamometer != undefined &&
      this.springDynamometer != undefined
    ) {
      if (this.dataContext.topicVariables.maxValueArrow != undefined) {
        this.arrowDynamometer.maxValue =
          this.dataContext.topicVariables.maxValueArrow;
      }

      if (this.dataContext.topicVariables.maxValueSpring != undefined) {
        this.springDynamometer.maxValue =
          this.dataContext.topicVariables.maxValueSpring;
      }

      if (this.dataContext.topicVariables.valueArrow != undefined) {
        let value = parseInt(this.dataContext.topicVariables.valueArrow);
        this.arrowDynamometer.setValue(value);
      }

      if (this.dataContext.topicVariables.valueSpring != undefined) {
        let value = parseInt(this.dataContext.topicVariables.valueSpring);
        this.springDynamometer.setValue(value);
      }

      this.refreshStage();
    }
  }

  /**
   * Очищает стрелочный динамометр
   */
  reset() {
    if (this.arrowDynamometer !== undefined) {
      this.arrowDynamometer.stopAnimation();
    }
    this.arrowDynamometer = undefined;
  }

  /**
   * Перерисовка элементов сцены
   */
  refreshStage() {
    this.resizeAppliances();
    CanvasUtils.clearCanvas(this.canvas);
    this.arrowDynamometer.draw();
    this.springDynamometer.draw();
    this.ruler.draw();
    this.spring.draw();
    this.brick.draw();
    this.ball.draw();
    this.hook.draw();
    this.appliance.draw();
    this.appliance.drawPointer(90);
    this.arrowDynamometer.setStaticValue(
      this.dataContext.topicVariables.valueArrow,
    );
  }
}
