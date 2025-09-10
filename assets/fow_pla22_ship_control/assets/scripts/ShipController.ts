import { _decorator, Component, Node, input, Input, EventMouse, Vec3, view, EventTouch, Camera, math, geometry, PhysicsSystem } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ShipController')
export class ShipController extends Component {
    // --- Визуальная модель (поворот + крен) ---
    @property({ type: Node })
    private shipModel: Node | null = null;

    // --- Настройки ---
    @property
    private turnSpeed: number = 6.0;
    @property
    private rollAngle: number = 15;
    @property
    private rollResponse: number = 3.0;
    @property
    private moveSpeed: number = 6.0;
    @property
    private driftResponse: number = 3.0;

    // --- Камера ---
    @property({ type: Camera })
    private gameCamera: Camera | null = null;
    @property
    private cameraFollowSpeed: number = 4.0;
    @property
    private cameraHeight: number = 8.0;
    @property
    private minCameraDistance: number = 8.0;
    @property
    private maxCameraDistance: number = 18.0;
    @property
    private cameraCollisionOffset: number = 1.0;
    @property
    private cameraWallResponse: number = 5.0;
    @property
    private cameraTurnFactor: number = 0.6;

    // --- Доп. настройки ---
    @property
    private maxYawRate: number = 50;

    @property({ type: Node })
    private Tutor: Node | null = null;

    // --- Внутренние переменные ---
    private isDragging = false;
    private dragStartX = 0;
    private targetModelYaw = 0;
    private targetModelYawSmooth = 0;
    private currentModelYaw = 0;
    private targetRoll = 0;
    private currentRoll = 0;
    private lateralVelocity: number = 0;
    private FlagTutor: boolean = true;
    private currentCameraDistance: number = 18.0;

    start() {
        if (!this.gameCamera) {
            this.gameCamera = this.node.scene.getComponentInChildren(Camera);
        }
        if (!this.shipModel) {
            console.warn("ShipModel not assigned. Using root node.");
            this.shipModel = this.node;
        }
        this.currentCameraDistance = this.maxCameraDistance;
    }

    onLoad() {
        input.on(Input.EventType.MOUSE_DOWN, this.onTouchStart, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.onTouchStart, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchStart(event: EventMouse | EventTouch) {
        if (this.FlagTutor && this.Tutor.active) {
            this.FlagTutor = false;
            if (this.Tutor) this.Tutor.active = false;
        }
        this.isDragging = true;
        this.dragStartX = event.getLocationX();
    }

    private onTouchMove(event: EventMouse | EventTouch) {
        if (this.FlagTutor && this.Tutor.active)  return;
        if (!this.isDragging) return;
        const x = event.getLocationX();
        const width = view.getVisibleSize().width;
        const deltaX = x - this.dragStartX;
        const ratio = deltaX / width;
        this.targetModelYaw = math.clamp(-ratio * 40, -40, 40);
    }

    private onTouchEnd() {
        this.isDragging = false;
    }

    update(deltaTime: number) {
        if (this.FlagTutor) return;
        const maxAllowedYaw = 15;

        // 1. Плавное изменение целевого поворота
        const maxDelta = this.maxYawRate * deltaTime;
        const diff = this.targetModelYaw - this.targetModelYawSmooth;
        const clampedDiff = math.clamp(diff, -maxDelta, maxDelta);
        this.targetModelYawSmooth += clampedDiff;

        // 2. Визуальный поворот модели
        const turnFactor = this.isDragging ? 6.0 : 5.0;
        this.currentModelYaw = math.lerp(this.currentModelYaw, this.targetModelYawSmooth, turnFactor * deltaTime);
        this.currentModelYaw = math.clamp(this.currentModelYaw, -maxAllowedYaw, maxAllowedYaw);

        // 3. Расчет крена
        this.targetRoll = -this.currentModelYaw * (this.rollAngle / 15);
        this.currentRoll = math.lerp(this.currentRoll, this.targetRoll, this.rollResponse * deltaTime);

        // 4. Применение поворота модели
        if (this.shipModel) {
            this.shipModel.eulerAngles = new Vec3(0, this.currentModelYaw, this.currentRoll);
        }

        // 5. Поворот корневого узла
        this.node.eulerAngles = new Vec3(0, this.currentModelYaw, 0);

        // 6. Движение вперед
        const forward = this.node.forward.clone();
        forward.multiplyScalar(-this.moveSpeed * deltaTime);
        let newPos = this.node.position.clone();
        newPos.add(forward);

        // 7. Боковой дрифт
        const targetLateralVelocity = this.currentModelYaw * (this.moveSpeed / 30);
        this.lateralVelocity = math.lerp(this.lateralVelocity, targetLateralVelocity, this.driftResponse * deltaTime);
        const right = this.node.right.clone();
        right.multiplyScalar(this.lateralVelocity * deltaTime);
        newPos.add(right);

        this.node.setPosition(newPos);

        // 8. Обновление камеры
        this.updateCamera(deltaTime);
    }

    private updateCamera(deltaTime: number) {
        if (!this.gameCamera) return;
        const camNode = this.gameCamera.node;
        const shipPos = this.node.position;

        // Проверка коллизий для камеры
        const ray = new geometry.Ray();
        ray.o = shipPos;
        ray.d = new Vec3(0, this.cameraHeight, -1).normalize();

        let targetDistance = this.maxCameraDistance;
        const maxDistance = this.maxCameraDistance;

        // Проверка коллизий с препятствиями
        if (PhysicsSystem.instance.raycastClosest(ray, 0xffffffff, maxDistance)) {
            const hitResult = PhysicsSystem.instance.raycastClosestResult;
            if (hitResult.collider) {
                const hitDist = Vec3.distance(shipPos, hitResult.hitPoint);
                targetDistance = math.clamp(
                    hitDist - this.cameraCollisionOffset,
                    this.minCameraDistance,
                    this.maxCameraDistance
                );
            }
        }

        // Плавное изменение дистанции камеры
        this.currentCameraDistance = math.lerp(
            this.currentCameraDistance,
            targetDistance,
            this.cameraWallResponse * deltaTime
        );

        // Целевая позиция камеры
        const targetPos = new Vec3(
            shipPos.x,
            shipPos.y + this.cameraHeight,
            shipPos.z - this.currentCameraDistance
        );

        // Плавное перемещение камеры
        camNode.position = new Vec3(
            math.lerp(camNode.position.x, targetPos.x, this.cameraFollowSpeed * deltaTime),
            math.lerp(camNode.position.y, targetPos.y, this.cameraFollowSpeed * deltaTime),
            math.lerp(camNode.position.z, targetPos.z, this.cameraFollowSpeed * deltaTime)
        );

        // Поворот камеры
        const targetCamYaw = this.currentModelYaw * this.cameraTurnFactor;
        const currentEuler = camNode.eulerAngles;
        camNode.eulerAngles = new Vec3(
            currentEuler.x,
            math.lerp(currentEuler.y, targetCamYaw, this.cameraFollowSpeed * deltaTime),
            currentEuler.z
        );

        // Камера смотрит на корабль
        const lookTarget = new Vec3(shipPos.x, shipPos.y + 1.0, shipPos.z);
        camNode.lookAt(lookTarget, Vec3.UP);
    }
}