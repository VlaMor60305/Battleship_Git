import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SyncHitPointPosition')
export class SyncHitPointPosition extends Component {
    @property(Node)
    nodeTarget : Node;

    private initialPos : Vec3;    

    start() {
        this.initialPos = this.node.worldPosition.clone();
    }

    update(deltaTime: number) {
        this.node.worldPosition = new Vec3(this.initialPos.x, this.initialPos.y, this.nodeTarget.worldPosition.z);    
    }
}


