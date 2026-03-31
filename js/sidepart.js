import * as THREE from "three";

/**
 * SidePart — Left and Right panels.
 *
 * LEFT/RIGHT edges (height direction):
 *   SLOT = H/2 tall, centered, cuts inward mt
 *   (receives Front/Back/Middle tab)
 *
 * TOP/BOTTOM edges (depth direction):
 *   TAB = D/2 wide, centered, protrudes mt
 *   (slots into Top/Bottom panel)
 *
 * @param {number} depth      Panel width in depth direction (sW = D + mt)
 * @param {number} height     Panel height (fH)
 * @param {{x,y}}  center     Panel center in world space
 * @param {number} thickness  Material thickness (mt)
 * @param {Object} svg        {ctx, position:{x,y}, scale}
 */
export default class SidePart {
  constructor(depth, height, center, thickness, svg) {
    this.depth     = depth;
    this.height    = height;
    this.center    = center;
    this.thickness = thickness;
    this.svg       = svg;
    this.#createPath();
    this.#createShape();
  }

  #createPath = () => {
    const D  = this.depth;     // panel width (depth direction, sW)
    const H  = this.height;    // panel height (fH)
    const mt = this.thickness;

    // Slot on left/right edges — H/2 tall, centered
    const slotH  = H / 2;
    const flatHL = H / 4;  // flat before/after slot on height edges

    // Tab on top/bottom edges — D/2 wide, centered
    const tabD   = D / 2;
    const flatDT = D / 4;  // flat before/after tab on depth edges

    // Start: bottom-left (-D/2, -H/2). Trace CCW.
    // Left/Right edges have SLOTS (cut inward)
    // Top/Bottom edges have TABS (protrude outward)
    this.moves = [
      [-D/2, -H/2],  // starting position: bottom-left

      // LEFT edge going UP (= front face of box)
      // SLOT cuts inward (-X direction, away from panel center toward front)
      [0, flatHL],            // flat before slot
      [mt, 0],               // step OUT left by mt (slot opens)
      [0, slotH],             // up across slot
      [-mt, 0],                // step back IN
      [0, flatHL],            // flat after slot

      // TOP edge going RIGHT — TAB protrudes UP (+Y)
      [flatDT, 0],            // flat before tab
      [0, mt],                // step OUT up by mt
      [tabD, 0],              // right across tab
      [0, -mt],               // step back IN
      [flatDT, 0],            // flat after tab

      // RIGHT edge going DOWN (= back face of box)
      // SLOT cuts inward (+X direction, away from panel center toward back)
      [0, -flatHL],           // flat before slot
      [-mt, 0],                // step OUT right by mt
      [0, -slotH],            // down across slot
      [mt, 0],               // step back IN
      [0, -flatHL],           // flat after slot

      // BOTTOM edge going LEFT — TAB protrudes DOWN (-Y)
      [-flatDT, 0],           // flat before tab
      [0, -mt],               // step OUT down by mt
      [-tabD, 0],             // left across tab
      [0, mt],                // step back IN
      [-flatDT, 0],           // flat after tab — returns to start
    ];
  };

  #createShape = () => {
    const S = this.svg.scale;
    this.shape = new THREE.Shape();
    let x    = this.center.x + this.moves[0][0];
    let y    = this.center.y + this.moves[0][1];
    let svgX = this.svg.position.x + S * this.moves[0][0];
    let svgY = this.svg.position.y - S * this.moves[0][1];
    this.shape.moveTo(x, y);
    this.svg.ctx.beginPath();
    this.svg.ctx.moveTo(svgX, svgY);
    for (let i = 1; i < this.moves.length; i++) {
      x    += this.moves[i][0];  y    += this.moves[i][1];
      svgX += S * this.moves[i][0]; svgY -= S * this.moves[i][1];
      this.shape.lineTo(x, y);
      this.svg.ctx.lineTo(svgX, svgY);
    }
    this.svg.ctx.closePath();
    this.svg.ctx.stroke();
  };

  createMesh = () => new THREE.Mesh(
    new THREE.ExtrudeGeometry(this.shape, { depth: this.thickness, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
  );
}
