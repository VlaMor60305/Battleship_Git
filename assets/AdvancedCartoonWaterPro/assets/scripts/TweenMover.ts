// TweenMoverWorld.ts
import { _decorator, Component, Node, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenMoverWorld')
export class TweenMoverWorld extends Component {
  @property({ type: Node, tooltip: 'Нода, на которую нужно смотреть (только X и Z учитываются)' })
  public lookAtNode: Node | null = null;

  @property({ type: Vec3, tooltip: 'Целевая позиция в МИРОВЫХ координатах' })
  public endWorldPosition: Vec3 = new Vec3();

  @property({ tooltip: 'Длительность движения в секундах' })
  public duration = 1;

  @property({ tooltip: 'Запускать автоматически при start (использует endWorldPosition)' })
  public autoStart = false;

  private _moving = false;
  private _startWorld = new Vec3();
  private _endWorld = new Vec3();
  private _tmp = new Vec3();
  private _dir = new Vec3();

  start () {
    if (this.autoStart) {
      // Копируем значение из инспектора в приватную цель и стартуем
      Vec3.copy(this._endWorld, this.endWorldPosition);
      this.startMoveWorld(this._endWorld);
    }
  }

  /**
   * Запустить движение к указанной мировой позиции.
   * Если аргумент не передан — использует endWorldPosition (из инспектора).
   */
  public startMoveWorld (targetWorld?: Vec3) {
    if (this._moving) {
      // Если уже движемся — можно остановить предыдущий твин (в CC он сам перезапишется)
      this._moving = false;
    }

    // Сохраняем стартовую мировую позицию
    this.node.getWorldPosition(this._startWorld);

    // Целевая мировая позиция
    if (targetWorld) {
      Vec3.copy(this._endWorld, targetWorld);
    } else {
      //Vec3.copy(this._endWorld, this.endWorldPosition);
      Vec3.copy(this._endWorld, this.lookAtNode.worldPosition);
    }

    this.node.lookAt(this._endWorld);

    // Защита: если цель совпадает со стартом — просто скрываем ноду
    if (Vec3.equals(this._startWorld, this._endWorld)) {
      this.node.active = false;
      return;
    }

    this._moving = true;

    // объект-прогресс для твина
    const prog = { t: 0 };

    tween(prog)
      .to(this.duration, { t: 1 }, {
        // onUpdate вызывается с каждым шагом твина
        onUpdate: (target: any /* {t: number} */, ratio: number) => {
          // Интерполируем мировую позицию и ставим её
          Vec3.lerp(this._tmp, this._startWorld, this._endWorld, target.t);
          this.node.setWorldPosition(this._tmp);
        }
      })
      .call(() => {
        // по завершении скрываем ноду и снимаем флаг движения
        this._moving = false;
        this.node.active = false;
      })
      .start();
  }

  update (dt: number) {
    /*if (!this._moving || !this.lookAtNode) return;

    // Получаем мировые позиции
    this.lookAtNode.getWorldPosition(this._tmp);    // tmp = targetWorld
    this.node.getWorldPosition(this._dir);         // dir = moverWorld (временно)

    // dir = target - mover
    Vec3.subtract(this._dir, this._tmp, this._dir);

    // Игнорируем по Y — смотрим только по X и Z
    this._dir.y = 0;

    if (this._dir.length() > 0.0001) {
      const angleRad = Math.atan2(this._dir.x, this._dir.z); // atan2(dx, dz)
      const angleDeg = angleRad * 180 / Math.PI;
      this.node.eulerAngles = new Vec3(0, angleDeg, 0);
    }*/
  }

  onDisable () {
    // безопасность
    this._moving = false;
  }

  // TweenMoverWorld.ts - добавь этот метод в класс
  public resetTorpedo() {
      // Останавливаем все твины
      tween(this.node).stop();
      
      // Возвращаем торпеду в начальную позицию и делаем видимой
      this.node.active = true;
      this.node.setWorldPosition(this._startWorld);
      this._moving = false;
      
      // Сбрасываем направление взгляда
      if (this.lookAtNode) {
          this.node.lookAt(this.lookAtNode.worldPosition);
      }
  }
}
