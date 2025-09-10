import { _decorator, Component, Prefab, instantiate, Vec3, RigidBody, Camera, Node, ParticleSystem } from 'cc';
import { GameManager } from './GameManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

@ccclass('CannonSystem')
export class CannonSystem extends Component {
    @property({ type: Prefab })
    cannonBallPrefab: Prefab | null = null;

    @property({ type: Camera })
    camera: Camera | null = null;

    @property
    spawnDistance: number = 0.5; // Дистанция "впереди" камеры (в метрах)

    @property
    projectileSpeed: number = 30.0; // Скорость полёта снаряда

    @property
    fireRate: number = 0.3; // Выстрелы в секунду


    private _fireTimer: number = 0;

    onLoad() {
        if (GameManager.Instance) {
            GameManager.Instance.registerCannonSystem(this);
        }

        // Автопоиск главной камеры, если не указана
        if (!this.camera) {
            const scene = this.node.scene;
            const cameras = scene?.children.filter(n => n.getComponent(Camera));
            this.camera = cameras?.[0]?.getComponent(Camera) || null;
        }
    }

    update(deltaTime: number) {
        this._fireTimer += deltaTime;
    }

fire() {
    if (!this.cannonBallPrefab || this._fireTimer < this.fireRate) return;

    SoundManager.instance.PlayFireShip();
    const cameraNode = this.camera?.node;
    if (!cameraNode) {
        console.error("Camera node is missing!");
        return;
    }

    // Позиция: чуть впереди камеры
    const spawnPos = new Vec3();
    Vec3.add(
        spawnPos,
        cameraNode.worldPosition,
        Vec3.multiplyScalar(new Vec3(), cameraNode.forward, this.spawnDistance) // вперёд!
    );

    // Создаём снаряд
    const cannonBall = instantiate(this.cannonBallPrefab);
    this.node.addChild(cannonBall);
    cannonBall.setWorldPosition(spawnPos);

    // Скорость: в направлении взгляда камеры
    const velocity = new Vec3();
    Vec3.multiplyScalar(velocity, cameraNode.forward, this.projectileSpeed); // без минуса!

    const rb = cannonBall.getComponent(RigidBody);
    if (rb) {
        rb.setLinearVelocity(velocity);
    }

    this._fireTimer = 0;
}
}