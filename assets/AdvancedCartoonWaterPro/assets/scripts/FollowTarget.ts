import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FollowTarget')
export class FollowTarget extends Component 
{
    @property({type: Node})
    target: Node = null;
    @property({type: Vec3})
    offset: Vec3 = new Vec3();
    @property
    movmentSpeed: number = 10;

    isMoving : boolean = true;

    start() 
    {

    }

    update(deltaTime: number) 
    {
        if(!this.target || !this.isMoving)
            return;

        

        this.node.position = Vec3.lerp(
        new Vec3(), 
        this.node.position,  
        new Vec3(this.target.position).add(this.offset),           
        this.movmentSpeed * deltaTime 
        );
    }
}


