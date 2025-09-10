// CameraOrbitClamp.ts
// Компонент позволяет управлять камерой через касания/мышь: плавно вращает камеру в пределах заданных углов.

import { _decorator, Component, Camera, Node, Vec3, input, Input, EventTouch } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraOrbitClamp')
export class CameraOrbitClamp extends Component {
  @property({ type: Camera, tooltip: 'Камера, которую будем контролировать. Если не указана — компонент на той же ноде.' })
  public targetCamera: Camera | null = null;

  @property({ tooltip: 'Чувствительность по X (пиксель -> градус).' })
  public sensitivityX = 0.12; // градуса на пиксель
  @property({ tooltip: 'Чувствительность по Y (пиксель -> градус).' })
  public sensitivityY = 0.12;
  @property({ tooltip: 'Инвертировать по Y (вертикально).' })
  public invertY = false;

  @property({ tooltip: 'Инвертировать по X (вертикально).' })
  public invertX = false;

  @property({ type: Vec3, tooltip: 'Минимальные углы (deg). Обычно: (-10, 160, -10).' })
  public minEuler: Vec3 = new Vec3(-10, 160, -10);

  @property({ type: Vec3, tooltip: 'Максимальные углы (deg). Обычно: (10, 170, 10).' })
  public maxEuler: Vec3 = new Vec3(10, 170, 10);

  @property({ tooltip: 'Скорость сглаживания (1/с). Чем больше — тем быстрее камера следует за целью.' })
  public smoothSpeed = 8;

  @property({ tooltip: 'Deadzone (пикселей) — если движение меньше, игнорируется.' })
  public deadzone = 2;

  // внутреннее состояние
  private _cameraNode: Node | null = null;
  private _currentEuler: Vec3 = new Vec3();
  private _targetEuler: Vec3 = new Vec3();

  // ввод
  private _dragging = false;
  private _lastX = 0;
  private _lastY = 0;

  onLoad() {
    if (!this.targetCamera) {
      this.targetCamera = this.getComponent(Camera);
    }
    if (this.targetCamera && this.targetCamera.node) {
      this._cameraNode = this.targetCamera.node;
      const e = this._cameraNode.eulerAngles;
      this._currentEuler = new Vec3(e.x, e.y, e.z);
      this._targetEuler = new Vec3(e.x, e.y, e.z);
    } else {
      this.enabled = false;
      console.warn('CameraOrbitClamp: target camera not found — component disabled.');
      return;
    }

    // Подписка на ввод (touch + mouse)
    input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
    input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);

    input.on(Input.EventType.MOUSE_DOWN, this._onMouseDown, this);
    input.on(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
    input.on(Input.EventType.MOUSE_UP, this._onMouseUp, this);
  }

  onDestroy() {
    input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
    input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);

    input.off(Input.EventType.MOUSE_DOWN, this._onMouseDown, this);
    input.off(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
    input.off(Input.EventType.MOUSE_UP, this._onMouseUp, this);
  }

  update(dt: number) {
    if (!this._cameraNode) return;

    // интерполяция к целевым углам
    const t = Math.min(1, this.smoothSpeed * dt);
    this._currentEuler.x += (this._targetEuler.x - this._currentEuler.x) * t;
    this._currentEuler.y += (this._targetEuler.y - this._currentEuler.y) * t;
    this._currentEuler.z += (this._targetEuler.z - this._currentEuler.z) * t;

    this._cameraNode.eulerAngles = this._currentEuler;
  }

  // --- обработка ввода ---
  private _onTouchStart(t: EventTouch) {
    const loc = t.getLocation();
    this._startDrag(loc.x, loc.y);
  }
  private _onTouchMove(t: EventTouch) {
    if (!this._dragging) return;
    const loc = t.getLocation();
    this._processDrag(loc.x, loc.y);
  }
  private _onTouchEnd(_t: EventTouch) {
    this._endDrag();
  }

  private _onMouseDown(e: any) {
    const x = e.getLocationX();
    const y = e.getLocationY();
    this._startDrag(x, y);
  }
  private _onMouseMove(e: any) {
    if (!this._dragging) return;
    const x = e.getLocationX();
    const y = e.getLocationY();
    this._processDrag(x, y);
  }
  private _onMouseUp(_e: any) {
    this._endDrag();
  }

  private _startDrag(x: number, y: number) {
    this._dragging = true;
    this._lastX = x;
    this._lastY = y;
  }

  private _processDrag(x: number, y: number) {
    const dx = x - this._lastX;
    const dy = y - this._lastY;

    // если движение мелкое — игнорируем
    if (Math.abs(dx) < this.deadzone && Math.abs(dy) < this.deadzone) {
      this._lastX = x;
      this._lastY = y;
      return;
    }

    // Переводим пиксели в градусы
    const yawDelta = dx * this.sensitivityX * (this.invertX ? 1 : -1); // изменение вокруг Y
    const pitchDelta = dy * this.sensitivityY * (this.invertY ? 1 : -1); // изменение вокруг X (питч)

    // обновляем целевые углы
    this._targetEuler.y = this._normalizeAngle(this._targetEuler.y + yawDelta);
    this._targetEuler.x = this._normalizeAngle(this._targetEuler.x + pitchDelta);

    // удерживаем в рамках ограничений
    this._targetEuler.x = this._clamp(this._targetEuler.x, this.minEuler.x, this.maxEuler.x);
    this._targetEuler.y = this._clamp(this._targetEuler.y, this.minEuler.y, this.maxEuler.y);
    this._targetEuler.z = this._clamp(this._targetEuler.z, this.minEuler.z, this.maxEuler.z);

    this._lastX = x;
    this._lastY = y;
  }

  private _endDrag() {
    this._dragging = false;
  }

  // утилиты
  private _clamp(v: number, a: number, b: number) {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return Math.max(lo, Math.min(hi, v));
  }

  private _normalizeAngle(a: number) {
    let ang = a % 360;
    if (ang > 180) ang -= 360;
    if (ang <= -180) ang += 360;
    return ang;
  }
}
