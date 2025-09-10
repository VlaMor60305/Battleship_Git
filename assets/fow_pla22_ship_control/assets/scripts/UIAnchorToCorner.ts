import { _decorator, Component, Node, Vec3, UITransform, Camera, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIAnchorToCorner')
export class UIAnchorToCorner extends Component {
    @property([Node]) UIElementScale: Node[] = [];
    start()
    {
        this.sizeCheck();
        window.addEventListener("resize", (event) => { this.sizeCheck(); });
    }
    private sizeCheck()
    {
        if(document.body.clientWidth > document.body.clientHeight){
            
            for (let index = 0; index < this.UIElementScale.length; index++) {
                this.UIElementScale[index].scale = new Vec3(0.7,0.7,1);
                if(this.UIElementScale[index].name == "Arrow"){
                    this.UIElementScale[index].getComponent(Widget).bottom = 150;
                }
                if(this.UIElementScale[index].name == "hend"){
                    this.UIElementScale[index].getComponent(Widget).bottom = 0;
                }
                if(this.UIElementScale[index].name == "UIlogo"){
                    this.UIElementScale[index].getComponent(Widget).top = 50;
                    this.UIElementScale[index].getComponent(Widget).left = 180;
                }
                if(this.UIElementScale[index].name == "UIMusic"){
                    this.UIElementScale[index].getComponent(Widget).bottom = 70;
                    this.UIElementScale[index].getComponent(Widget).left = 100;
                }
            }
        }else{
            
            for (let index = 0; index < this.UIElementScale.length; index++) {
                this.UIElementScale[index].scale = new Vec3(1,1,1);
                if(this.UIElementScale[index].name == "Arrow"){
                    this.UIElementScale[index].getComponent(Widget).bottom = 350;
                }
                if(this.UIElementScale[index].name == "hend"){
                    this.UIElementScale[index].getComponent(Widget).bottom = 152;
                }
                if(this.UIElementScale[index].name == "UIlogo"){
                    this.UIElementScale[index].getComponent(Widget).top = 25;
                    this.UIElementScale[index].getComponent(Widget).left = 90;
                }
                if(this.UIElementScale[index].name == "UIMusic"){
                    this.UIElementScale[index].getComponent(Widget).bottom = 35;
                    this.UIElementScale[index].getComponent(Widget).left = 50;
                }
            }
        }
    }
}