import { _decorator, Component, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BlinkEffect')
export class BlinkEffect extends Component {

    @property(Sprite)
    targetSprite: Sprite = null!;

    @property
    blinkDuration: number = 1.0;

    private isBlinking: boolean = false;
    private blinkProgress: number = 0;
    private blinkDirection: number = 1;

    update(deltaTime: number) {
        if (!this.isBlinking || !this.targetSprite) return;

        this.blinkProgress += deltaTime * this.blinkDirection;

        if (this.blinkProgress >= this.blinkDuration) {
            this.blinkProgress = this.blinkDuration;
            this.blinkDirection = -1;
        } else if (this.blinkProgress <= 0) {
            this.blinkProgress = 0;
            this.blinkDirection = 1;
            this.isBlinking = false;
        }

        this.updateColor();
    }

    private updateColor() {
        const progress = this.blinkProgress / this.blinkDuration;
        const redValue = Math.floor(125 * progress);
        const alphaValue = Math.floor(125 * progress);

        const currentColor = this.targetSprite.color;
        this.targetSprite.color = new Color(redValue, 0, 0, alphaValue);
    }

    public startBlink() {
        if (this.blinkDirection && this.blinkDirection > 0) {
            this.blinkDuration = this.blinkDirection;
        }

        this.isBlinking = true;
        this.blinkProgress = 0;
        this.blinkDirection = 1;
    } 

    public stopBlink() {
        this.isBlinking = false;
        this.blinkProgress = 0;
        
        if (this.targetSprite) {
            this.targetSprite.color = new Color(0, 0, 0, 0);
        }
    }
}