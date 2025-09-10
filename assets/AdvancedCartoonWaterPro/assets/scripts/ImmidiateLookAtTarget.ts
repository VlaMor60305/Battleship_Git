import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ImmidiateLookAtTarget')
export class ImmidiateLookAtTarget extends Component {

    @property(Node)
    target : Node;

    update(deltaTime: number) 
    {
        if(this.target != null)
        {
            this.node.lookAt(this.target.worldPosition);    
        }    
    }   
}


