        import { Application, CanvasUtils }from "../../js/appMethods.js";
        import { frameRender } from "../js/framesRendering.js";
        import { Resources }  from "../../js/appMethods.js";

        Resources.apply();

        // функция для отправки сообщения родителю из iframe с данными
        frameRender.passControlsMessage = function () {

            let l = document.getElementById('lengthRange').value;
            let l2 = document.getElementById('lengthRangeSecond').value;
            let firstPeriod = Application.roundTwoDigits(2 * Math.PI * Math.sqrt(l / Application.gravity));
            let secondPeriod = Application.roundTwoDigits(2 * Math.PI * Math.sqrt(l2 / Application.gravity));
            let angle = document.getElementById('angleRange').value;
            let secondAngle = document.getElementById('angleRangeSecond').value;

            document.getElementById('firstPeriodLabel').innerHTML = firstPeriod;
            document.getElementById('secondPeriodLabel').innerHTML = secondPeriod;
            document.getElementById('firstFrequencyLabel').innerHTML = Application.roundTwoDigits(1 / firstPeriod);
            document.getElementById('secondFrequencyLabel').innerHTML = Application.roundTwoDigits(1 / secondPeriod);

            let pass_data = {
                'firstLength': l,
                'secondLength': l2,
                'firstPeriod': firstPeriod,
                'secondPeriod': secondPeriod,
                'firstAngle': angle,
                'secondAngle': secondAngle,

            };

            parent.postMessage(JSON.stringify(pass_data), "*");

        } // passControlsMessage
