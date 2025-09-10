import { _decorator, Component, Node, input, Input } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HideGuide')
export class HideGuide extends Component {
    @property(Node)    private Guide: Node = null;

    start() {
        //input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    public onTouchStart() {
        //input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.Guide.active = false
    }
}


