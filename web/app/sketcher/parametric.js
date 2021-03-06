import {askNumber} from '../utils/utils';
import {Constraints} from './constraints';
import {AlgNumConstraint, ConstraintDefinitions} from "./constr/ANConstraints";
import {AlgNumSubSystem} from "./constr/AlgNumSystem";
import {state, stream} from "../../../modules/lstream";

export {Constraints, ParametricManager}

class ParametricManager {

  algNumSystem = new AlgNumSubSystem();

  constantTable = {};
  externalConstantResolver = null;

  $update = stream();

  $constraints = this.$update
    .map(() => [...this.algNumSystem.allConstraints, ...this.algNumSystem.modifiers].sort((c1, c2) => c1.id - c2.id))
    .remember([]);

  constructor(viewer) {
    this.viewer = viewer;

    this.viewer.params.define('constantDefinition', null);
    this.viewer.params.subscribe('constantDefinition', 'parametricManager', this.onConstantsExternalChange, this)();
    this.constantResolver = this.createConstantResolver();
    this.messageSink = msg => alert(msg);

  }

  get allConstraints() {
    return this.$constraints.value;
  }

  reset() {
    this.algNumSystem = new AlgNumSubSystem();
  }

  addAlgNum(constr) {
    this.add(constr);
  }

  createConstantResolver() {
    return value => {
      var _value = this.constantTable[value];
      if (_value === undefined && this.externalConstantResolver) {
        _value = this.externalConstantResolver(value);
      }
      if (_value !== undefined) {
        value = _value;
      } else if (typeof(value) != 'number') {
        console.error("unable to resolve constant " + value);
      }
      return value;
    }
  }

  rebuildConstantTable(constantDefinition) {
    this.constantTable = {};
    if (constantDefinition == null) return;
    var lines = constantDefinition.split('\n');
    var prefix = "(function() { \n";
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^\s*([^\s]+)\s*=(.+)$/);
      if (m != null && m.length === 3) {
        var constant = m[1];
        try {
          var value = eval(prefix + "return " + m[2] + "; \n})()");
          this.constantTable[constant] = value;
          prefix += "const " + constant + " = " + value + ";\n"
        } catch(e) {
          console.log(e);
        }
      }
    }
  };

  onConstantsExternalChange(constantDefinition) {
    this.rebuildConstantTable(constantDefinition);
   // this.refresh();
  };

  defineNewConstant(name, value) {
    let constantDefinition = this.viewer.params.constantDefinition;
    let constantText = name + ' = ' + value;
    if (constantDefinition) {
      constantDefinition += '\n' + constantText;
    } else {
      constantDefinition = constantText;
    }
    this.rebuildConstantTable(constantDefinition);
    //disabling onConstantsExternalChange since we don't need re-solve
    this.viewer.params.set('constantDefinition', constantDefinition, 'parametricManager');
  };

  updateConstraintConstants(constr) {
    this.viewer.parametricManager.refresh();
  };

  notify() {
    this.$update.next();
  };

  commit() {
    this.notify();
    this.viewer.refresh();
  };

  _add(constr) {
    if (constr.modifier) {
      throw 'use addModifier instead';
    }
    this.algNumSystem.addConstraint(constr);
  };

  refresh() {
    this.notify();
    this.viewer.refresh();
  }

  add(constr) {
    this.viewer.historyManager.checkpoint();
    this._add(constr);
    this.refresh();
  };

  addAll(constrs) {
    this.viewer.historyManager.checkpoint();
    for (let i = 0; i < constrs.length; i++) {
      this._add(constrs[i]);
    }
    this.refresh();
  };

  remove(constr) {
    this.viewer.historyManager.checkpoint();
    this.algNumSystem.removeConstraint(constr);
    this.refresh();
  };

  removeObjects(objects) {

    objects.forEach(obj => {
      obj.constraints.forEach(c => this.algNumSystem._removeConstraint(c));
      if (obj.layer != null) {
        obj.layer.remove(obj);
      }
    });

    this.algNumSystem.invalidate();
    this.refresh();
  };

  prepare(interactiveObjects) {
    this.algNumSystem.prepare(interactiveObjects);
  }

  solve(rough) {
    this.algNumSystem.solve(rough);
  }

  addModifier(modifier) {
    this.algNumSystem.addModifier(modifier);
    this.refresh();
  }

  coincidePoints(pt1, pt2) {
    this.add(new AlgNumConstraint(ConstraintDefinitions.PCoincident, [pt1, pt2]));
  }

  lockPoint(pt) {
    const lockConstr = new AlgNumConstraint(ConstraintDefinitions.LockPoint, [pt]);
    lockConstr.initConstants();
    this.add(lockConstr);
  }

  lockAngle(segment) {
    const constr = new AlgNumConstraint(ConstraintDefinitions.Angle, [segment]);
    constr.initConstants();
    this.add(constr);
  }

  lockLength(segment) {
    const constr = new AlgNumConstraint(ConstraintDefinitions.SegmentLength, [segment]);
    constr.initConstants();
    this.add(constr);
  }

  setConstantsFromGeometry(obj) {
    obj.visitLinked(o => {
      o.ancestry(ao => {
        ao.syncGeometry();
        ao.constraints.forEach(c => {
          c.setConstantsFromGeometry && c.setConstantsFromGeometry()
        })
      });
    });
  }
}
