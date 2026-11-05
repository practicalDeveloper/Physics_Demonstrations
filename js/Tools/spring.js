import { Application, CanvasUtils } from "../appMethods.js";

/**
 * Нарисованный на холсте объект пружины
 */
export class Spring {
    constructor(options = {}) {
      // значения по умолчанию для пружины
        Object.assign(this, {
            canvas: null,
            ctx: null,
            swingFrontColor: "lightGray", //  цвет переднего витка 
            swingBackColor: "gray",//  цвет для симуляции заднего витка 
            startX: 0, // начальная координата X пружины 
            startY: 0,// начальная координата Y пружины 
            length: 100, // длина пружины
            radius: 50, // радиус синусоидальной волны 
            swings: 5, // количество витков
            angle: 0, // угол вращения относительно верхнего левого угла
            swingWidth: 3 // ширина каждого витка
        }, options);

    }

    draw() {
        const ctx = this.canvas.getContext("2d");

        ctx.save();
        ctx.lineCap = "round";

        CanvasUtils.rotateCanvas(
            ctx,
            this.startX,
            this.startY,
            this.angle
        );

        const swingLength = this.length / this.swings;

        // border
        this.#drawSinusWave(ctx, "black", this.swingWidth, true, swingLength);

        // задний виток
        this.#drawSinusWave(
            ctx,
            this.swingBackColor,
            this.swingWidth - 1,
            true,
            swingLength
        );

        // передний виток
        this.#drawSinusWave(
            ctx,
            this.swingFrontColor,
            this.swingWidth - 1,
            false,
            swingLength
        );

        ctx.restore();
    } //draw

    #drawSinusWave(ctx, color, width, fullWave, swingLength) {
        ctx.beginPath();

        ctx.lineWidth = width;
        ctx.strokeStyle = color;

        // drawing of each swing in cycle
        for (let currentSwing = 0; currentSwing < this.swings; currentSwing++) {

            const beginX = this.startX + currentSwing * swingLength;
            const endX = beginX + swingLength;

            const waveStepX = (endX - beginX) / 360;

            // drawing of particular swing
            for (let x = 0; x <= endX - beginX; x += waveStepX) {

                const angle = (1 / waveStepX) * x;

                const y = this.startY - Math.sin(x * Math.PI / 180 / waveStepX) * this.radius;

                if (fullWave) {
                    ctx.lineTo(beginX + x, y);
                } else {

                  // to draw wave only in the period between 90 and 270 degrees
                    if (angle > 90 && angle < 270) {
                        ctx.lineTo(beginX + x, y);
                    } else {
                        ctx.moveTo(beginX + x, y);
                    }
                }
            }
        }

        ctx.stroke();
    } // #drawSinusWave
    
} // Spring





