export default class Measurements {
  static measurements = {
    HD:        67.31,   // hole diameter mm  (2.65in)
    SP:        80.01,   // spacing mm        (3.15in)
    HOR:       5,       // columns
    VERT:      3,       // rows
    D:         139.70,  // depth mm          (5.5in)
    MT:        5.08,    // material thickness mm (0.2in)
    SVG_SCALE: 1,
  };

  static setMM(field, value) { this.measurements[field] = value; }
  static setIn(field, value) { this.measurements[field] = value * 25.4; }
  static set(field, value, unit) {
    unit === 'in' ? this.setIn(field, value) : this.setMM(field, value);
  }
  static convert(value, toUnit) {
    return toUnit === 'in' ? (value / 25.4).toFixed(3) : (value * 25.4).toFixed(2);
  }
  static isNotValid(hd, sp, d, mt, unit) {
    const t = v => unit === 'in' ? v * 25.4 : v;
    const [HD, SP, D, MT] = [hd, sp, d, mt].map(t);
    if ([HD, SP, D, MT].some(v => isNaN(v) || v <= 0)) return [true, 'All values must be greater than zero.'];
    if (HD >= SP) return [true, 'Hole diameter must be smaller than spacing.'];
    if (MT >= SP * 0.4) return [true, 'Material thickness too large.'];
    return [false];
  }
}
