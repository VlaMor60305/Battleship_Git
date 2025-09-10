import { _decorator, Camera, Component, director, Node, screen, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AutoResizeRT')
export class AutoResizeRT extends Component {
    @property
    maxDpr = 10.0;

    start() {
        this.onScreenSizeChanged();
        screen.on("window-resize", this.onScreenSizeChanged, this);
        screen.on("orientation-change", this.onScreenSizeChanged, this);
        screen.on("fullscreen-change", this.onScreenSizeChanged, this);
    }

    protected onDestroy(): void {
        screen.off("window-resize", this.onScreenSizeChanged, this);
        screen.off("orientation-change", this.onScreenSizeChanged, this);
        screen.off("fullscreen-change", this.onScreenSizeChanged, this);
    }

    onScreenSizeChanged() {
        let rt = this.getComponent(Camera).targetTexture;
        if (rt) {
            let dpr = Math.min(screen.devicePixelRatio, this.maxDpr);
            let size = screen.windowSize;
            let width = size.width * dpr;
            let height = size.height * dpr;
            let ratio = width / height;
            if (width > 2048) {
                width = 2048;
                height = width / ratio;
            }
            if (height > 2048) {
                height = 2048;
                width = height * ratio;
            }
            rt.resize(width, height);
            console.log(width, height);
        }
    }
}

