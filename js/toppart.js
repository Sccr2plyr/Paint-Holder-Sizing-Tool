import * as THREE from "three";

/**
 * TopPart — Top and Bottom panels.
 *
 * ALL 4 EDGES HAVE SLOTS, cutting inward by mt.
 * Optionally adds a center divider slot hole for the middle panel.
 *
 * Left/Right edges (width direction, length=W):
 *   SLOT = D/2 wide, centered (receives Left/Right side tab)
 *
 * Front/Back edges (depth direction, length=D):
 *   SLOT = W/2 wide, centered (receives Front/Back/Middle tab)
 *
 * @param {number} breadth    Panel width (fW)
 * @param {number} depth      Panel depth (sW)
 * @param {{x,y}}  center     Panel center in world space
 * @param {number} thickness  Material thickness (mt)
 * @param {Object} svg        {ctx, position:{x,y}, scale}
 * @param {Object} options    { centerDividerSlot?: boolean, frontBackSlotWidth?: number, centerSlotWidth?: number }
 */
export default class TopPart {
  constructor(breadth, depth, center, thickness, svg, options = {}) {
    this.breadth   = breadth;
    this.depth     = depth;
    this.center    = center;
    this.thickness = thickness;
    this.svg       = svg;
    this.options   = { centerDividerSlot: true, frontBackSlotWidth: null, centerSlotWidth: null, ...options };
    this.#createPath();
    this.#createShape();
  }

  #createPath = () => {
    const W  = this.breadth;   // panel width (fW)
    const D  = this.depth;     // panel depth (sW)
    const mt = this.thickness;

    // Slots on left/right edges — D/2 wide, centered on a W-length edge
    const slotLR  = D / 2;
    const flatLR  = D/4;  // = W/2 - D/4

    // Slots on front/back edges — W/2 wide, centered on a D-length edge
    const slotFB  = this.options.frontBackSlotWidth ?? (W / 2);
    const flatFB  = W / 4;  // (D - slotFB... wait, slot is W/2 on D edge)
    // flatFB = (D - slotFB) / 2 but slotFB=W/2 which may be > D
    // Actually: slot position along the D edge is centered = (D - slotFB)/2 each side
    // But slot SIZE is W/2 (same as the tab that fits into it)
    // The front/back edges are D long. The slot is W/2 wide centered on them.
    const cFB = (W - slotFB) / 2; // flat before/after slot on front/back edges

    // Start: top-left (-W/2, D/2) = back-left corner. Trace CCW.
    // LEFT edge ↓:   slot cuts +X
    // FRONT edge →:  slot cuts +Y
    // RIGHT edge ↑:  slot cuts -X
    // BACK edge ←:   slot cuts -Y
    this.moves = [
      [-W/2, D/2],   // starting position: back-left corner

      // LEFT edge going DOWN — slot cuts inward (+X)
      
      [0, -flatLR],           // flat before slot
      [mt, 0],                // step IN right by mt
      [0, -slotLR],           // down across slot
      [-mt, 0],               // step back OUT
      [0, -flatLR],           // flat after slot

      // FRONT edge going RIGHT — slot cuts inward (+Y)
      [cFB, 0],               // flat before slot
      [0, mt],                // step IN up by mt
      [slotFB, 0],            // right across slot
      [0, -mt],               // step back OUT
      [cFB, 0],               // flat after slot

      // RIGHT edge going UP — slot cuts inward (-X)
      [0, flatLR],            // flat before slot
      [-mt, 0],               // step IN left by mt
      [0, slotLR],            // up across slot
      [mt, 0],                // step back OUT
      [0, flatLR],            // flat after slot

      // BACK edge going LEFT — slot cuts inward (-Y)
      [-cFB, 0],              // flat before slot
      [0, -mt],               // step IN down by mt
      [-slotFB, 0],           // left across slot
      [0, mt],                // step back OUT
      [-cFB, 0],              // flat after slot — returns to start
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

    if (this.options.centerDividerSlot) {
      const slotW = this.options.centerSlotWidth ?? (this.breadth / 2);
      const slotD = this.thickness;
      const x0 = this.center.x - slotW / 2;
      const y0 = this.center.y - slotD / 2;

      const slot = new THREE.Path();
      slot.moveTo(x0, y0);
      slot.lineTo(x0 + slotW, y0);
      slot.lineTo(x0 + slotW, y0 + slotD);
      slot.lineTo(x0, y0 + slotD);
      slot.closePath();
      this.shape.holes.push(slot);

      this.svg.ctx.beginPath();
      this.svg.ctx.rect(
        this.svg.position.x + S * (x0 - this.center.x),
        this.svg.position.y - S * (y0 - this.center.y) - S * slotD,
        S * slotW,
        S * slotD
      );
      this.svg.ctx.stroke();
    }
  };

  createMesh = () => new THREE.Mesh(
    new THREE.ExtrudeGeometry(this.shape, { depth: this.thickness, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
  );
}