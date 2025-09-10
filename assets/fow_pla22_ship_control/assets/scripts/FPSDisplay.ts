import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FPSDisplay')
export class FPSDisplay extends Component {
    @property({ type: Label })
    label: Label | null = null;

    @property
    updateInterval = 1.0; // Обновлять раз в секунду

    private frameCount = 0;
    private elapsedTime = 0;

    start() {
        if (!this.label) {
            console.warn('FPSDisplay: Label не назначен!');
            this.enabled = false;
            return;
        }

        this.label.string = 'FPS: 0';
    }

    update(dt: number) {
        this.frameCount++;
        this.elapsedTime += dt;

        if (this.elapsedTime >= this.updateInterval) {
            const fps = Math.round(this.frameCount / this.elapsedTime);
            this.label.string = `FPS: ${fps}`;


            this.frameCount = 0;
            this.elapsedTime = 0;
        }
    }
}

// Вспомогательный класс для цвета (если не хочешь импортировать весь cc.Color)
class Color3 {
    r: number;
    g: number;
    b: number;
    a = 255;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

}