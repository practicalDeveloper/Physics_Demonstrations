import { AppliancesDemo } from "./topicsRender/appliancesRender.js";
import { PendulumDemo } from "./topicsRender/pendulumRender.js";
import { ArchimedesPrincipleDemo } from "./topicsRender/archimedesPrincipleRender.js";
import { ForcesByAngleDemo } from "./topicsRender/forcesbyAngleRender.js";
import { OscillationsDemo } from "./topicsRender/oscillationsRender.js";
import { Resources } from "./appMethods.js";
import { Layout } from "./layout.js";
import { DragManager } from "./dragging.js";
import { Application, CanvasUtils } from "./appMethods.js";

export class DataContext {
  constructor() {
    // данные, полученные из iframe
    this.topicVariables = {};
  }
}

export class ApplicationRendering {
  constructor() {
    this.dataContext = undefined;
    this.selectedTopic = "";
    this.forcesByAngleDemo = undefined;
    this.pendulumDemo = undefined;
    this.archimedesPrincipleDemo = undefined;
    this.appliancesDemo = undefined;
    this.oscillationsDemo = undefined;
    this.dragRendering = undefined;

    this.canvas = Application.canvas;
    this.context = Application.canvas.getContext("2d");

    this.currentTopic = undefined;
    this.topicSwitch = 0;
    this.topics = {
      forcesAdditionByAngleId: 1,
      ArchimedesPrincipleId: 2,
      pendulumDemoId: 3,
      AppliancesDemoId: 4,
      OscillationsDemoId: 5,
    }; // атрибуты данных из HTML меню, соответствующие физическим темам
  }

  /**
   * Инициализация приложения
   */
  initialInit() {
    CanvasUtils.stretchCanvas(this.canvas, "divCanvas");

    CanvasUtils.stretchCanvas(Application.overlayCanvas, "divCanvas");

    this.dragRendering = new DragManager();
    this.dragRendering.canvas = this.canvas;
    this.dragRendering.overlayCanvas = Application.overlayCanvas;

    this.forcesByAngleDemo = new ForcesByAngleDemo();
    this.forcesByAngleDemo.dataContext = this.dataContext;

    this.archimedesPrincipleDemo = new ArchimedesPrincipleDemo();
    this.archimedesPrincipleDemo.dataContext = this.dataContext;

    this.pendulumDemo = new PendulumDemo();
    this.pendulumDemo.dataContext = this.dataContext;

    this.appliancesDemo = new AppliancesDemo();
    this.appliancesDemo.dataContext = this.dataContext;

    this.oscillationsDemo = new OscillationsDemo();
    this.oscillationsDemo.dataContext = this.dataContext;

    this.forcesByAngleDemo.canvas = this.canvas;
    this.archimedesPrincipleDemo.canvas = this.canvas;
    this.appliancesDemo.canvas = this.canvas;
    this.pendulumDemo.canvas = this.canvas;
    this.oscillationsDemo.canvas = this.canvas;

    this.forcesByAngleDemo.ctx = this.context;
    this.oscillationsDemo.ctx = this.context;
    this.archimedesPrincipleDemo.ctx = this.context;
    this.pendulumDemo.ctx = this.context;
    this.appliancesDemo.ctx = this.context;

    this.forcesByAngleDemo.dragRendering =
      this.archimedesPrincipleDemo.dragRendering = this.dragRendering;
    this.oscillationsDemo.dragRendering = this.dragRendering;

    this.renderMenu();
  } // initialInit

  /**
   * Передает переменные из элемента iframe
   * в текущую тему
   */
  receiveData() {
    if (this.currentTopic !== undefined) {
      switch (this.currentTopic) {
        case this.topics.forcesAdditionByAngleId:
          this.forcesByAngleDemo.receivedMessage();
          break;

        case this.topics.ArchimedesPrincipleId:
          this.archimedesPrincipleDemo.receivedMessage();
          break;

        case this.topics.pendulumDemoId:
          this.pendulumDemo.receivedMessage();
          break;

        case this.topics.AppliancesDemoId:
          this.appliancesDemo.receivedMessage();
          break;
        case this.topics.OscillationsDemoId:
          this.oscillationsDemo.receivedMessage();
          break;

        default:
          // no topic selected
          break;
      }
    }
  } // receiveData

  /**
   * Стирает прошлую сцену сразу, а новую строит на следующем кадре.
   * Иначе при первой загрузке с сайта старый рисунок остаётся,
   * пока грузится и собирается демонстрация.
   */
  openTopic() {
    this.topicSwitch += 1;
    const switchId = this.topicSwitch;

    CanvasUtils.clearCanvas(this.canvas);
    CanvasUtils.clearCanvas(Application.overlayCanvas);

    this.clearTopics();
    this.pendulumDemo.stopTimer();

    requestAnimationFrame(() => {
      if (switchId !== this.topicSwitch) {
        return;
      }

      switch (this.currentTopic) {
        case this.topics.forcesAdditionByAngleId:
          this.forcesByAngleDemo.init();
          break;
        case this.topics.ArchimedesPrincipleId:
          this.archimedesPrincipleDemo.init();
          break;
        case this.topics.pendulumDemoId:
          this.pendulumDemo.init();
          break;
        case this.topics.AppliancesDemoId:
          this.appliancesDemo.init();
          break;
        case this.topics.OscillationsDemoId:
          this.oscillationsDemo.init();
          break;
        default:
          break;
      }

      this.receiveData();
    });
  }

  /**
   * Очищает все темы
   */
  clearTopics() {
    this.dragRendering.dragElements = [];
    this.dragRendering.activeTouchId = null;

    this.forcesByAngleDemo.reset();
    this.archimedesPrincipleDemo.reset();
    this.pendulumDemo.reset();
    this.appliancesDemo.reset();
    this.oscillationsDemo.reset();
  }

  /**
   * Передает сообщение в iframe
   */
  sendFrameMessage(passData) {
    const frame = window.frames.BoardFrame;

    frame.postMessage(JSON.stringify(passData), "*");
  }

  /**
   * Рендерит HTML меню
   */
  renderMenu() {
    const menuElements = document.getElementsByClassName("menu-item");

    for (const elem of menuElements) {
      const levelId = elem.id;
      const div = elem.getElementsByClassName("menu-sub-item")[0];

      elem.onclick = () => {
        div.hidden = !div.hidden;
      };

      if (div == undefined) continue;

      const divElements = div.querySelectorAll("div");

      for (const elementDiv of divElements) {
        elementDiv.onclick = () => {
          // header
          const header = document.getElementById("ApplicationHeader");
          header.innerText = elementDiv.innerText;

          const css = "--" + levelId + "-color";
          header.style.color = Application.getRootVarCSS(css);

          // текущая тема
          this.currentTopic = Number(elementDiv.dataset.topic);
          this.openTopic();
        };
      }
    }
  } // renderMenu
} // ApplicationRendering

const ctx = new DataContext();

const applicationRendering = new ApplicationRendering();
applicationRendering.dataContext = ctx;

applicationRendering.initialInit();

Resources.apply();

// получает данные из iframe
window.addEventListener(
  "message",
  function (e) {
    var key = e.message ? "message" : "data";

    for (const key of Object.keys(ctx.topicVariables)) {
      delete ctx.topicVariables[key];
    }

    Object.assign(ctx.topicVariables, JSON.parse(e[key]));

    applicationRendering.receiveData();
  },
  false,
);

// события мыши
Application.overlayCanvas.onmousedown = (e) =>
  applicationRendering.dragRendering.canvasMouseDown(e);

Application.overlayCanvas.onmouseup = (e) =>
  applicationRendering.dragRendering.canvasMouseUp(e);

Application.overlayCanvas.onmousemove = (e) =>
  applicationRendering.dragRendering.canvasMouseMove(e);

applicationRendering.dragRendering.attachTouchListeners(
  Application.overlayCanvas,
);

function refreshStageSize() {
  CanvasUtils.stretchCanvas(Application.canvas, "divCanvas");
  CanvasUtils.stretchCanvas(Application.overlayCanvas, "divCanvas");
  applicationRendering.receiveData();
}

Layout.init(() => refreshStageSize());
