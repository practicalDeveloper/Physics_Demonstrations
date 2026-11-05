        import { Application, CanvasUtils }from "../../js/appMethods.js";
        import { frameRender } from "../js/framesRendering.js";
        import { Resources }  from "../../js/appMethods.js";

        Resources.apply();

        // функция для отправки сообщения родителю из iframe с данными
        frameRender.passControlsMessage = function () {


            let w = document.getElementById('weightRange').value;
            let maxValue = document.getElementById("maxValueRange").value;
            let liquidDensity = document.getElementById("liquidDensityTextBox").value;
            let bodyDensity = document.getElementById("bodyDensityTextBox").value;

            if (Application.isNumber(liquidDensity) && Application.isNumber(bodyDensity)) {
                let pass_data = {
                    'weight': w,
                    'maxValue': maxValue,
                    'liquidDensity': liquidDensity,
                    'bodyDensity': bodyDensity
                };

                parent.postMessage(JSON.stringify(pass_data), "*");
            }
        } // passControlsMessage


        // функция для получения данных из главного окна для iframe
        frameRender.receiveData = function (data) {
            let vars = JSON.parse(data);
            document.getElementById('forceLabel').innerHTML = vars.buyonantForce;
            document.getElementById('volumeLabel').innerHTML = vars.volume;
            document.getElementById('gravityLabel').innerHTML = vars.gravity;

            if (vars.gravity > 0) {
                if (vars.buyonantForce > vars.gravity)
                    document.getElementById('conditionLabel').innerHTML = Resources.get("ArchimedesPrinciple.Emerging");
                if (vars.buyonantForce < vars.gravity)
                    document.getElementById('conditionLabel').innerHTML = Resources.get("ArchimedesPrinciple.Sinking");
                if (vars.buyonantForce == vars.gravity)
                    document.getElementById('conditionLabel').innerHTML = Resources.get("ArchimedesPrinciple.Floating");
            }
            else{
                document.getElementById('conditionLabel').innerHTML = "";
            }
        }
