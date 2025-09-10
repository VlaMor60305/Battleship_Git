import { _decorator, Component, Node } from 'cc';
import super_html_playable from './super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('SuperHTMLAdapter')
export class SuperHTMLAdapter extends Component 
{
    public onClick()
    {
        super_html_playable.game_end();
        super_html_playable.download();
    }
}


