export const Map = jest.fn();
export const View = jest.fn();
export const Overlay = jest.fn();
export const layer = {
  Vector: jest.fn()
};
export const source = {
  Vector: jest.fn()
};
export const format = {
  GeoJSON: jest.fn()
};

export default {
  Map,
  View,
  Overlay,
  layer,
  source,
  format
};