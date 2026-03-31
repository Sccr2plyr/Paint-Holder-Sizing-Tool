import * as THREE from "three";

/**
 * FrontPart — Front, Middle, and Back panels.
 *
 * Default profile has tabs on all 4 edges protruding outward by mt.
 * Optional middle-divider profile can disable side tabs.
 *   Top/Bottom edges: tab = W/2 wide, centered
 *   Left/Right edges: tab = H/2 tall, centered
 *
 * Front and Middle have circular holes. Back has no holes (pass empty array).
 *
 * @param {number} breadth    Total panel width (fW)
 * @param {number} length     Total panel height (fH)
 * @param {{x,y}}  center     Panel center in world space
 * @param {number} thickness  Material thickness (mt) — tab protrusion depth
 * @param {Array}  holes      [{x,y,r}] circle cutouts relative to center
 * @param {Object} svg        {ctx, position:{x,y}, scale}
 * @param {Object} options    { sideTabs?: boolean }
 */
export default class FrontPart {
  constructor(breadth, length, center, thickness, holes, svg, options = {}) {
    this.breadth   = breadth;
    this.length    = length;
    this.center    = center;
    this.thickness = thickness;
    this.holes     = holes || [];
    this.svg       = svg;
    this.options   = { sideTabs: true, ...options };
    this.#createPath();
    this.#createShape();
  }

  #createPath = () => {
    const W  = this.breadth;   // total width
    const H  = this.length;    // total height
    const mt = this.thickness; // tab protrusion = material thickness

    // Tab sizes — half the edge, centered
    const tabW = W / 2;  // tab width on top/bottom edges
    const tabH = H / 2;  // tab height on left/right edges

    // Flat sections on each side of the tab = quarter of the edge
    const flatW = W / 4; // (W - tabW) / 2
    const flatH = H / 4; // (H - tabH) / 2

    // Start: top-left corner (-W/2, H/2). Trace CCW.
    // The middle divider uses only top/bottom tabs to avoid side interference.
    if (this.options.sideTabs) {
      this.moves = [
        [-W/2, H/2],

        [0, -flatH],
        [-mt, 0],
        [0, -tabH],
        [mt, 0],
        [0, -flatH],

        [flatW, 0],
        [0, -mt],
        [tabW, 0],
        [0, mt],
        [flatW, 0],

        [0, flatH],
        [mt, 0],
        [0, tabH],
        [-mt, 0],
        [0, flatH],

        [-flatW, 0],
        [0, mt],
        [-tabW, 0],
        [0, -mt],
        [-flatW, 0],
      ];
      return;
    }

    this.moves = [
      [-W/2, H/2],
      [0, -H],
      [flatW, 0],
      [0, -mt],
      [tabW, 0],
      [0, mt],
      [flatW, 0],
      [0, H],
      [-flatW, 0],
      [0, mt],
      [-tabW, 0],
      [0, -mt],
      [-flatW, 0],
    ];
  };

  #createShape = () => {
    const S = this.svg.scale;
    this.shape = new THREE.Shape();

    // Absolute start = center + first move offset
    let x    = this.center.x + this.moves[0][0];
    let y    = this.center.y + this.moves[0][1];
    // SVG Y is flipped — subtract instead of add
    let svgX = this.svg.position.x + S * this.moves[0][0];
    let svgY = this.svg.position.y - S * this.moves[0][1];

    this.shape.moveTo(x, y);
    this.svg.ctx.beginPath();
    this.svg.ctx.moveTo(svgX, svgY);

    for (let i = 1; i < this.moves.length; i++) {
      x    += this.moves[i][0];
      y    += this.moves[i][1];
      svgX += S * this.moves[i][0];
      svgY -= S * this.moves[i][1]; // SVG Y flipped
      this.shape.lineTo(x, y);
      this.svg.ctx.lineTo(svgX, svgY);
    }
    this.svg.ctx.closePath();
    this.svg.ctx.stroke();

    // Circular holes (paint bottle cutouts)
    for (const h of this.holes) {
      const hole = new THREE.Path();
      hole.absarc(this.center.x + h.x, this.center.y + h.y, h.r, 0, Math.PI * 2, true);
      this.shape.holes.push(hole);
      this.svg.ctx.beginPath();
      this.svg.ctx.arc(
        this.svg.position.x + S * h.x,
        this.svg.position.y - S * h.y,
        S * h.r, 0, Math.PI * 2
      );
      this.svg.ctx.stroke();
    }
  };

  createMesh = () => new THREE.Mesh(
    new THREE.ExtrudeGeometry(this.shape, { depth: this.thickness, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
  );
}
