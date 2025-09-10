import {
    _decorator,
    Component,
    Node,
    RenderTexture,
    MeshRenderer,
    director,
    game,
    profiler,
    gfx, // ← добавим это, чтобы получить типы
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DepthMapSetter')
export class DepthMapSetter extends Component {
    @property(RenderTexture)
    renderTexture: RenderTexture | null = null;

    @property
    samplerName: string = 'depthTex';

    private maxRetries = 10;
    private retryInterval = 50;

    start() {
        game.frameRate = 61;
        profiler.showStats();

        this.tryApplyDepthSampler(this.maxRetries);
    }

    private tryApplyDepthSampler(retryLeft: number): void {
        const root = director.root;
        const device = root.device;
        const pipeline = root.pipeline;

        if (!device || !pipeline) {
            this.retryOrGiveUp(retryLeft);
            return;
        }

        // Попробуем использовать globalDSManager.pointSampler
        const globalDSManager = (pipeline as any).globalDSManager;
        if (globalDSManager?.pointSampler) {
            this.applySampler(globalDSManager.pointSampler);
            return;
        }

        // Если недоступен — создаём свой сэмплер
        try {
            // Используем типы из 'cc/gfx', но только для типизации
            const samplerInfo = new gfx.SamplerInfo(
                gfx.Filter.POINT,
                gfx.Filter.POINT,
                gfx.Filter.NONE,
                gfx.Address.CLAMP,
                gfx.Address.CLAMP,
                gfx.Address.CLAMP
            );

            const customSampler = device.getSampler(samplerInfo);
            this.applySampler(customSampler);
            return;
        } catch (err) {
            console.warn('[DepthMapSetter] Failed to create custom sampler:', err);
            this.retryOrGiveUp(retryLeft);
        }
    }

    private applySampler(sampler: any): void {
        const renderer = this.node.getComponent(MeshRenderer);
        if (!renderer) {
            console.error('MeshRenderer not found');
            return;
        }

        const material = renderer.sharedMaterial;
        if (!material) {
            console.error('Material is null');
            return;
        }

        const pass = material.passes[0];
        if (!pass) {
            console.error('Material pass[0] not available');
            return;
        }

        const depthTex = this.renderTexture?.window?.framebuffer?.depthStencilTexture;
        if (!depthTex) {
            console.error('Depth-stencil texture is not ready');
            return;
        }

        material.setProperty(this.samplerName, depthTex);

        const bindingIndex = pass.getBinding(this.samplerName);
        if (bindingIndex < 0) {
            console.error(`Binding for '${this.samplerName}' not found in shader`);
            return;
        }

        pass.bindSampler(bindingIndex, sampler);
        console.log(`✅ Depth map applied to sampler: ${this.samplerName}`);
    }

    private retryOrGiveUp(retryLeft: number): void {
        if (retryLeft <= 0) {
            console.error(
                `[DepthMapSetter] Failed to bind depth sampler after ${this.maxRetries} attempts. ` +
                `Check: RenderTexture assigned, scene loaded, and shader uses '${this.samplerName}'.`
            );
            return;
        }

        setTimeout(() => {
            this.tryApplyDepthSampler(retryLeft - 1);
        }, this.retryInterval);
    }
}