import { Application, CanvasUtils } from "./appMethods.js";

/**
 * Обработчик перетаскивания элементов на холсте
 */
export class DragManager {

    constructor(canvas = undefined) {

        // холст для рисования (фон / инструменты при наложенном режиме)
        this.canvas = canvas;

        // верхний холст для перетаскиваемых элементов; события мыши попадают сюда
        this.overlayCanvas = undefined;

        // когда true, redraw() очищает только overlay
        this.layered = false;

        // элементы на сцене
        this.dragElements = [];

        // координаты мыши / активного касания
        this.startMouseX = 0;
        this.startMouseY = 0;

        // идентификатор пальца, который перетаскивает; null для мыши
        this.activeTouchId = null;

        /**
         * Custom callback, вызываемый при начале перетаскивания.
         * @param {*} elem
         */
        this.startedDragging = function (elem) { };

        /**
         * Custom callback, вызываемый при окончании перетаскивания.
         * @param {*} elem
         */
        this.stoppedDragging = function (elem) { };

        /**
         * Custom callback для перерисовки.
         */
        this.refresh = function () { };

    }


    /**
     * Добавляет перетаскиваемые элементы.
     * @param {Array} elements
     */
    addElements(elements) {

        this.dragElements = elements.slice();

        this.dragElements.forEach(element => {
            element.isDraggable = true;
        });

        this.drawElements();

    }


    /**
     * Ищет элемент по id.
     */
    findElem(id) {

        return this.dragElements.find(
            el => el.id == id
        );

    }


    /**
     * Рисует все перетаскиваемые элементы.
     */
    drawElements() {

        for (const element of this.dragElements) {

            element.elem.draw();

        }

    }


    /**
     * Холст для проверки попадания, курсора и рисования наложения.
     */
    interactionCanvas() {
        return this.overlayCanvas || this.canvas;
    }


    /**
     * Очищает overlay и перерисовывает перетаскиваемые элементы.
     * В наложенном режиме фон не трогается.
     */
    redraw() {
        if (this.layered && this.overlayCanvas) {
            CanvasUtils.clearCanvas(this.overlayCanvas);
            this.drawElements();
            return;
        }

        CanvasUtils.clearCanvas(this.canvas);
        this.refresh();
        this.drawElements();
    }


    /**
     * Перерисовывает инструменты на фоне и элементы на overlay.
     */
    redrawAll() {
        if (this.layered && this.overlayCanvas) {
            CanvasUtils.clearCanvas(this.canvas);
            this.refresh();
            CanvasUtils.clearCanvas(this.overlayCanvas);
            this.drawElements();
            return;
        }

        this.redraw();
    }



    /**
     * Событие мыши для холста.
     */
    canvasMouseDown(e) {

        e.preventDefault();
        e.stopPropagation();

        if (
            this.dragElements.length === 0 ||
            this.dragElements[0].elem === undefined
        ) {
            return;
        }

        const { mx, my } = this.elementCoord(e);

        // Сначала верхний (последний нарисованный) элемент, чтобы правильно попадать в наложенные элементы.
        for (let i = this.dragElements.length - 1; i >= 0; i--) {
            const element = this.dragElements[i];

            if (
                element.isDraggable &&
                this.isPointerInElement(e, element.elem)
            ) {

                element.isDragging = true;
                this.startedDragging(element);
                this.interactionCanvas().style.cursor = "pointer";
                break;
            }
        }

        // Сохраняет текущие координаты мыши.
        this.startMouseX = mx;
        this.startMouseY = my;

    }


    /**
     * Событие мыши для холста.
     */
    canvasMouseUp(e) {

        e.preventDefault();
        e.stopPropagation();

        if (
            this.dragElements.length === 0 ||
            this.dragElements[0].elem === undefined
        ) 
        {
            return;
        }

        const dragElem = this.dragElements.find(
            element => element.isDragging
        );

        if (!dragElem) {
            return;
        }

        this.stoppedDragging(dragElem);

        dragElem.isDragging = false;

    }



    /**
     * Клиентские координаты из события мыши, или из активного касания.
     * События мыши используют event.clientX / clientY без изменений.
     */
    pointerClient(e) {

        const touchList = (e.touches && e.touches.length)
            ? e.touches
            : e.changedTouches;

        if (touchList && touchList.length) {

            let touch = touchList[0];

            if (this.activeTouchId != null) {
                for (let i = 0; i < touchList.length; i++) {
                    if (touchList[i].identifier === this.activeTouchId) {
                        touch = touchList[i];
                        break;
                    }
                }
            }

            return { clientX: touch.clientX, clientY: touch.clientY };
        }

        return { clientX: e.clientX, clientY: e.clientY };
    }


    /**
     * Получает текущие координаты указателя в пиксельном пространстве холста.
     */
    elementCoord(e) {

        const { clientX, clientY } = this.pointerClient(e);
        const rect = this.interactionCanvas().getBoundingClientRect();

        return {
            mx: Math.trunc(clientX - rect.left),
            my: Math.trunc(clientY - rect.top)
        };

    }


    /**
     * True если это touchend/cancel принадлежит пальцу, который начал жест.
     */
    isActiveTouch(e) {

        if (this.activeTouchId == null || e.changedTouches == null) {
            return false;
        }

        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.activeTouchId) {
                return true;
            }
        }

        return false;
    }


    /**
     * Сопоставляет touchstart с существующим mousedown путем.
     */
    canvasTouchStart(e) {

        // игнорирует дополнительные пальцы, пока один контакт уже отслеживается
        if (this.activeTouchId != null) {
            e.preventDefault();
            return;
        }

        this.activeTouchId = e.changedTouches[0].identifier;
        this.canvasMouseDown(e);
    }


    /**
     * Сопоставляет touchmove с существующим mousemove путем.
     */
    canvasTouchMove(e) {

        if (this.activeTouchId == null) {
            return;
        }

        this.canvasMouseMove(e);
    }


    /**
     * Сопоставляет touchend / touchcancel с существующим mouseup путем.
     */
    canvasTouchEnd(e) {

        if (this.isActiveTouch(e) === null || this.isActiveTouch(e) === undefined) {
            return;
        }

        this.canvasMouseUp(e);
        this.activeTouchId = null;
    }


    /**
     * Не-пассивные слушатели касания, чтобы preventDefault мог блокировать прокрутку страницы.
     */
    attachTouchListeners(target) {

        const opts = { passive: false };

        target.addEventListener("touchstart", (e) => this.canvasTouchStart(e), opts);
        target.addEventListener("touchmove", (e) => this.canvasTouchMove(e), opts);
        target.addEventListener("touchend", (e) => this.canvasTouchEnd(e), opts);
        target.addEventListener("touchcancel", (e) => this.canvasTouchEnd(e), opts);
    }


    /**
     * Проверяет, находится ли указатель мыши внутри элемента.
     */
    isPointerInElement(e, el) {

        const { mx, my } = this.elementCoord(e);
        const hookUp = typeof el.getUpperHookSize === "function" ? el.getUpperHookSize() : 0;
        const hookDown = typeof el.getHookSize === "function" ? el.getHookSize() : 0;

        return (
            mx > el.x &&
            mx < el.x + el.width &&
            my > el.y - hookUp &&
            my < el.y + el.height + hookDown
        );

    }


    /**
     * Событие движения мыши для холста.
     */
    canvasMouseMove(e) {

        e.preventDefault();
        e.stopPropagation();

        if (
            this.dragElements.length === 0 ||
            this.dragElements[0].elem === undefined
        ) {
            return;
        }

        const { mx, my } = this.elementCoord(e);

        // проверяет, находится ли курсор над перетаскиваемым элементом
        let conditionEnter = false;

        for (let i = this.dragElements.length - 1; i >= 0; i--) {
            const element = this.dragElements[i];

            if (
                element.isDraggable &&
                this.isPointerInElement(e, element.elem)
            ) {
                conditionEnter = true;
                break;
            }
        }

        this.interactionCanvas().style.cursor = conditionEnter ? "pointer" : "default";

        const dragElem = this.dragElements.find(
            element =>
                element.isDragging &&
                element.isDraggable
        );

        // пользователь перетаскивает элемент
        if (!dragElem) {
            return;
        }

        // mouse delta
        const dx = mx - this.startMouseX;
        const dy = my - this.startMouseY;

        // перемещает перетаскиваемые элементы
        for (const element of this.dragElements) {
            if (element.isDragging) {
                element.elem.x += dx;
                element.elem.y += dy;
            }
        }

        // перерисовывает сцену
        this.redraw();

        // сохраняет текущие координаты мыши
        this.startMouseX = mx;
        this.startMouseY = my;

    }

} // class

