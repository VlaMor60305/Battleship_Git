import { _decorator, Component, Node, Button } from 'cc';
import super_html_playable from './super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('Redirection')
export class Redirection extends Component {
    @property(Button) private click: Button = null;

    start() {
        this.click.node.on(Button.EventType.CLICK, this.Redirect, this);
        super_html_playable.set_app_store_url("");
        console.log('[Redirect]: setted link');
    }

    Redirect(){
        super_html_playable.download();
        console.log('[Redirect]: redirected');
    }
}
