import { _decorator, Component, Node, AudioSource, AudioClip, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioController')
export class AudioController extends Component {
    @property(AudioSource)    private audioSource: AudioSource = null;
    @property(Node)           private music: Node = null;
    @property(Node)           private engineShip: Node = null;
    @property(AudioClip)      private fireShip: AudioClip = null;
    @property(AudioClip)      private damageShip: AudioClip = null;
    @property(AudioClip)      private bell: AudioClip = null;
    @property(Node)           private soundOn: Node = null;
    @property(Node)           private soundOff: Node = null;
    @property(Button)         private toggle: Button = null;

    private isAudioEnabled: boolean = true;

    start() {
        this.isAudioEnabled = true;
        this.toggle.node.on(Button.EventType.CLICK, this.changeToggleState, this);
    }

    public playFire() {
        this.playSFX(this.fireShip);
    }

    public playDamage() {
        this.playSFX(this.damageShip);
    }

    public playBell() {
        this.playSFX(this.bell);
    }

    private playSFX(clip : AudioClip) {
        if(this.isAudioEnabled == true) { this.audioSource.playOneShot(clip); }
    }

    private changeToggleState() {
        if(this.isAudioEnabled == true) {
            this.soundOff.active = true;
            this.soundOn.active = false;
            this.music.active = false;
            this.engineShip.active = false;
            this.isAudioEnabled = false;
        } else {
            this.soundOff.active = false;
            this.soundOn.active = true;
            this.music.active = true;
            this.engineShip.active = true;
            this.isAudioEnabled = true;
        }
    }
}


