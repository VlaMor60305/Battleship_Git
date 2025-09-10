import { _decorator, Component, Vec3, Node, PhysicsSystem, PhysicsRayResult, geometry, Game } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;
const { Ray } = geometry;

@ccclass('WallDetector3D')
export class WallDetector3D extends Component {
    @property
    maxRayDistance: number = 10.0;

    @property
    raycastMask: number = 0xFFFFFFFF; // Все слои

    private readonly _startPos = new Vec3();
    private readonly _direction = new Vec3();
    private readonly _ray = new Ray(); // Переиспользуем один луч

    update(deltaTime: number) {
        if(GameManager.Instance.EndGame) return;
        this.node.getWorldPosition(this._startPos);

        // Проверяем оба направления: вправо и влево
        const directions = [Vec3.RIGHT, new Vec3(-1, 0, 0)]; // [вправо, влево]

        for (const dir of directions) {
            // Получаем мировое направление
            Vec3.transformQuat(this._direction, dir, this.node.worldRotation);
            Vec3.normalize(this._direction, this._direction);

            // Настраиваем луч
            Vec3.copy(this._ray.o, this._startPos);
            Vec3.copy(this._ray.d, this._direction);

            // Запускаем raycast
            const hit = PhysicsSystem.instance.raycast(
                this._ray,
                this.raycastMask,
                this.maxRayDistance
            );

            if (hit && PhysicsSystem.instance.raycastResults.length > 0) {
                const firstHit = PhysicsSystem.instance.raycastResults[0];
                const distance = Vec3.distance(this._startPos, firstHit.hitPoint);

                //console.log(`${dir === Vec3.RIGHT ? 'Вправо' : 'Влево'} стена найдена: ${distance.toFixed(2)} м`);

                if (distance < 0.3) {
                    GameManager.Instance.FailShip();
                    return; // Чтобы не вызывать несколько раз
                }
            } else {
                //console.log(`${dir === Vec3.RIGHT ? 'Вправо' : 'Влево'} стена не найдена`);
            }
        }
    }
}