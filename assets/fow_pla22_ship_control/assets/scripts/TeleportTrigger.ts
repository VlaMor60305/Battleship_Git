import { _decorator, Component, Node, ITriggerEvent, Vec3, Camera, Collider, Quat, math, Animation } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('TeleportTrigger')
export class TeleportTrigger extends Component {

    // --- Настройки телепортации ---
    @property({ tooltip: "Позиция, куда переместится корабль" })
    private targetShipPosition: Vec3 = new Vec3(0, 0, 0);

    @property({ tooltip: "Позиция камеры после телепортации" })
    private targetCameraPosition: Vec3 = new Vec3(0, 5, -10);

    @property({ tooltip: "Вращение камеры после телепортации" })
    private targetCameraRotation: Vec3 = new Vec3(0, 0, 0);

    @property({ type: Node, tooltip: "Корабль, который будет телепортирован" })
    private ship: Node | null = null;

    @property({ type: Camera, tooltip: "Камера, которую нужно переместить" })
    private camera: Camera | null = null;

    @property({ type: Node })
    private Hel1: Node | null = null;

    @property({ type: Node })
    private Hel2: Node | null = null;

    @property({ type: Node })
    private Button: Node | null = null;

    @property({ type: Node })
    private VetrAnim: Node | null = null;

    @property({ tooltip: "Длительность анимации перемещения (секунды)" })
    private animationDuration: number = 2.0;

    @property({ type: Animation })
    Red: Animation | null = null;

    private isAnimating = false;
    private animationProgress = 0;

    // Начальные позиции для интерполяции
    private initialShipPosition = new Vec3();
    private initialCameraPosition = new Vec3();
    private initialCameraRotation = new Quat();

    protected onEnable() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    protected onDisable() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.off('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    update(deltaTime: number) {
        if (!this.isAnimating) return;
        
        this.animationProgress += deltaTime / this.animationDuration;
        
        if (this.animationProgress >= 1) {
            // Завершаем анимацию
            this.animationProgress = 1;
            this.isAnimating = false;
            
            // Устанавливаем точные финальные позиции
            if (this.ship) {
                this.ship.setPosition(this.targetShipPosition);
            }
            
            if (this.camera) {
                this.camera.node.setPosition(this.targetCameraPosition);
                
                // Устанавливаем точное финальное вращение
                const finalQuat = new Quat();
                Quat.fromEuler(finalQuat, 
                    this.targetCameraRotation.x,
                    this.targetCameraRotation.y,
                    this.targetCameraRotation.z
                );
                this.camera.node.setRotation(finalQuat);
            }
            
            // Включаем объекты
            this.enableObjects();
        } else {
            // Интерполяция позиции корабля
            if (this.ship) {
                const shipPos = new Vec3();
                Vec3.lerp(shipPos, this.initialShipPosition, this.targetShipPosition, this.animationProgress);
                this.ship.setPosition(shipPos);
            }
            
            // Интерполяция позиции и вращения камеры
            if (this.camera) {
                const cameraPos = new Vec3();
                Vec3.lerp(cameraPos, this.initialCameraPosition, this.targetCameraPosition, this.animationProgress);
                this.camera.node.setPosition(cameraPos);
                
                // Интерполяция вращения
                const targetQuat = new Quat();
                Quat.fromEuler(targetQuat, 
                    this.targetCameraRotation.x,
                    this.targetCameraRotation.y,
                    this.targetCameraRotation.z
                );
                
                const currentRot = new Quat();
                Quat.slerp(currentRot, this.initialCameraRotation, targetQuat, this.animationProgress);
                this.camera.node.setRotation(currentRot);
            }
        }
    }

    private onTriggerEnter(event: ITriggerEvent) {
        if (this.isAnimating) return;
        
        const otherNode = event.otherCollider.node;
        if (!this.isShip(otherNode)) return;
        this.scheduleOnce(()=>{otherNode.getComponent(Animation).play();},1);
        this.startAnimation();
        GameManager.Instance.switchToEnd();
    }

    private isShip(node: Node): boolean {
        if (this.ship) {
            return node === this.ship;
        }
        return true;
    }

    private startAnimation() {
        this.isAnimating = true;
        this.animationProgress = 0;
        
        const collider = this.getComponent(Collider);
        if (collider) collider.enabled = false;

        // Сохраняем начальные позиции
        if (this.ship) {
            Vec3.copy(this.initialShipPosition, this.ship.position);
        }
        
        if (this.camera) {
            Vec3.copy(this.initialCameraPosition, this.camera.node.position);
            this.camera.node.getRotation(this.initialCameraRotation);
        }
        
        // Сразу скрываем объекты
        if (this.Hel1) this.Hel1.active = false;
        if (this.Hel2) this.Hel2.active = false;
        if (this.Button) this.Button.active = false;
    }

    private enableObjects() {
        if (this.Hel1) this.Hel1.active = true;
        if (this.Hel2) this.Hel2.active = true;
        this.VetrAnim.getComponent(Animation).play();
        this.scheduleOnce(()=>{this.Red.play();
                this.scheduleOnce(()=>{this.Red.play();
                    this.scheduleOnce(()=>{this.Red.play();
                    },0.5);
                },0.5);
            },0.5);
        if (this.Button) this.scheduleOnce(()=>{this.Button.active = true},2);
    }
}