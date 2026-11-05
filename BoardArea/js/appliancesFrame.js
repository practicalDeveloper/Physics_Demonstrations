        import { frameRender } from "../js/framesRendering.js";
        import { Resources }  from "../../js/appMethods.js";

        Resources.apply();

        document.getElementById("setArrowValueButton").addEventListener("click", setArrowValueFunction);
        document.getElementById("setSpringValueButton").addEventListener("click", setSpringValueFunction);

        function setArrowValueFunction() {
            let valueArrow = document.getElementById('arrowValueTextBox').value;
            parent.postMessage(JSON.stringify({'valueArrow': valueArrow }), "*");
        }

        function setSpringValueFunction() {
            let valueArrow = document.getElementById('springValueTextBox').value;
            parent.postMessage(JSON.stringify({'valueSpring': valueArrow }), "*");
        }

        // функция для отправки сообщения родителю из IFrame с данными
        frameRender.passControlsMessage = function () {

             let maxValueSpring = document.getElementById('maxValueSpring').value;
             let maxValueArrow = document.getElementById('maxValueArrow').value;
             
            let pass_data = {
                'maxValueSpring': maxValueSpring,
                'maxValueArrow' : maxValueArrow
            };

            parent.postMessage(JSON.stringify(pass_data), "*");

        } // passControlsMessage

