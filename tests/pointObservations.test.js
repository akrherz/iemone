const { refreshPointObservations } = require('../src/pointObservations');

describe('pointObservations refresh', () => {
  let testLayer = null;
  beforeAll(() => {
    // Create fake underlying source
    const vectorSrc = { setUrl: jest.fn(), refresh: jest.fn() };
    // Create fake cluster source that returns underlying vectorSrc
    const clusterSrc = { getSource: () => vectorSrc };
    // Create fake layer exposing getSource
    testLayer = { getSource: () => clusterSrc };
  });

  test('refreshPointObservations updates underlying vector source', () => {
    const url = 'https://example.com/test.geojson';
    refreshPointObservations(testLayer, url);
    // Now check that underlying vectorSrc.setUrl was called
    const clusterSrc = testLayer.getSource();
    const vectorSrc = clusterSrc.getSource();
    expect(vectorSrc.setUrl).toHaveBeenCalledWith(url);
    expect(vectorSrc.refresh).toHaveBeenCalled();
  });
});
