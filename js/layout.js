/**
 * Сворачивание и разворачивание боковых панелей.
 */
export class Layout {

    static SMALL_SCREEN = "(max-width: 900px), (orientation: portrait) and (max-width: 1024px)";

    static init(onLayoutChange) {
        new Layout(onLayoutChange);
    }

    constructor(onLayoutChange) {
        this.shell = document.querySelector(".grid-container");
        this.menuButton = document.getElementById("menuToggle");
        this.panelButton = document.getElementById("panelToggle");
        this.onLayoutChange = onLayoutChange;

        this.bindToggle(this.menuButton, "menu-collapsed");
        this.bindToggle(this.panelButton, "controls-collapsed");
        this.collapseParametersOnSmallScreens();

        window.addEventListener("resize", this.onLayoutChange);
    }

    bindToggle(button, collapsedClass) {
        button.addEventListener("click", () => {
            this.shell.classList.toggle(collapsedClass);
            this.onLayoutChange();
        });
    }

    collapseParametersOnSmallScreens() {
        const isSmallScreen = window.matchMedia(Layout.SMALL_SCREEN).matches;

        if (!isSmallScreen) {
            return;
        }

        this.shell.classList.add("controls-collapsed");
        this.onLayoutChange();
    }
}
