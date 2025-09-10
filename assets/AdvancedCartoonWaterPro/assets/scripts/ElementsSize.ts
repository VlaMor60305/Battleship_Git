import { _decorator, Component, Node, view, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ElementsSize')
export class ElementsSize extends Component {
    @property(Node)
    targetNode: Node = null;

    @property(Number)
    private scaleSizePort: number = 1;

    @property(Number)
    private scaleSizeLand: number = 0.75;

    @property(Boolean)
    private invertHorizontal: boolean = false;

    start() {
        this.updateScale();
        this.schedule(this.updateScale, 0.1);
    }

    updateScale() {
        const frameSize = view.getFrameSize();
        if (!this.targetNode) return;

        if (frameSize.width > frameSize.height) {
            if(this.invertHorizontal == false) { this.targetNode.setScale(new Vec3(this.scaleSizeLand, this.scaleSizeLand, 1)); }
            else { this.targetNode.setScale(new Vec3(-1 * this.scaleSizeLand, this.scaleSizeLand, 1)); }
            console.log('land');
        } else {
            if(this.invertHorizontal == false) { this.targetNode.setScale(new Vec3(this.scaleSizePort, this.scaleSizePort, 1)); }
            else { this.targetNode.setScale(new Vec3(-1 * this.scaleSizePort, this.scaleSizePort, 1)); }
            console.log('port');
        }
    }
}