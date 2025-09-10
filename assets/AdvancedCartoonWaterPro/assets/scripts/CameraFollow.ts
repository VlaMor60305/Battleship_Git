import { _decorator, Component, math, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component 
{
        @property(Node)
        pointsXoffset : Node[] = [];

        @property
        curPointOffset : Node;

        curPointIndex : number = 0;

        @property({type: Node})
        target: Node = null;
        @property({type: Vec3})
        offset: Vec3 = new Vec3();
        @property
        movmentSpeed: number = 10;
    
        @property
        isMoving : boolean = true;
    
        curOffset : Vec3 = new Vec3(0, 0, 0);

        start() 
        {
            this.curPointOffset = this.pointsXoffset[0];
        }
    
        update(deltaTime: number) 
        {
            if(!this.target || !this.isMoving)
                return;
            
            this.checkPointsOffset();

            this.curOffset = new Vec3(
                math.lerp(this.curOffset.x, this.curPointOffset.worldPosition.x, this.movmentSpeed / 30 * deltaTime) + this.offset.x, 
                this.offset.y, 
                this.offset.z);

            this.node.position = Vec3.lerp(
            new Vec3(), 
            this.node.position,  
            new Vec3(this.target.position).add(this.curOffset),           
            this.movmentSpeed * deltaTime 
            );
        }


        checkPointsOffset()
        {
            if(this.curPointIndex+1 < this.pointsXoffset.length)
            {
                if(this.node.worldPosition.z > this.pointsXoffset[this.curPointIndex].worldPosition.z && this.node.worldPosition.z < this.pointsXoffset[this.curPointIndex+1].worldPosition.z)
                {
                    this.curPointIndex++;
                    this.curPointOffset = this.pointsXoffset[this.curPointIndex];
                }
            }
        }
}


