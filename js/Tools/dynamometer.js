import { Application, CanvasUtils } from "../appMethods.js";
import { Appliance } from "../Tools/appliance.js";

/**
 * Нарисованный на холсте динамометр
 */
export class Dynamometer extends Appliance {

    #maxValueAngle = 270;// угол для максимального значения
    #animationFrame = null;// фрейм для анимации
    #running = false;


    constructor(options = {}) {

        // наследование от Appliance
        super(options);

        // значения по умолчанию для динамометра
        Object.assign(this, {
            maxValue: 10,          // максимальное возможное значение динамометра
            value: 0,              // текущее значение динамометра
            rotateStep: undefined  // скорость вращения стрелки
        }, options);

        // функция, которая вызывается при изменении значения
        this.valueOnChange = function (value) { };


        /**
         * свойства динамометра для внутреннего использования
         */
        this.propsDynam = {

            defaultStepFraction: 0.018, // шаг по умолчанию для 60 FPS

            getAngleJump: () =>
                Application.roundTwoDigits(
                    (180 / this.maxValue) / 2
                ),

            getIndicFont: () =>
                this.radius * 0.1 + "px Times New Roman",

            getFontNewton: () =>
                this.radius * 0.15 + "px Times New Roman",

            getMidMaxValue: () =>
                Math.trunc(this.maxValue / 2),

            getRotateStep: () => {

                return (this.rotateStep === undefined)
                    ? this.maxValue * this.propsDynam.defaultStepFraction
                    : this.rotateStep;

            },

            /**
             * Рисует циферблат и линии
             */
            drawFaceIndicators: () => {

                let yTextGap = 0.16;
                let yNewtonGap = 0.3;

                let arcNumber = 0;

                let isOddMaxValue = this.maxValue % 2;

                // определяет дробный или целочисленный сектор
                let isFractionalArc = isOddMaxValue;

                let text = isOddMaxValue ? this.propsDynam.getMidMaxValue() + 1 : this.propsDynam.getMidMaxValue();

                let arcCount = isOddMaxValue ? (this.maxValue * 4) - 1 : (this.maxValue * 4);

                let currentAngle = 0;

                this.context.save();

                // Чтобы показать значения и линии
                for (let arc = 0; arc <= arcCount; arc++) {

                    currentAngle = +Application.roundTwoDigits(currentAngle + this.propsDynam.getAngleJump());

                    let angle = Application.degrToRad(currentAngle);

                    // Рисует линии циферблата
                    this.#drawFaceLine(
                        angle,
                        isFractionalArc
                    );


                    if (isFractionalArc) {

                        text = this.#getDrawFaceNumber(currentAngle, arcNumber, text);

                        arcNumber++;

                        // Рисует текст
                        if (arcNumber % 2) {

                            this.propsAppl.drawText(
                                angle,
                                yTextGap,
                                this.propsDynam.getIndicFont(),
                                text
                            );

                        }

                    }

                    isFractionalArc = !isFractionalArc;

                } // for


                // Рисует текст N
                this.propsAppl.drawText(
                    Application.degrToRad(270),
                    yNewtonGap,
                    this.propsDynam.getFontNewton(),
                    "N"
                );

                this.context.restore();

            } // drawFaceIndicators

        }; // propsDynam

    } // constructor


    /**
     * Рисует стрелку в зависимости от текущего значения
     */
    #redrawPointer(valuePointer = 0) {

        let pointerAngle = 0;

        // Перерисовывает циферблат
        this.propsAppl.drawInnerFace();

        this.context.save();

        this.propsAppl.rotateCanvas();

        this.propsDynam.drawFaceIndicators();

        this.context.restore();


        if (
            valuePointer > this.maxValue ||
            valuePointer < (this.maxValue * (-1))
        ) {

            Appliance.prototype.drawPointer.call(
                this,
                this.#maxValueAngle
            );

        }
        else {

            pointerAngle = 90 - ((valuePointer * 2) * this.propsDynam.getAngleJump());

            Appliance.prototype.drawPointer.call(
                this,
                pointerAngle
            );

        }

    } // #redrawPointer


    /**
     * Рисует короткую или длинную линию индикатора
     */
    #drawFaceLine(angle, isLongLine) {

        this.context.beginPath();

        let shortLineH = this.radius * 0.04;
        let longLineH = this.radius * 0.08;

        let lineHeight = isLongLine ? longLineH : shortLineH;

        let coord = this.propsAppl.coordCalc(angle, lineHeight);

        this.context.fillStyle = "black";

        this.context.moveTo(
            coord.x1_out,
            coord.y1_out
        );

        this.context.lineWidth = this.propsAppl.getFaceLineWidth();

        this.context.lineTo(
            coord.x2_out,
            coord.y2_out
        );

        this.context.stroke();

    } // #drawFaceLine


    /**
     * Получает число для рисования на циферблате динамометра
     */
    #getDrawFaceNumber(
        currentAngle,
        arcNumber,
        text
    ) {

        let isOddMaxValue = this.maxValue % 2;

        // определяет максимальный текст
        let maxTextCondition =
            !isOddMaxValue
                ? (3 * this.propsDynam.getMidMaxValue()) - 1
                : (3 * this.propsDynam.getMidMaxValue() + 1);

        // первая четверть
        let firstQuarterCondition =
            !isOddMaxValue
                ? arcNumber <=
                  this.propsDynam.getMidMaxValue() - 1
                : arcNumber <=
                  this.propsDynam.getMidMaxValue();

        // вторая половина
        let secondHalfCondition =
            !isOddMaxValue
                ? arcNumber >
                      this.propsDynam.getMidMaxValue() - 1 &&
                  arcNumber <= maxTextCondition
                : arcNumber >
                      this.propsDynam.getMidMaxValue() &&
                  arcNumber <= maxTextCondition;

        // четвертая четверть
        let fourthQuarterCondition = arcNumber > maxTextCondition;

        let isMaxValueReached = arcNumber == maxTextCondition;


        if (
            arcNumber >= 0 &&
            firstQuarterCondition
        ) {

            text--;

        }


        if (secondHalfCondition) {

            text++;

        }


        if (fourthQuarterCondition) {

            text--;

        }


        if (isMaxValueReached) {

            this.#maxValueAngle = currentAngle;

        }

        return text;

    } // #getDrawFaceNumber


    /**
     * Рисует весь динамометр
     */
    draw() {

        super.draw();

        this.context.save();

        this.propsAppl.rotateCanvas();

        let indicators = this.propsDynam.drawFaceIndicators.bind(this);

        indicators();

        this.context.restore();

    } // draw


    /**
     * Устанавливает стрелку индикатора на значение без анимации
     */
    setStaticValue(valuePointer = 0) {

        this.#redrawPointer(valuePointer);

        this.value = valuePointer;

        this.valueOnChange(valuePointer);

    } // setStaticValue


    /**
     * Устанавливает стрелку индикатора на значение с анимацией
     */
    setValue(valuePointer = 0) {

        this.stopAnimation();
        this.#running = true;

        const rotateSpeed = this.propsDynam.getRotateStep();

        let currentValue = this.value;


        // Ограничиваем начальное значение диапазоном динамометра
        if (currentValue > this.maxValue) {
            currentValue = this.maxValue;
        }

        if (currentValue < -this.maxValue) {
            currentValue = -this.maxValue;
        }


        const startValue = currentValue;

        const maxDistance = Math.abs(valuePointer - startValue);

        const minSpeed = 0.15;

        let previousTime = null;


        return new Promise((resolve) => {

            const tick = (currentTime) => {

                if (!this.#running) {
                    return;
                }

                const elapsed = Application.getDeltaTime(previousTime, currentTime);

                previousTime = elapsed.previousTime;

                const deltaTime = elapsed.deltaTime;


                const distance = Math.abs(valuePointer - currentValue);


                // насколько далеко от цели находится значение
                let factor = maxDistance === 0 ? 0 : distance / maxDistance;


                // не позволяем скорости стать слишком маленькой
                factor = Math.max(factor, minSpeed);


                // rotateSpeed соответствует одному кадру при 60 FPS
                const step = Application.getAnimationStep(rotateSpeed, deltaTime) * factor;


                // движение к цели
                if (currentValue < valuePointer) {

                    currentValue += step;

                    // не проскакиваем мимо цели
                    if (currentValue >= valuePointer) {
                        currentValue = valuePointer;
                    }

                }
                else if (currentValue > valuePointer) {

                    currentValue -= step;

                    // не проскакиваем мимо цели
                    if (currentValue <= valuePointer) {
                        currentValue = valuePointer;
                    }

                }


                // перерисовываем динамометр
                this.#redrawPointer(currentValue);

                // сохраняем текущее значение
                this.value = currentValue;


                // достигли цели
                if (currentValue === valuePointer) {

                    this.#running = false;
                    this.valueOnChange(valuePointer);

                    this.#animationFrame = null;

                    resolve();

                    return;
                }


                // следующий кадр
                this.#animationFrame = requestAnimationFrame(tick);

            };


            this.#animationFrame = requestAnimationFrame(tick);

        });

    } // setValue


    /**
     * Останавливает анимацию текущего значения
     */
    stopAnimation() {

        this.#running = false;

        if (this.#animationFrame !== null) {

            cancelAnimationFrame(
                this.#animationFrame
            );

            this.#animationFrame = null;

        }

    } // stopAnimation

} // Dynamometer