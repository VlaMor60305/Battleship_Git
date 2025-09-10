// ShipController3D.ts
import { _decorator, Component, Node, Vec3, input, Input, EventTouch, view, Collider, ITriggerEvent, Animation, Button, math, Quat, ICollisionEvent, Camera, ParticleSystem, AnimationState } from 'cc';
import { TweenMoverWorld } from './TweenMover';
import { AudioController } from './AudioController';
import super_html_playable from './super_html_playable';
import { LookAtTarget } from './LookAtTarget';
import { FollowTarget } from './FollowTarget';
import { BlinkEffect } from './BlinkEffect';
import { CameraFollow } from './CameraFollow';
import { HideGuide } from './HideGuide';
import { CameraOrbitClamp } from './CameraOrbitClamp';
const { ccclass, property } = _decorator;

@ccclass('ShipController3D')
export class ShipController3D extends Component {
  @property({ tooltip: 'Скорость (ед./с)' })
  private speed = 8;

  @property({ tooltip: 'Скорость поворота (град/с)' })
  private turnSpeed = 90;

  @property({ tooltip: 'Плавность поворота (чем больше - плавнее)' })
  private rotationSmoothness: number = 5;

  @property({ tooltip: 'Время затухания инерции (секунды)' })
  private inertiaFadeTime: number = 2.0;

  @property({ tooltip: 'Максимальный крен корабля при повороте (градусы)' })
  private maxShipRoll: number = 15;

  @property({ tooltip: 'Скорость крена корабля (чем больше - быстрее крен)' })
  private shipRollSpeed: number = 8;

  @property({ tooltip: 'Дистанция для завершения (ед.)' })
  private finishDistance = 250;

  @property({ tooltip: 'Дистанция для завершения второй поездки (ед.)' })
  private finishDistanceSecond = 250;

  @property({ tooltip: 'Подстройка ориентации модели (градусы)' })
  private angleOffset = 0;

  @property({ tooltip: 'Инвертировать управление' })
  private invertControls = false;

  @property({ tooltip: 'Deadzone (пикселей) вокруг центра' })
  private centerDeadzone = 0;

  @property(BlinkEffect)
  blinkingHit : BlinkEffect;

  @property([Animation])
  private shipHealth: Animation[] = [];

  @property(Animation)
  private cameraShake: Animation = null;

  @property(Node)
  private camera: Node = null;

  @property(Node)
  private cameraAim: Node = null;

  @property(CameraFollow)
  private cameraMovment: CameraFollow;

  @property([Node])
  private firstGame: Node[] = [];

  @property([Node])
  private secondGame: Node[] = [];

  @property(Button)
  private killButton: Button = null;

  @property(Animation)
  private killEnemy: Animation = null;

  @property(Node)
  private fail: Node = null;

  @property(Node)
  private fireButton: Node = null;

  @property(Node)
  private dronesButton : Node = null;

  @property(Node)
  private packshot: Node = null;

  @property(Node)
  installButton : Node = null;

  @property(TweenMoverWorld)
  private torpeda: TweenMoverWorld = null;

  @property(AudioController)
  private audioController: AudioController = null;

  @property(Node)
  private particles: Node = null;

  @property(Node)
  guidePanel : Node = null;

  @property({ tooltip: 'Включить отладочные логи' })
  private debugLogs = false;

  @property({ tooltip: 'Включить синхронизацию камер' })
  private isSyncingCameras: boolean = false;

  @property(Node)
  pointForAttack : Node = null;

  @property(Animation)
  animationVerts : Animation[] = [];

  @property(ParticleSystem)
  torpedoShootingParticle : ParticleSystem;

  private started: boolean = false;
  private startedSecond: boolean = false;
  private travelled: number = 0;
  private finished: boolean = false;
  private killedFirst: boolean = false;
  private yaw: number = 0;
  private health: number = 0;

  private _targetYaw: number = 0;
  private _currentYaw: number = 0;
  private _isTurning: boolean = false;
  private _turnDirection: number = 0;
  private _rotationVelocity: number = 0;
  private _inertiaVelocity: number = 0;
  private _lastTouchTime: number = 0;
  
  private _currentShipRoll: number = 0;
  private _targetShipRoll: number = 0;
  private _shipInitialRotation: Quat = new Quat();

  private cameraInitialPos: Vec3;
  private _isTakingDamage: boolean = false;
  private _damageSchedule: any = null;
  private _collidingObjects: Set<Node> = new Set(); // Трекер коллизий

  private cameraInitialRot : Quat;
  private canStart : boolean = false;

  private _initialTouchX: number = 0;
  private _currentTouchX: number = 0;
  private _isTouching: boolean = false;

  onLoad() {
    this.yaw = this.node.eulerAngles.y || 0;
    this._currentYaw = this.yaw;
    this._targetYaw = this.yaw;
    this.cameraInitialPos = this.camera.position.clone();
    this.cameraInitialRot = this.camera.rotation.clone();

    this.node.getRotation(this._shipInitialRotation);

    if (this.shipHealth && this.shipHealth.length > 0) {
      this.health = this.shipHealth.length;
    } else {
      this.health = 1;
      if (this.debugLogs) console.warn('ShipController3D: shipHealth массив пуст или не назначен.');
    }

    this.scheduleOnce(() =>
    {
      this.cameraMovment.enabled = true;
      this.guidePanel.active = true;
      this.canStart = true;
    },
    5
    );

    this.killButton.node.on(Button.EventType.CLICK, this.killEnemyFunc, this);
    
    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  start() {
    this.particles.active = false;
    const collider = this.getComponent(Collider);
    if (collider) {
      collider.on('onCollisionEnter', this.onCollisionEnter, this);
      collider.on('onCollisionStay', this.onCollisionStay, this);
      collider.on('onCollisionExit', this.onCollisionExit, this);
    } else if (this.debugLogs) {
      console.warn('ShipController3D: collider not found on node');
    }

    super_html_playable.set_app_store_url("");
    console.log('[Redirect]: setted link');
  }

  onDestroy() {
    input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

    const collider = this.getComponent(Collider);
    if (collider) {
      collider.off('onCollisionEnter', this.onCollisionEnter, this);
      collider.off('onCollisionStay', this.onCollisionStay, this);
      collider.off('onCollisionExit', this.onCollisionExit, this);
    }

    this.stopCollisionDamage();
  }

  private onCollisionEnter(event: ICollisionEvent) {
    if (!event.otherCollider || !event.otherCollider.node) return;
    
    const otherNode = event.otherCollider.node;
    this._collidingObjects.add(otherNode);

    if (this.debugLogs) { 
      console.log('onCollisionEnter with', otherNode.name);
      console.log('Current colliding objects:', this._collidingObjects.size);
    }

    if (!this._isTakingDamage && this._collidingObjects.size > 0) {
      this.startCollisionDamage();
    }
  }

  private onCollisionStay(event: ICollisionEvent) {
    // Можно добавить дополнительную логику если нужно
  }

  private onCollisionExit(event: ICollisionEvent) {
    if (!event.otherCollider || !event.otherCollider.node) return;
    
    const otherNode = event.otherCollider.node;
    this._collidingObjects.delete(otherNode);

    if (this.debugLogs) { 
      console.log('onCollisionExit with', otherNode.name);
      console.log('Current colliding objects:', this._collidingObjects.size);
    }

    if (this._collidingObjects.size === 0) {
      this.stopCollisionDamage();
    }
  }

  private startCollisionDamage() {
    if (this.finished || this._isTakingDamage) return;

    this._isTakingDamage = true;
    // Немедленно наносим урон при первом контакте
    this.shipDamaging();
    
    // Запускаем периодический урон
    this._damageSchedule = this.schedule(this.shipDamaging, 0.75);
  }

  private stopCollisionDamage() {
    if (this._isTakingDamage) {
      this._isTakingDamage = false;
      if (this._damageSchedule) {
        this.unschedule(this._damageSchedule);
        this._damageSchedule = null;
      }
    }
  }

  private onTouchStart(_t: EventTouch) {
    if (!this.started && this.canStart) {
      this.started = true;
      this.particles.active = true;
    }
    
    // Сохраняем начальную позицию касания
    this._initialTouchX = _t.getUILocation().x;
    this._currentTouchX = this._initialTouchX;
    this._isTouching = true;
    
    this._lastTouchTime = Date.now();
  }

  private onTouchMove(event: EventTouch) {
    if (!this.started || this.finished || !this._isTouching) return;

    const touchPos = event.getUILocation();
    this._currentTouchX = touchPos.x;
    
    // Вычисляем дельту относительно начального касания
    const deltaX = this._currentTouchX - this._initialTouchX;
    
    if (Math.abs(deltaX) > this.centerDeadzone) {
      const rawIsLeft = deltaX < 0;
      const effectiveIsLeft = this.invertControls ? !rawIsLeft : rawIsLeft;
      
      this._isTurning = true;
      this._turnDirection = effectiveIsLeft ? -1 : 1;
      
      // Сила поворота зависит от величины дельты
      const screenWidth = view.getVisibleSize().width;
      const turnStrength = Math.min(1, Math.abs(deltaX) / (screenWidth * 0.3));
      this._rotationVelocity = this._turnDirection * this.turnSpeed * turnStrength;
      this._targetShipRoll = this._turnDirection * this.maxShipRoll * turnStrength;
      
      this._lastTouchTime = Date.now();
    } else {
      this._isTurning = false;
      this._targetShipRoll = 0;
    }
  }

  private onTouchEnd(_t: EventTouch) {
     this._isTouching = false;
    this._isTurning = false;
    this._targetShipRoll = 0;
    
    // Сохраняем инерцию только если было движение
    if (this._rotationVelocity !== 0) {
      this._inertiaVelocity = this._rotationVelocity;
      this._rotationVelocity = 0;
    }
  }

  update(dt: number) {
    if(this.isSyncingCameras) {
      this.syncCameraWithAim(dt);

      if(!this.killedFirst) {
        this.node.position = Vec3.lerp(
          new Vec3(), 
          this.node.position,  
          new Vec3(this.pointForAttack.position),           
          this.speed * dt 
        );
      }
    }

    if(this._collidingObjects.size <= 0) {
      this.stopCollisionDamage();
    }

    this.cameraMovment.isMoving = !this._isTakingDamage;

    //Movement
    if (!this.started || this.finished) return;

    if (!this._isTurning && this._inertiaVelocity !== 0) {
      const inertiaDecay = dt / this.inertiaFadeTime;
      this._inertiaVelocity *= (1 - inertiaDecay);
      
      this._targetYaw = this.yaw + this._inertiaVelocity * 0.1;
      
      if (Math.abs(this._inertiaVelocity) < 0.5) {
        this._inertiaVelocity = 0;
        this._targetYaw = this.yaw;
      }
    } else if (this._isTurning) {
      this._targetYaw = this.yaw + this._rotationVelocity * 0.1;
    } else {
      this._targetYaw = this.yaw;
    }

    const rotationLerpFactor = this.rotationSmoothness * dt;
    this._currentYaw = math.lerp(
      this._currentYaw,
      this._targetYaw,
      rotationLerpFactor
    );
    
    this.yaw = this._currentYaw;

    const rollLerpFactor = this.shipRollSpeed * dt;
    this._currentShipRoll = math.lerp(
      this._currentShipRoll,
      this._targetShipRoll,
      rollLerpFactor
    );

    if (this.startedSecond) {
      this.node.eulerAngles = new Vec3(0, 0, 0);
    } else {
      const rotationQuat = new Quat();
      Quat.fromEuler(rotationQuat, 0, this.yaw + this.angleOffset, 0);
      
      const rollQuat = new Quat();
      Quat.fromEuler(rollQuat, 0, 0, this._currentShipRoll);
      
      const finalRotation = new Quat();
      Quat.multiply(finalRotation, rotationQuat, rollQuat);
      
      this.node.setRotation(finalRotation);
    }

    const rad = this.yaw * (Math.PI / 180);
    const fx = Math.sin(rad);
    const fz = Math.cos(rad);

    const distanceThisFrame = this.speed * dt;
    const dx = fx * distanceThisFrame;
    const dz = fz * distanceThisFrame;

    const pos = this.node.position;
    this.node.setPosition(pos.x + dx, pos.y, pos.z + dz);

    this.travelled += Math.hypot(dx, dz);

    if (!this.killedFirst) {
      if (!this.finished && this.travelled > this.finishDistance) {
        this.finished = true;
        this.finishFirstGameplay();
      }
    } else {
      if (!this.finished && this.travelled > this.finishDistanceSecond) {
        this.animationVerts.forEach(element => {
          element.play();
        });
        this.finished = true;
        this.startedSecond = true;
        this.finishFirstGameplay();
        this.finishingGameplay();
      }
    }
  }

  private shakeCamera() {
    if (this.cameraShake) {
      this.cameraShake.defaultClip = this.cameraShake.clips[1];
      this.cameraShake.play();
    }
  }

  private syncCameraWithAim(deltaTime: number) {
    /*if (!this.cameraAim || !this.camera) return;

    const targetPosition = new Vec3();
    this.cameraAim.getWorldPosition(targetPosition);
    
    const currentPosition = new Vec3();
    this.camera.getWorldPosition(currentPosition);
    
    // Добавляем смещение вбок для дуги
    const sideOffset = new Vec3(0, 0, 0); // смещение вправо
    const arcHeight = 15; // высота дуги
    
    // Промежуточная точка для дуги
    const midPoint = new Vec3();
    Vec3.lerp(midPoint, currentPosition, targetPosition, 0.5);
    midPoint.x += arcHeight;
    midPoint.add(sideOffset);
    
    // Квадратичная интерполяция по дуге
    const t = 5 * deltaTime;
    const newPosition = this.quadraticBezier(currentPosition, midPoint, targetPosition, t);
    
    this.camera.setWorldPosition(newPosition);
    this.camera.setWorldRotation(this.cameraAim.worldRotation.clone()); // смотрим на цель*/
  }

  private quadraticBezier(p0: Vec3, p1: Vec3, p2: Vec3, t: number): Vec3 {
    const result = new Vec3();
    const temp = new Vec3();
    
    // Формула квадратичной кривой Безье: (1-t)²P0 + 2(1-t)tP1 + t²P2
    Vec3.multiplyScalar(result, p0, Math.pow(1 - t, 2));
    Vec3.multiplyScalar(temp, p1, 2 * (1 - t) * t);
    result.add(temp);
    Vec3.multiplyScalar(temp, p2, t * t);
    result.add(temp);
    
    return result;
  }

  private shipDamaging() {
    if (this.finished || !this._isTakingDamage) return;

    if (this.health > 0) {
      this.health = Math.max(0, this.health - 1);
      const idx = this.health;
      this.shakeCamera();
      if (this.shipHealth && this.shipHealth[idx]) {
        this.shipHealth[idx].play();
        this.audioController.playDamage();
        this.blinkingHit.startBlink();
      } else if (this.debugLogs) {
        console.warn('shipHealth index out of range or missing:', idx);
      }
      if (this.health === 0) {
        this.onShipCrash();
      }
    } else {
      this.onShipCrash();
    }
  }

  private onShipCrash() {
    console.log('Корабль врезался');
    this.finished = true;
    this.fail.active = true;
    this.scheduleOnce(() => {
      this.packshot.active = true;
      this.installButton.active = false;
    }, 2.5);
  }

  finishFirstGameplay() {
    console.log('finish first gameplay — distance =', this.travelled);
    this.node.emit('finish-first-gameplay', { distance: this.travelled });
    
    this.isSyncingCameras = true;
    this.cameraShake.defaultClip = this.cameraShake.clips[2];
    this.cameraShake.play();
    const lookAtTarget = this.camera.getComponent(LookAtTarget);
    if (lookAtTarget) {
      lookAtTarget.enabled = false;
    }
    this.cameraMovment.isMoving = false;

    this.scheduleOnce(() => {
      this.firstGame.forEach((nod) => { nod.active = false; });
      this.secondGame.forEach((nod) => { nod.active = true; });
      this.finishingGameplay();
      this.node.eulerAngles = new Vec3(0, 0, 0);
      this.startedSecond = true;
    }, 1);
  }

  finishingGameplay() {
    if(!this.killedFirst) {
      this.fireButton.active = true;
    } else {
      this.dronesButton.active = true;
      this.secondGame.forEach(element => {
          element.active = false;
      });
      this.cameraAim.active = true;
    }
  }

  activateFirstGameplay() {
    const lookAtTarget = this.camera.getComponent(LookAtTarget);
    if (lookAtTarget) {
      lookAtTarget.enabled = true;
    }

    this.scheduleOnce(() => {
      this.firstGame.forEach((nod) => { nod.active = true; });
      this.secondGame.forEach((nod) => { nod.active = false; });
      this.camera.active = false;
      this.cameraAim.active = true;
      this.node.eulerAngles = new Vec3(0, 0, 0);
      this.fireButton.active = false;
    }, 1);
  }

  private killEnemyFunc() {
    if(!this.killedFirst) {
      this.killEnemy.play();
      if(this.torpedoShootingParticle != null)
      {
        this.torpedoShootingParticle.play();
      }
      this.torpeda.startMoveWorld();
      this.fireButton.active = false;
      this.audioController.playFire();
      this.activateFirstGameplay();
      
      this.scheduleOnce(() => {
        this.killedFirst = true;
        this.finished = false;
        this.yaw = this.node.eulerAngles.y || 0;
        this._inertiaVelocity = 0;

        this.camera.active = true;
          this.cameraAim.active = false;
        // Включаем анимацию возвращения камеры (клип №4)
        this.cameraShake.defaultClip = this.cameraShake.clips[4];
        this.cameraShake.play();
        this.isSyncingCameras = false;

        this.scheduleOnce(() => {
          this.cameraMovment.isMoving = true;
          
          this.startedSecond = false;
          
          // После завершения анимации возвращения переключаем на статичную камеру
          //this.cameraShake.defaultClip = this.cameraShake.clips[3];
          //this.cameraShake.play();
        }, 2);
      }, 3);
    } else {
      super_html_playable.download();
      console.log('[Redirect]: redirected');
      this.audioController.playBell();
    }
  }
}