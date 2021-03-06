import {SketchObject} from './sketch-object'
import Vector from 'math/vector';
import * as math from '../../math/math'
import {DEG_RAD, makeAngle0_360} from '../../math/math'
import {Styles} from "../styles";
import * as draw_utils from "./draw-utils";
import {Param} from "./param";
import {AlgNumConstraint, ConstraintDefinitions} from "../constr/ANConstraints";

export class Segment extends SketchObject {

  constructor(a, b) {
    super();
    this.a = a;
    this.b = b;
    a.parent = this;
    b.parent = this;
    this.children.push(a, b);
    this.params = {
      ang: new Param(undefined),
      t: new Param(undefined)
    };
    this.params.ang.normalizer = makeAngle0_360;
    this.params.t.min = 100;
    this.syncGeometry();
  }

  get ang() {
    return this.params.ang.get();
  }

  get w() {
    return this.nx*this.a.x + this.ny*this.a.y;
  }

  get t() {
    return this.params.t.get();
  }

  get nx() {
    return -Math.sin(this.ang);
  }

  get ny() {
    return Math.cos(this.ang);
  }

  getAngleFromNormal() {
    return this.angleDeg();
  }

  angleDeg() {
    return makeAngle0_360(this.params.ang.get()) / DEG_RAD;
  }


  syncGeometry() {
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const l = Math.sqrt(dx*dx + dy*dy);

    let ux = (dx / l) || 0;
    let uy = (dy / l) || 0;

    let ang = Math.atan2(uy, ux);

    this.params.ang.set(makeAngle0_360(ang||0));
    this.params.t.set(l);
  }

  stabilize(viewer) {
    this.syncGeometry();
    const c = new AlgNumConstraint(ConstraintDefinitions.Polar, [this, this.a, this.b]);
    c.internal = true;
    viewer.parametricManager._add(c);
  }

  recoverIfNecessary() {
    if (math.distanceAB(this.a, this.b) > math.TOLERANCE) {
      return false;
    } else {
      const recoverLength = 100;
      this.a.translate(-recoverLength, -recoverLength);
      this.b.translate( recoverLength,  recoverLength);
      return true;
    }
  }

  visitParams(callback) {
    this.a.visitParams(callback);
    this.b.visitParams(callback);
    callback(this.params.ang);
    callback(this.params.t);
  }

  normalDistance(aim) {
    return Segment.calcNormalDistance(aim, this.a, this.b);
  }

  static calcNormalDistance(aim, segmentA, segmentB) {
    const ab = new Vector(segmentB.x - segmentA.x, segmentB.y - segmentA.y)
    const e = ab.normalize();
    const a = new Vector(aim.x - segmentA.x, aim.y - segmentA.y);
    const b = e.multiply(a.dot(e));
    const n = a.minus(b);
  
    //Check if vector b lays on the vector ab
    if (b.length() > ab.length()) {
      return -1;
    }
  
    if (b.dot(ab) < 0) {
      return -1;
    }
  
    return n.length();
  }
  
  getReferencePoint() {
    return this.a;
  }
  
  translateImpl(dx, dy) {
    this.a.translate(dx, dy);
    this.b.translate(dx, dy);
  }
  
  drawImpl(ctx, scale) {

    // let ang = this.params.ang.get();
    // let nx = -Math.sin(ang);
    // let ny =  Math.cos(ang);
    // let w = this.w;
    //
    // ctx.save();
    // draw_utils.SetStyle(Styles.CONSTRUCTION_OF_OBJECT, ctx, scale );
    // ctx.beginPath();
    // ctx.moveTo(nx * w + ny * 1000, ny * w - nx * 1000);
    // ctx.lineTo(nx * w - ny * 1000, ny * w + nx * 1000);
    // ctx.stroke();
    // ctx.restore();

    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    //  ctx.save();
    //  ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.stroke();
    //  ctx.restore();

  }

  opposite(endPoint) {
    if (endPoint === this.a) {
      return this.b;
    } else if (endPoint === this.b) {
      return this.a;
    } else {
      return null;
    }
  }

  copy() {
    return new Segment(this.a.copy(), this.b.copy());
  }
}

Segment.prototype._class = 'TCAD.TWO.Segment';
