import { _decorator, Component, Vec3, Quat, Node, math } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LookAtTarget')
export class LookAtTarget extends Component {
    @property({ type: Node })
    target: Node = null; // Целевая нода для поворота


    @property
    rotationSpeed: number = 60;

    update(deltaTime: number) 
    {
        const direction = new Vec3();
        Vec3.subtract(direction, this.target.worldPosition, this.node.position);
        
        if (direction.lengthSqr() > 0.01) 
        {
            direction.normalize();
            
            const angle = Math.atan2(direction.x, direction.z);
            
            const targetQuat = new Quat();
            Quat.fromAxisAngle(targetQuat, Vec3.UP, angle);
            
            const currentQuat = this.node.getRotation();
            const resultQuat = new Quat();
            const rotationStep = math.clamp(this.rotationSpeed * deltaTime, 0, 1);
            Quat.slerp(
                resultQuat, 
                currentQuat, 
                targetQuat, 
                rotationStep
            );
            
            this.node.setRotation(resultQuat);
        }
    }

    setTarget(newPoint: Node)
    {
        this.target = newPoint;
    }
}
