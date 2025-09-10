import { _decorator, Component, Node, RenderTexture, MeshRenderer, director, game, setDisplayStats, profiler } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DepthMapSetter')
export class DepthMapSetter extends Component {
    @property(RenderTexture)
    renderTexture:RenderTexture;

    @property
    samplerName:string = '';

    start() {
        game.frameRate = 61;
        profiler.showStats();
        let material = this.node.getComponent(MeshRenderer).sharedMaterial;
        material.setProperty(this.samplerName,this.renderTexture.window.framebuffer.depthStencilTexture);
        let pass0 = material.passes[0];
        let bindingIndex = pass0.getBinding(this.samplerName);
        pass0.bindSampler(bindingIndex,director.root.pipeline.globalDSManager.pointSampler);
    }
}

