export class FrameRender {

    constructor() {
        
    }

    /**
     * Custom функция для отправки сообщения из iframe в родителя
     */
    passControlsMessage() {

    }

    /**
     * Вызывается, когда родитель отправляет данные
     */
    receiveData(data) {

    }

    /**
     * Привязывает все события input
     */
    bindEvents() {

        const passMsg = this.passControlsMessage.bind(this);
        const body = document.body;
        const inputElements = body.querySelectorAll("input");

        for (const elem of inputElements) {
            const setRangeLabelValue = () => {
                if (elem.type === "range") {
                    const next = elem.nextElementSibling;
                    if (next) {
                        next.innerHTML = elem.value;
                    }
                }
            };

            setRangeLabelValue();

            elem.oninput = () => {
                setRangeLabelValue();

                if (!elem.hasAttribute("data-no-pass-input")) {
                        passMsg();
                }
            };
        }
    }
}


export const frameRender = new FrameRender();

window.addEventListener("load", () => {

    frameRender.bindEvents();
    frameRender.passControlsMessage();

});

window.addEventListener("message", (e) => {

    const key = e.message ? "message" : "data";

    frameRender.receiveData(e[key]);

});



