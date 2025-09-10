import { _decorator, Component, Node, Vec3, Quat, input, Input, EventMouse, math, Collider, ITriggerEvent, Camera, EventTouch, Vec2, Animation, AnimationManager, animation } from 'cc';
const { ccclass, property } = _decorator;
import { GameManager } from './GameManager';
import { SoundManager } from './SoundManager';

@ccclass('CameraTriggerController')
export class CameraTriggerController extends Component {
    @property({ type: Camera })
    mainCamera: Camera | null = null;
    
    @property
    cameraPosition = new Vec3(-4.892, 0.632, 41.383);
    
    @property
    cameraRotation = new Vec3(-9.235, 86.287, 0);
    
    @property
    minVerticalAngle = -15;
    
    @property
    maxVerticalAngle = 15;
    
    @property
    rotationSpeed = 1.0;
    
    @property({ type: Node })
    Turel: Node | null = null;

    @property
    minHorizontalAngle = -60;
    
    @property
    maxHorizontalAngle = 60;
    
    @property
    turelFollowSpeed = 0.1;

    @property
    transitionDuration: number = 2.0;

    public isCameraMode = false;
    private currentRotation = new Vec3();
    private targetRotation = new Vec3();
    private rotationVelocity = new Vec3();
    private isDragging = false;
    private lastMousePos = new Vec2();
    private turelRotation = new Vec3();
    
    private isTransitioning: boolean = false;
    private transitionProgress: number = 0;
    private initialCameraPos: Vec3 = new Vec3();
    private initialCameraRot: Quat = new Quat();
    private initialShipPos: Vec3 = new Vec3();
    private initialShipRot: Quat = new Quat();

    onLoad() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }

        Vec3.copy(this.currentRotation, this.cameraRotation);
        Vec3.copy(this.targetRotation, this.cameraRotation);
        this.rotationVelocity.set(0, 0, 0);
        Vec3.copy(this.turelRotation, this.cameraRotation);
    }

    private onTriggerEnter(event: ITriggerEvent) {
        if (this.isCameraMode || this.isTransitioning || !this.mainCamera) return;
        this.activateCameraMode();
    }

    private activateCameraMode() {
        SoundManager.instance.playBell();
        this.isTransitioning = true;
        this.transitionProgress = 0;

        // Сохраняем начальные трансформы
        Vec3.copy(this.initialCameraPos, this.mainCamera!.node.position);
        this.mainCamera!.node.getRotation(this.initialCameraRot);
        Vec3.copy(this.initialShipPos, this.node.position);
        this.node.getRotation(this.initialShipRot);


        if (GameManager.Instance) {
            GameManager.Instance.switchToCannonMode();
        }
    }

    private setupCameraControls() {
        this.node.getComponent(Animation).play();
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private onMouseDown(event: EventMouse) {
        if (!this.isCameraMode) return;
        this.isDragging = true;
        this.lastMousePos.set(event.getLocationX(), event.getLocationY());
    }

    private onMouseMove(event: EventMouse) {
        if (!this.isDragging || !this.isCameraMode || !this.mainCamera) return;
        this.handleRotation(event.getLocationX(), event.getLocationY());
    }

    private onMouseUp() {
        this.isDragging = false;
    }

    private onTouchStart(event: EventTouch) {
        if (!this.isCameraMode) return;  
        this.isDragging = true;
        const touch = event.touch!;
        this.lastMousePos.set(touch.getLocationX(), touch.getLocationY());
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isDragging || !this.isCameraMode || !this.mainCamera) return;
        const touch = event.touch!;
        this.handleRotation(touch.getLocationX(), touch.getLocationY());
    }

    private onTouchEnd() {
        this.isDragging = false;
    }

    private handleRotation(currentX: number, currentY: number) {
        const deltaX = currentX - this.lastMousePos.x;
        const deltaY = currentY - this.lastMousePos.y;
    
        this.lastMousePos.set(currentX, currentY);
    
        this.targetRotation.y -= deltaX * this.rotationSpeed;
    
        this.targetRotation.x = math.clamp(
            this.targetRotation.x + deltaY * this.rotationSpeed,
            this.minVerticalAngle,
            this.maxVerticalAngle
        );
    
        const baseY = this.cameraRotation.y;
        this.targetRotation.y = math.clamp(
            this.targetRotation.y,
            baseY + this.minHorizontalAngle,
            baseY + this.maxHorizontalAngle
        );
    }

    update(dt: number) {
        // Обработка плавного перехода
        if (this.isTransitioning) {
            this.transitionProgress += dt / this.transitionDuration;
            
            if (this.transitionProgress >= 1) {
                // Завершение перехода
                this.transitionProgress = 1;
                this.isTransitioning = false;
                this.isCameraMode = true;
                
                // Точная установка финальных трансформ
                this.mainCamera!.node.setPosition(this.cameraPosition);
                this.node.setPosition(new Vec3(-6, 0, 40));
                this.node.setRotation(Quat.IDENTITY); // Нулевое вращение
                
                // Установка вращения камеры
                const finalQuat = new Quat();
                Quat.fromEuler(finalQuat, 
                    this.cameraRotation.x,
                    this.cameraRotation.y,
                    this.cameraRotation.z
                );
                this.mainCamera!.node.setRotation(finalQuat);
                
                // Инициализация вращения
                Vec3.copy(this.currentRotation, this.cameraRotation);
                Vec3.copy(this.targetRotation, this.cameraRotation);
                Vec3.copy(this.turelRotation, this.cameraRotation);
                
                // Включаем управление камерой
                this.setupCameraControls();
            } else {
                // Интерполяция позиции корабля
                const shipPos = new Vec3();
                Vec3.lerp(shipPos, this.initialShipPos, new Vec3(-6, 0, 40), this.transitionProgress);
                this.node.setPosition(shipPos);
                
                // Интерполяция вращения корабля к нулевому
                const currentShipRot = new Quat();
                Quat.slerp(currentShipRot, this.initialShipRot, Quat.IDENTITY, this.transitionProgress);
                this.node.setRotation(currentShipRot);
                
                // Интерполяция позиции камеры
                const cameraPos = new Vec3();
                Vec3.lerp(cameraPos, this.initialCameraPos, this.cameraPosition, this.transitionProgress);
                this.mainCamera!.node.setPosition(cameraPos);
                
                // Интерполяция вращения камеры
                const targetCameraQuat = new Quat();
                Quat.fromEuler(targetCameraQuat, 
                    this.cameraRotation.x,
                    this.cameraRotation.y,
                    this.cameraRotation.z
                );
                
                const currentCameraRot = new Quat();
                Quat.slerp(currentCameraRot, this.initialCameraRot, targetCameraQuat, this.transitionProgress);
                this.mainCamera!.node.setRotation(currentCameraRot);
            }
            return;
        }

        // Обработка режима камеры
        if (!this.isCameraMode || !this.mainCamera || !this.Turel) return;

        const current = this.currentRotation;
        const target = this.targetRotation;
        const velocity = this.rotationVelocity;

        // Обновление вращения камеры
        if (this.isDragging) {
            current.y = math.lerp(current.y, target.y, 0.2);
            velocity.y = 0;
        } else {
            const delta = target.y - current.y;
            velocity.y += delta * 20 * dt;
            velocity.y *= (1 - 0.12);
            current.y += velocity.y * dt;
            this.wrapAngle(current);
            this.wrapAngle(target);

            if (Math.abs(velocity.y) < 0.01 && Math.abs(current.y - target.y) < 0.1) {
                velocity.y = 0;
                current.y = target.y;
            }
        }

        // Вертикальное вращение
        current.x = math.lerp(current.x, target.x, 0.2);

        // Применение вращения камеры
        this.mainCamera.node.eulerAngles = new Vec3(current.x, current.y, 0);
        
        // Обновление вращения турели
        this.updateTurelRotation(dt);
    }

    private updateTurelRotation(dt: number) {
        if (!this.Turel) return;

        const targetY = this.currentRotation.y;
        let currentY = this.turelRotation.y;

        let angleDiff = targetY - currentY;
        if (angleDiff > 180) angleDiff -= 360;
        else if (angleDiff < -180) angleDiff += 360;

        const rotationStep = angleDiff * this.turelFollowSpeed * dt * 60;
        this.turelRotation.y += rotationStep;

        if (this.turelRotation.y > 360) this.turelRotation.y -= 360;
        else if (this.turelRotation.y < 0) this.turelRotation.y += 360;

        this.Turel.eulerAngles = new Vec3(0, this.turelRotation.y, 0);
    }

    private wrapAngle(v: Vec3) {
        while (v.y > 180) v.y -= 360;
        while (v.y < -180) v.y += 360;
    }

    public deactivateCameraMode() {
        this.isCameraMode = false;
        this.isTransitioning = false;

        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDestroy() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.off('onTriggerEnter', this.onTriggerEnter, this);
        }
        this.deactivateCameraMode();
    }
}