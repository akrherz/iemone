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
export const style = {
  Style: jest.fn(),
  Icon: jest.fn()
};

// Export Style and Icon directly as well since they're imported as named exports
export const Style = jest.fn();
export const Icon = jest.fn();

export default {
  Map,
  View,
  Overlay,
  layer,
  source,
  format,
  style,
  Style,
  Icon
};