import { Application, CanvasUtils }from "../../js/appMethods.js";
import { frameRender } from "../js/framesRendering.js";
import { Resources }  from "../../js/appMethods.js";

Resources.apply();

// функция для отправки сообщения родителю из iframe с данными
frameRender.passControlsMessage = function () {

    let m = document.getElementById('massRange').value;
    let k = document.getElementById('stiffnessRange').value;
    let c = document.getElementById('dampingRange').value;
    let x0 = document.getElementById('displacementRange').value;

    let underRoot = k / m - (c * c) / (4 * m * m);
    let frequency = 0;

    if (underRoot > 0) {
        frequency = Application.roundTwoDigits(
            (1 / (2 * Math.PI)) * Math.sqrt(underRoot)
        );
    }

    document.getElementById('frequencyLabel').innerHTML = frequency;

    let pass_data = {
        'mass': m,
        'stiffness': k,
        'damping': c,
        'displacement': x0,
        'frequency': frequency,
    };

    parent.postMessage(JSON.stringify(pass_data), "*");

} // passControlsMessage
