// Utilita' per movimenti fluidi: ogni rotazione "insegue" il valore richiesto con uno smorzamento esponenziale,
// cosi' le pose si fondono tra loro invece di scattare.
let DT = 1 / 60;
export const setDT = (d) => { DT = Math.min(Math.max(d, 0.001), 0.1); };
export const getDT = () => DT;
export function damp(cur, target, rate) { return cur + (target - cur) * (1 - Math.exp(-DT * rate)); }
// rotazione di un oggetto verso (x,y,z); snap = salta subito al valore
export function rot(o, x, y = 0, z = 0, rate = 20, snap = false) {
  if (snap) { o.rotation.set(x, y, z); return; }
  const k = 1 - Math.exp(-DT * rate);
  o.rotation.x += (x - o.rotation.x) * k; o.rotation.y += (y - o.rotation.y) * k; o.rotation.z += (z - o.rotation.z) * k;
}
export function pos(o, x, y, z, rate = 20, snap = false) {
  if (snap) { o.position.set(x, y, z); return; }
  const k = 1 - Math.exp(-DT * rate);
  o.position.x += (x - o.position.x) * k; o.position.y += (y - o.position.y) * k; o.position.z += (z - o.position.z) * k;
}
