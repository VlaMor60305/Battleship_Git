import { _decorator, Component, RigidBody, Vec3, Collider, ITriggerEvent, PhysicsSystem, Animation } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('CannonBall')
export class CannonBall extends Component {
    @property
    lifeTime: number = 10.0;
    @property
    explosionForce: number = 10.0;
    @property
    explosionRadius: number = 5.0;
    
    private _timer: number = 0;
    
    onLoad() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTrigger, this);
        }
    }
    
    update(deltaTime: number) {
        this._timer += deltaTime;
        if (this._timer >= this.lifeTime) {
            this.node.destroy();
        }
    }
    
    private onTrigger(event: ITriggerEvent) {
        this.applyExplosionForce();
        console.log(event.otherCollider.node.name);
        if(event.otherCollider.node.name =="Enamy_Opt"){
            this.node.active= false;
            event.otherCollider.node.parent.getComponent(Animation).stop();
            event.otherCollider.getComponent(Animation).play();
            this.scheduleOnce(()=>{
            event.otherCollider.node.active = false;
            GameManager.Instance.switchToShipControl();
            this.node.destroy();},2);
        }

    }
    
private applyExplosionForce() {
    const explosionPos = this.node.worldPosition;
    const allNodes = this.node.scene.children; // или лучше — конкретный родитель
    const maxDistSq = this.explosionRadius * this.explosionRadius;

    // Рекурсивный обход всех узлов
    const checkNode = (node) => {
        const collider = node.getComponent(Collider);
        const rb = node.getComponent(RigidBody);

        if (collider && rb) {
            const distanceSq = Vec3.squaredDistance(node.worldPosition, explosionPos);
            if (distanceSq <= maxDistSq) {
                const dir = node.worldPosition.clone().subtract(explosionPos);
                const distance = Math.sqrt(distanceSq);

                if (distance > 0.01) {
                    dir.normalize();
                } else {
                    dir.set(1, 0, 0); // резервное направление
                }

                const force = dir.multiplyScalar(
                    this.explosionForce * (1 - distance / this.explosionRadius)
                );
                rb.applyForce(force, Vec3.ZERO);
            }
        }

        for (const child of node.children) {
            checkNode(child);
        }
    };

    checkNode(this.node.scene);
}
    
    onDestroy() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.off('onTriggerEnter', this.onTrigger, this);
        }
    }
}