import { _decorator, Component, Node, Button,Animation, find, RichText, Sprite } from 'cc';
import { CannonSystem } from './CannonSystem';
import { CameraTriggerController } from './CameraTriggerController'; // Убедись, что путь верный
import { ShipController } from './ShipController';                 // Убедись, что путь верный

const { ccclass, property } = _decorator;

export enum GameMode {
    SHIP_CONTROL,
    CANNON_MODE
}

@ccclass('GameManager')
export class GameManager extends Component {
    public static Instance: GameManager | null = null;

    private _currentMode: GameMode = GameMode.SHIP_CONTROL;
    private _cannonSystem: CannonSystem | null = null;
    private RedAmin : boolean = false;
    public EndGame : boolean = false;
    @property({ type: Node })
    fireNode: Node | null = null;

    @property({ type: Animation })
    Fail: Animation | null = null;

    @property({ type: Animation })
    Red: Animation | null = null;

    @property({ type: Sprite })
    Hp: Sprite | null = null;

    // Ссылки на узлы, где висят контроллеры
    @property({ type: Node })
    cameraControllerNode: Node | null = null; // Узел с CameraTriggerController

    @property({ type: Node })
    shipControllerNode: Node | null = null;   // Узел с ShipController

    
    @property({ type: Node })
    inst: Node | null = null;
    
    onLoad() {
        if (GameManager.Instance === null) {
            GameManager.Instance = this;
        } else {
            this.destroy();
            return;
        }

        // Скрываем кнопки в начале
        if (this.fireNode) this.fireNode.active = false;

        // Убеждаемся, что скрипты изначально в правильном состоянии
        //this.updateModeState();
    }

    get currentMode(): GameMode {
        return this._currentMode;
    }

    switchToCannonMode() {
        this._currentMode = GameMode.CANNON_MODE;
        this.updateModeState();
    }

    switchToShipControl() {
        this._currentMode = GameMode.SHIP_CONTROL;
        this.updateModeState();
        this.shipControllerNode.getComponent(Animation).stop();
    }
    switchToEnd() {
        this.EndGame = true;
        const shipController = this.shipControllerNode?.getComponent(ShipController);
        const cameraController = this.cameraControllerNode?.getComponent(CameraTriggerController);
        shipController.enabled = false;
        cameraController.deactivateCameraMode();
    }
    registerCannonSystem(system: CannonSystem) {
        this._cannonSystem = system;
    }
    FailShip(){
        if(!this.RedAmin){
            this.RedAmin = true;
            this.Hp.fillRange-=0.05;
            if(this.Hp.fillRange <= 0) {GameManager.Instance.switchToEnd(); this.Fail.play(); this.inst.active=false;}
            this.Red.play();
            this.scheduleOnce(()=>{this.RedAmin = false;},0.3);
        }
    }
    private updateModeState() {
        const isCannonMode = this._currentMode === GameMode.CANNON_MODE;

        // Активируем/деактивируем кнопки
        if (this.fireNode) this.fireNode.active = isCannonMode;

        // Получаем компоненты
        const cameraController = this.cameraControllerNode?.getComponent(CameraTriggerController);
        const shipController = this.shipControllerNode?.getComponent(ShipController);

        if (cameraController) {
            cameraController.enabled = isCannonMode; // Включаем в режиме пушки
        }

        if (shipController) {
            shipController.enabled = !isCannonMode; // Включаем в режиме корабля
        }
    }

    onFireButtonClicked() {
        if (this._currentMode === GameMode.CANNON_MODE && this._cannonSystem) {
            this._cannonSystem.fire();
        }
    }
}