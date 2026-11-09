import { Application, CanvasUtils } from "../../js/appMethods.js";
import { frameRender } from "../js/framesRendering.js";
import { Resources } from "../../js/appMethods.js";

window.addEventListener("load", () => {
  frameRender.passControlsMessage();
});

Resources.apply();

// функция для отправки сообщения родителю из iframe с данными
frameRender.passControlsMessage = function () {
  let x = document.getElementById("xWeightTextBox").value;
  let y = document.getElementById("yWeightTextBox").value;
  let z = document.getElementById("zWeightTextBox").value;
  let maxValue = document.getElementById("maxValue").value;
  let angle = document.getElementById("angleRange").value;

  if (
    Application.isNumber(x) &&
    Application.isNumber(y) &&
    Application.isNumber(z)
  ) {
    let pass_data = {
      xWeight: x,
      yWeight: y,
      zWeight: z,
      angle: angle,
      maxValue: maxValue,
    };

    parent.postMessage(JSON.stringify(pass_data), "*");
  }
}; // passControlsMessage

frameRender.receiveData = function (data) {
  let vars = JSON.parse(data);
  document.getElementById("forceLabel").innerHTML = vars.force;
};
