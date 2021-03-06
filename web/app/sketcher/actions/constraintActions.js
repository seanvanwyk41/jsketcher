import {AlgNumConstraint, ConstraintDefinitions} from "../constr/ANConstraints";
import {EndPoint} from "../shapes/point";
import {Circle} from "../shapes/circle";
import {Segment} from "../shapes/segment";
import {isInstanceOf, matchAll, matchTypes} from "./matchUtils";
import {Arc} from "../shapes/arc";
import {FilletTool} from "../tools/fillet";
import {editConstraint as _editConstraint} from "../components/ConstraintEditor";

export default [


  {
    id: 'Coincident',
    shortName: 'Coincident Constraint',
    description: 'Point Coincident',
    selectionMatcher: {
      selector: 'matchAll',
      types: [EndPoint],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const [first, ...others] = matchedObjects;
      let pm = viewer.parametricManager;
      for (let obj of others) {
        pm._add(
          new AlgNumConstraint(ConstraintDefinitions.PCoincident, [first, obj])
        );
      }
      pm.commit();
    }
  },

  {
    id: 'Tangent',
    shortName: 'Tangent Constraint',
    description: 'Tangent Between Line And Circle',
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [Circle, Arc],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {

      const {viewer} = ctx;
      const [circle, line] = matchedObjects;

      const constraint = new AlgNumConstraint(ConstraintDefinitions.TangentLC, [line, circle]);
      constraint.initConstants();
      const pm = viewer.parametricManager;
      pm.add(constraint);
    }

  },

  {
    id: 'EqualRadius',
    shortName: 'Equal Radius Constraint',
    description: 'Equal Radius Between Two Circle',
    selectionMatcher: {
      selector: 'matchAll',
      types: [Circle, Arc],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {

      const {viewer} = ctx;

      const pm = viewer.parametricManager;
      for (let i = 1; i < matchedObjects.length; ++i) {
        pm._add(new AlgNumConstraint(ConstraintDefinitions.EqualRadius, [matchedObjects[i-1], matchedObjects[i]]));
      }
      pm.commit();
    }

  },

  {
    id: 'EqualLength',
    shortName: 'Equal Length Constraint',
    description: 'Equal Length Between Two Segments',
    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },
    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm = viewer.parametricManager;
      for (let i = 1; i < matchedObjects.length; ++i) {
        pm._add(new AlgNumConstraint(ConstraintDefinitions.EqualLength, [matchedObjects[i-1], matchedObjects[i]]));
      }
      pm.commit();
    }

  },

  {
    id: 'PointOnLine',
    shortName: 'Point On Line Constraint',
    description: 'Point On Line',
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const [pt, line] = matchedObjects;
      let pm = viewer.parametricManager;
      pm.add(new AlgNumConstraint(ConstraintDefinitions.PointOnLine, [pt, line]));
    }
  },

  {
    id: 'Angle',
    shortName: 'Angle Constraint',
    description: 'Angle',
    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },
    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const firstSegment = matchedObjects[0];

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.Angle, [firstSegment]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        pm._add(firstConstr);
        for (let i = 1; i < matchedObjects.length; ++i) {
          pm._add(new AlgNumConstraint(ConstraintDefinitions.Angle, [matchedObjects[i]], {...firstConstr.constants}));
        }
        pm.commit();
      });
    }
  },

  {
    id: 'Vertical',
    shortName: 'Vertical Constraint',
    description: 'Vertical',

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm = viewer.parametricManager;

      matchedObjects.forEach(obj => {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Vertical, [obj]);
        constr.initConstants();
        pm._add(constr);
      });
      pm.commit();
    }
  },

  {
    id: 'Horizontal',
    shortName: 'Horizontal Constraint',
    description: 'Horizontal',

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const pm = viewer.parametricManager;

      matchedObjects.forEach(obj => {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Horizontal, [obj]);
        constr.initConstants();
        pm._add(constr);
      });
      pm.commit();
    }
  },

  {
    id: 'AngleBetween',
    shortName: 'Angle Between Constraint',
    description: 'Angle Between Lines',

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [firstSegment, secondSegment] = matchedObjects;

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.AngleBetween, [firstSegment, secondSegment]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        pm._add(firstConstr);
        for (let i = 2; i < matchedObjects.length; ++i) {
          pm._add(new AlgNumConstraint(ConstraintDefinitions.Angle,
            [matchedObjects[i-1], matchedObjects[i]], {...firstConstr.constants}));
        }
        pm.commit();
      });
    }
  },

  {
    id: 'Perpendicular',
    shortName: 'Perpendicular Constraint',
    description: 'Perpendicularity between two or more lines',

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const pm = viewer.parametricManager;

      for (let i = 1; i < matchedObjects.length; ++i) {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Perpendicular, [matchedObjects[i-1], matchedObjects[i]]);
        constr.initConstants();
        pm._add(constr);
      }
      pm.commit();
    }
  },

  {
    id: 'Parallel',
    shortName: 'Parallel Constraint',
    description: 'Parallelism between two or more lines',

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 2
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const pm = viewer.parametricManager;

      for (let i = 1; i < matchedObjects.length; ++i) {
        const constr = new AlgNumConstraint(ConstraintDefinitions.Parallel, [matchedObjects[i-1], matchedObjects[i]]);
        constr.initConstants();
        pm._add(constr);
      }
      pm.commit();
    }
  },

  {
    id: 'Length',
    shortName: 'Length Constraint',
    description: 'Segment Length',

    selectionMatcher: {
      selector: 'matchAll',
      types: [Segment],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [firstSegment, ...others] = matchedObjects;

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.SegmentLength, [firstSegment]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        pm._add(firstConstr);
        for (let other of others) {
          pm._add(new AlgNumConstraint(ConstraintDefinitions.SegmentLength, [other], {...firstConstr.constants}));
        }
        pm.commit();
      });
    }
  },

  {
    id: 'RadiusLength',
    shortName: 'Radius Length Constraint',
    description: 'Radius Length',

    selectionMatcher: {
      selector: 'matchAll',
      types: [Circle, Arc],
      minQuantity: 1
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [firstCircle, ...others] = matchedObjects;

      const firstConstr = new AlgNumConstraint(ConstraintDefinitions.RadiusLength, [firstCircle]);
      firstConstr.initConstants();

      editConstraint(ctx, firstConstr, () => {
        const pm = viewer.parametricManager;
        pm._add(firstConstr);
        for (let other of others) {
          pm._add(new AlgNumConstraint(ConstraintDefinitions.RadiusLength, [other], {...firstConstr.constants}));
        }
        pm.commit();
      });
    }
  },

  {
    id: 'DistancePL',
    shortName: 'Point to Line Distance Constraint',
    description: 'Distance between Point and Line',

    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        },
        {
          types: [Segment],
          quantity: 1
        },
      ]
    },


    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [pt, seg] = matchedObjects;

      const constr = new AlgNumConstraint(ConstraintDefinitions.DistancePL, [pt, seg]);
      constr.initConstants();

      editConstraint(ctx, constr, () => {
        const pm = viewer.parametricManager;
        pm.add(constr);
      });
    }
  },

  {
    id: 'DistancePP',
    shortName: 'Two Point Distance Constraint',
    description: 'Distance between two Points',

    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 2
        }
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [p1, p2] = matchedObjects;

      const constr = new AlgNumConstraint(ConstraintDefinitions.DistancePP, [p1, p2]);
      constr.initConstants();

      editConstraint(ctx, constr, () => {
        const pm = viewer.parametricManager;
        pm.add(constr);
      });
    }
  },

  {
    id: 'Lock',
    shortName: 'Lock Point Constraint',
    description: 'Lock Point',
    selectionMatcher: {
      selector: 'matchSequence',
      sequence: [
        {
          types: [EndPoint],
          quantity: 1
        }
      ]
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;

      const [point] = matchedObjects;

      const constr = new AlgNumConstraint(ConstraintDefinitions.LockPoint, [point]);
      constr.initConstants();
      editConstraint(ctx, constr, () => viewer.parametricManager.add(constr));
    }
  },

  {
    id: 'Fillet',
    shortName: 'Fillet Tool',
    description: 'Add a Fillet',
    selectionMatcher: {
      selector: 'function',
      match: (selection) => {
        if (matchTypes(selection, EndPoint, 1)) {
          const [point] = selection;
          if (isInstanceOf(point.parent, Segment)) {
            let pair = null;
            point.visitLinked(l => {
              if (l !== point && isInstanceOf(l.parent, Segment)) {
                pair = l;
                return true;
              }
            });
            if (pair) {
              return true;
            }
          }
        }
        return false;
      },
      description: 'a point linking two segment'
    },

    invoke: (ctx, matchedObjects) => {
      const {viewer} = ctx;
      const filletTool = new FilletTool(ctx.viewer);
      const cands = filletTool.getCandidateFromSelection(viewer.selected);
      if (cands) {
        filletTool.breakLinkAndMakeFillet(cands[0], cands[1]);
      }

    }
  },

];

function editConstraint(ctx, constraint, onApply) {
  _editConstraint(ctx.ui.$constraintEditRequest, constraint, onApply)
}