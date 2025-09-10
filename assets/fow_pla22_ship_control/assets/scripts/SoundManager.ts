import { _decorator, Component, AudioSource, AudioClip, director, Button, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {
    private static _instance: SoundManager = null;
    
    // Новые звуковые файлы
    @property({ type: AudioClip })
    public background: AudioClip = null; // background.mp3
    
    @property({ type: AudioClip })
    public bell: AudioClip = null;       // bell.mp3
    
    @property({ type: AudioClip })
    public fire: AudioClip = null;       // fire.mp3
    
    @property({ type: AudioClip })
    public rockDamage: AudioClip = null; // rockdamage.mp3
    
    @property({ type: AudioClip })
    public ship: AudioClip = null;       // ship.mp3

    @property({ type: AudioClip })
    public FireShip: AudioClip = null;       // FireShip.mp3

    // Элементы управления звуком
    @property({ type: Button })
    private soundButton: Button = null;

    @property({ type: Sprite })
    private soundButtonSp: Sprite = null;

    @property({ type: SpriteFrame })
    private soundOnSprite: SpriteFrame = null;

    @property({ type: SpriteFrame })
    private soundOffSprite: SpriteFrame = null;

    private _musicSource: AudioSource = null;
    private _sfxSources: AudioSource[] = [];
    private _sfxIndex: number = 0;
    private _isSoundEnabled: boolean = true;

    onLoad() {
        // Singleton
        if (SoundManager._instance) {
            this.node.destroy();
            return;
        }
        SoundManager._instance = this;
        director.addPersistRootNode(this.node);

        this.initAudioSources();
        this.initSoundButton();
    }

    private initSoundButton() {
        if (!this.soundButton) return;
        
        this.soundButton.node.on(Button.EventType.CLICK, this.toggleSound, this);
        this.updateSoundButtonSprite();
    }

    private updateSoundButtonSprite() {
        if (this.soundButtonSp) {
            this.soundButtonSp.spriteFrame = this._isSoundEnabled 
                ? this.soundOnSprite 
                : this.soundOffSprite;
        }
    }

    public toggleSound() {
        this._isSoundEnabled = !this._isSoundEnabled;
        this.updateSoundButtonSprite();

        // Управление громкостью
        const volume = this._isSoundEnabled ? 1 : 0;
        
        if (this._musicSource) {
            this._musicSource.volume = this._isSoundEnabled ? 0.5 : 0;
        }
        
        this._sfxSources.forEach(source => {
            source.volume = volume;
        });
    }

    private initAudioSources() {
        // Музыкальный источник
        this._musicSource = this.addComponent(AudioSource);
        
        // Источники для SFX
        for (let i = 0; i < 5; i++) {
            const source = this.addComponent(AudioSource);
            source.volume = 1;
            this._sfxSources.push(source);
        }
    }

    start() {
        this.playBackgroundMusic();
    }

    public playBackgroundMusic() {
        if (!this.background || !this._musicSource) return;

        this._musicSource.stop();
        this._musicSource.clip = this.background;
        this._musicSource.loop = true;
        this._musicSource.volume = this._isSoundEnabled ? 0.3 : 0;
        this._musicSource.play();
    }

    // ===== НОВЫЕ SFX МЕТОДЫ =====
    public playBell() { this.playSFX(this.bell); }
    public playFire() { this.playSFX(this.fire); }
    public playRockDamage() { this.playSFX(this.rockDamage); }
    public playShip() { this.playSFX(this.ship); }
    public PlayFireShip() { this.playSFX(this.FireShip); }

    private playSFX(clip: AudioClip, volume: number = 1.0) {
        if (!clip || !this._isSoundEnabled) return;

        const source = this._sfxSources[this._sfxIndex];
        this._sfxIndex = (this._sfxIndex + 1) % this._sfxSources.length;

        source.stop();
        source.clip = clip;
        source.volume = volume;
        source.play();
    }

    public static get instance(): SoundManager {
        return SoundManager._instance;
    }
}