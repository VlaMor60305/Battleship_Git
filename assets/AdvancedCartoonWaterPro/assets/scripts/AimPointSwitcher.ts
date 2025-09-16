import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { CameraOrbitClamp } from './CameraOrbitClamp';
const { ccclass, property } = _decorator;

@ccclass('AimPointSwitcher')
export class AimPointSwitcher extends Component 
{
    @property(CameraOrbitClamp)
    aimCameraController : CameraOrbitClamp;

    @property(Sprite)
    aimSprite : Sprite;

    @property(SpriteFrame)
    noEnemy : SpriteFrame;

    @property(SpriteFrame)
    seeEnemy : SpriteFrame;

    start() {

    }

    update(deltaTime: number) 
    {
        this.aimSprite.spriteFrame = this.aimCameraController.isWithinTargetBounds() ? this.seeEnemy : this.noEnemy;     
    }
}


