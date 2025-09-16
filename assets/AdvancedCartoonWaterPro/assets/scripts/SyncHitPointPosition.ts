import { _decorator, Component, math, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SyncHitPointPosition')
export class SyncHitPointPosition extends Component {
    @property(Node)
    nodeTarget : Node;

    private initialPos : Vec3;    

    @property
    minZOffset : number = 0;

    @property
    maxZOffset : number = 0;

    start() {
        this.initialPos = this.node.worldPosition.clone();
    }

    update(deltaTime: number) {
        if(this.minZOffset == 0 && this.maxZOffset == 0)
        {
            this.node.worldPosition = new Vec3(this.initialPos.x, this.initialPos.y, this.nodeTarget.worldPosition.z);    
        }
        else
        {
            this.node.worldPosition = new Vec3(this.initialPos.x, this.initialPos.y, math.clamp(this.nodeTarget.worldPosition.z, this.minZOffset, this.maxZOffset));  
        }
    }
}


