import ru from "../resources/strings.ru.js";
import en from "../resources/strings.en.js";

/**
 * Общие методы и свойства приложения
 */
export class Application {

  static arcPath = 2 * Math.PI;

  static frameTime =  1000 / 60; // продолжительность одного кадра при 60 FPS

  /**
   * Время с предыдущего кадра анимации.
   */
  static getDeltaTime(previousTime, currentTime) {
    if (previousTime === null) {
      previousTime = currentTime;
    }

    return {
      deltaTime: currentTime - previousTime,
      previousTime: currentTime,
    };
  }

  /**
   * Шаг анимации для скорости, заданной в единицах на кадр 60 FPS.
   */
  static getAnimationStep(speed, deltaTime) {
    return speed * deltaTime / Application.frameTime;
  }

  static gravity = 9.81; 

  static degrToRad = (degrees) => (Math.PI / 180) * degrees;

  static kgToNewton = (kg) => kg * Application.gravity;

  static canvas = document.getElementById("Canvas");
  static overlayCanvas = document.getElementById("CanvasOverlay");

  static timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  static roundTwoDigits = (param) => Math.round(param * 100) / 100;

  /**
   * Читает r, g, b из `rgb(nn, nn, nn)` или `#rrggbb`.
   */
  static getRgb(color) {
    if (color[0] === "#") {
      return {
        r: parseInt(color.slice(1, 3), 16),
        g: parseInt(color.slice(3, 5), 16),
        b: parseInt(color.slice(5, 7), 16),
      };
    }

    let [r, g, b] = color
      .replace("rgb(", "")
      .replace(")", "")
      .split(",")
      .map((str) => Number(str));

    return { r, g, b };
  }

  /**
   * Интерполирует между двумя цветами.
   * intval 0 - colorA, 1 - colorB.
   * intval - значение от 0 до 1, определяющее пропорцию между двумя цветами.
   */
  static colorInterpolate(colorA, colorB, intval) {
    const rgbA = Application.getRgb(colorA);
    const rgbB = Application.getRgb(colorB);
    const colorVal = (prop) =>
      Math.round(rgbA[prop] * (1 - intval) + rgbB[prop] * intval);

    return {
      r: colorVal("r"),
      g: colorVal("g"),
      b: colorVal("b"),
    };
  }

  /**
   * Получает promise с setTimeout
   */
  static timeoutPromise = (ms) => {
    let timer = 0;

    const promise = new Promise((resolve) => {
      timer = setTimeout(resolve, ms);
    });

    return { promise, timer };
  };

  static sendFrameMessage(passData) {
    const frame = window.frames.BoardFrame;

    frame.postMessage(JSON.stringify(passData), "*");
  }

  /**
   * Получает значение глобальной переменной CSS
   * @param {string} varName - имя переменной в CSS файле
   */
  static getRootVarCSS = (varName) => {
    const root = document.querySelector(":root");
    const rootStyles = getComputedStyle(root);

    return rootStyles.getPropertyValue(varName);
  };

  // проверяет, является ли число десятичным
  static isNumber = (n) => !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Вспомогательные методы для холста.
 */
export class CanvasUtils {
  /**
   * Очищает весь холст.
   */
  static clearCanvas(canvas) {
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Вращает холст вокруг точки.
   */
  static rotateCanvas(context, x, y, angle) {
    context.translate(x, y);
    context.rotate(Application.degrToRad(angle));
    context.translate(-x, -y);
  }

  /**
   * Подгоняет холст к HTML элементу.
   */
  static stretchCanvas(canvas, elementId) {
    const div = document.getElementById(elementId);

    canvas.width = div.clientWidth;
    canvas.height = div.clientHeight;
  }

  /**
   * Задает размеры сцены без масштабирования.
   */
  static setBaseSize(scene, baseWidth, baseHeight) {
    scene.baseWidth = baseWidth;
    scene.baseHeight = baseHeight;
    scene.stageScale = 1;
  }

  /**
   * Применяет масштабирование к сцене. 
   */
  static applyScale(scene) {
    const scaleX = scene.canvas.width / scene.baseWidth;
    const scaleY = scene.canvas.height / scene.baseHeight;
    scene.stageScale = Math.min(scaleX, scaleY);
    return scene.stageScale;
  }

  /**
   * Применяет тень к холсту.
   */
  static applyShadow(context) {
    context.shadowColor = "#464646";
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.shadowBlur = 5;
  }

  /**
   * Рисует центрированный текст.
   */
  static drawCenterText(context, font, text, x, y) {
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = font;

    context.fillText(text, x, y);
  }

  /**
   * Рисует прямоугольник с закругленными углами.
   */
  static roundRect(
    context,
    x,
    y,
    width,
    height,
    radius,
    lineWidth = 0,
    fill = "white",
  ) {
    radius = Math.min(radius, width / 2, height / 2);

    context.save();

    context.beginPath();

    context.moveTo(x + radius, y);

    context.arcTo(x + width, y, x + width, y + height, radius);

    context.arcTo(x + width, y + height, x, y + height, radius);

    context.arcTo(x, y + height, x, y, radius);

    context.arcTo(x, y, x + width, y, radius);

    context.closePath();

    context.lineWidth = lineWidth;
    context.fillStyle = fill;

    if (lineWidth > 0) {
      context.stroke();
    }

    context.fill();
    context.restore();
  }
}

/**
 * Применение строковых ресурсов для приложения
 */
export class Resources {
  static languages = {
    en,
    ru,
  };

  static currentLang = ru;

  static setLanguage(lang) {
      if (Resources.languages[lang] !== undefined) {
          Resources.currentLang = Resources.languages[lang];
      } 
      else 
      {
          Resources.currentLang = ru;
      }
    }

  // получает строковый ресурс
  static get(key) {

      const parts = key.split(".");
      let result = Resources.currentLang;

      for (const part of parts) {
          result = result[part];

          if (result === undefined) 
          {
              return key;
          }
      }

      return result;
  }

  // применяет строковый ресурс для элемента
  static apply() {
    const attribute = "data-resource";
    document.querySelectorAll(`[${attribute}]`).forEach((elem) => {
        let key = elem.getAttribute(attribute);
        elem.innerHTML = Resources.get(key);
    });
  }
  
}


