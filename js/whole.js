import * as THREE from "three";
import FrontPart from "frontpart";
import SidePart  from "sidepart";
import TopPart   from "toppart";

export default class Holder {
  initialize = (_) => {
    const { HD, SP, HOR, VERT, D, MT, SVG_SCALE } = _;

    // Panel dimensions
    const fW = SP * HOR;  // total width
    const fH = SP * VERT;  // total height
    const sW = D;               // total depth
    const tbW = fW + 2 * MT;    // top/bottom extend by 1*MT on left and right
    const tbD = sW;             // depth matches side panel depth (no extra front/back overhang)

    // SVG canvas layout
    const G = SVG_SCALE * 8, S = SVG_SCALE;
    this.svgCtx = new C2S((fW * 3 + sW * 2 + 2 * MT) * S + G * 6, (fH + tbD * 2) * S + G * 4);
    this.svgCtx.strokeStyle = '#222222';
    this.svgCtx.lineWidth = 0.5;
    const ctx = this.svgCtx;

    // SVG column positions
    const cx0 = G + sW*S/2;
    const cx1 = G*2 + sW*S + fW*S/2;
    const cx2 = G*3 + sW*S + fW*S + sW*S/2;
    const cx3 = G*4 + sW*S*2 + fW*S + fW*S/2;
    const cx4 = G*5 + sW*S*2 + fW*S*2 + fW*S/2;
    const rowM = G*2 + sW*S + fH*S/2;
    const rowT = G + tbD*S/2;
    const rowB = G*3 + tbD*S + fH*S + tbD*S/2;
    const C = (cx, cy) => ({ ctx, position: { x: cx, y: cy }, scale: S });

    // Hole grid — centered in panel space, relative to panel center (0,0)
    const holes = [];
    for (let r = 0; r < VERT; r++)
      for (let c = 0; c < HOR; c++)
        holes.push({
          x: -((HOR - 1) * SP) / 2 + c * SP,
          y: -((VERT - 1) * SP) / 2 + r * SP,
          r: HD / 2,
        });

    // Build panels — each class computes its own tab/slot sizes from W, H, D, MT
    this.front  = new FrontPart(fW, fH, {x:0,y:0}, MT, holes, C(cx1, rowM));
    this.middle = new FrontPart(fW, fH, {x:0,y:0}, MT, holes, C(cx4, rowM), { sideTabs: false });
    this.back   = new FrontPart(fW, fH, {x:0,y:0}, MT, [],    C(cx3, rowM));
    this.left   = new SidePart( sW, fH, {x:0,y:0}, MT,        C(cx0, rowM));
    this.right  = new SidePart( sW, fH, {x:0,y:0}, MT,        C(cx2, rowM));
    const topBottomOptions = { frontBackSlotWidth: fW / 2, centerSlotWidth: fW / 2 };
    this.top    = new TopPart(  tbW, tbD, {x:0,y:0}, MT,      C(cx1, rowT), topBottomOptions);
    this.bottom = new TopPart(  tbW, tbD, {x:0,y:0}, MT,      C(cx1, rowB), topBottomOptions);

    // 3D meshes and positions
    const R = d => d * Math.PI / 180;
    const fm  = this.front.createMesh();
    const mm  = this.middle.createMesh();
    const bm  = this.back.createMesh();
    const lm  = this.left.createMesh();
    const rm  = this.right.createMesh();
    const tm  = this.top.createMesh();
    const btm = this.bottom.createMesh();

    const addEdges = (mesh, color) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const lines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
      lines.renderOrder = 2;
      mesh.add(lines);
    };

    addEdges(fm,  0x000000);
    addEdges(mm,  0x000000);
    addEdges(bm,  0x000000);
    addEdges(lm,  0x000000);
    addEdges(rm,  0x000000);
    addEdges(tm,  0x000000);
    addEdges(btm, 0x000000);

    // World space: X=0→fW, Y=0→fH, Z=0→sW
    // Each panel is offset inward by MT so its tab sits flush inside the mating slot.
    // Front/Back: move inward in Z by MT
    // Left/Right: move inward in X by MT
    // Top/Bottom: move inward in Y by MT
    fm.position.set(fW/2, fH/2, 0);
    mm.position.set(fW/2, fH/2, sW/2);
    bm.position.set(fW/2, fH/2, sW - MT);
    lm.rotation.y = R(90);  lm.position.set(-MT,    fH/2, sW/2);
    rm.rotation.y = R(90); rm.position.set(fW,   (fH/2), (sW/2));
    tm.rotation.x = R(90);  tm.position.set(fW/2, fH+MT,   sW/2);
    btm.rotation.x = R(-90); btm.position.set(fW/2, -MT,  sW/2);
    
    this.meshes = { front:fm, middle:mm, back:bm, left:lm, right:rm, top:tm, bottom:btm };
    this.group  = new THREE.Group();
    Object.values(this.meshes).forEach(m => this.group.add(m));
    this.group.position.set(-fW/2, -fH/2, -sW/2);
    this.group.name = 'holder';
    return this.group;
  };

  getSvg  = () => this.svgCtx;
  getMesh = (name) => this.meshes[name];
}
