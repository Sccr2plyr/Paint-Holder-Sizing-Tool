import * as THREE from "three";

/**
 * BackPart — Back panel.
 * Identical slot structure to FrontPart but no holes.
 * Uses same cornerB / cornerL measurements from STEP.
 */
export default class BackPart {
  constructor(breadth, length, center, cornerB, cornerL, thickness, svg) {
    this.breadth   = breadth;
    this.length    = length;
    this.center    = center;
    this.cornerB   = cornerB;
    this.cornerL   = cornerL;
    this.thickness = thickness;
    this.svg       = svg;
    this.#createPath();
    this.#createShape();
  }

  #createPath = () => {
    const W  = this.breadth;
    const H  = this.length;
    const mt = this.thickness;
    const cB = this.cornerB;
    const cL = this.cornerL;
    const sW = W - 2 * cB;
    const sH = H - 2 * cL;

    this.moves = [
      [-W/2,  H/2],
      [0,  -cL], [mt,  0], [0, -sH], [-mt,  0], [0,  -cL],
      [cB,   0], [0,  mt], [sW,  0], [0,  -mt], [cB,   0],
      [0,   cL], [-mt, 0], [0,  sH], [mt,   0], [0,   cL],
      [-cB,  0], [0, -mt], [-sW, 0], [0,   mt], [-cB,  0],
    ];
  };

  #createShape = () => {
    const S = this.svg.scale;
    this.shape = new THREE.Shape();
    let x    = this.center.x   + this.moves[0][0];
    let y    = this.center.y   + this.moves[0][1];
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
