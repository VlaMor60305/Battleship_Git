import { _decorator, Component, Animation, Vec3, ParticleSystem, math,Node } from 'cc';
import { GameManager } from './GameManager';
import { SoundManager } from './SoundManager';
const { ccclass, property } = _decorator;

@ccclass('CameraAnimationController')
export class CameraAnimationController extends Component {
    @property({ type: Animation })
    cameraAnimation: Animation | null = null;
    @property({ type: Animation })
    Red: Animation | null = null;

    
    @property({ type: Node })
    tutor: Node | null = null;
    @property({ type: Node })
    glow1: Node | null = null;
    @property({ type: Node })
    glow2: Node | null = null;
    @property({ type: Node })
    glow3: Node | null = null;

    private isPlaying = false;

    start() {
        if (this.cameraAnimation) {
            this.cameraAnimation.on(Animation.EventType.FINISHED, this.onAnimationFinished, this);
            this.scheduleOnce(()=>{this.glow1.active = true; this.Red.play();
                this.scheduleOnce(()=>{this.glow2.active = true; this.Red.play();
                    this.scheduleOnce(()=>{this.glow3.active = true; this.Red.play();
                    },0.3);
                },0.3);
            },0.3);
            //SoundManager.instance.playFire();
            this.playAnimationAndParticles();
        }
    }

    playAnimationAndParticles() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;

        if (this.cameraAnimation) {
            this.cameraAnimation.play();
        }

    }


    private onAnimationFinished() {
        this.tutor.active =true;
            this.glow1.active = false;
            this.glow2.active = false;
            this.glow3.active = false;
        GameManager.Instance.switchToShipControl();
    }

   

    onDestroy() {
        if (this.cameraAnimation) {
            this.cameraAnimation.off(Animation.EventType.FINISHED, this.onAnimationFinished, this);
        }
    }
}