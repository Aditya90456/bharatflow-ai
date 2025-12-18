import { useState, useCallback } from 'react';
import { Intersection, Incident } from '../types';
import { trainModelMock, predictHotspotsMock, HotspotPrediction } from '../ml/predictor';

export function useTrafficML() {
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<HotspotPrediction[]>([]);
  const [modelMeta, setModelMeta] = useState<any | null>(null);

  const train = useCallback(async (intersections: Intersection[], incidents: Incident[]) => {
    setIsTraining(true);
    // simulate async training latency
    await new Promise((r) => setTimeout(r, 800));
    const trained = trainModelMock({ intersections, incidents });
    setModelMeta(trained);
    setIsTraining(false);
    return trained;
  }, []);

  const predict = useCallback(
    async (intersections: Intersection[], incidents: Incident[]) => {
      setIsPredicting(true);
      // simulate inference latency
      await new Promise((r) => setTimeout(r, 400));
      const preds = predictHotspotsMock(intersections, incidents, 6);
      setPredictions(preds);
      setIsPredicting(false);
      return preds;
    },
    []
  );

  const trainAndPredict = useCallback(
    async (intersections: Intersection[], incidents: Incident[]) => {
      await train(intersections, incidents);
      return predict(intersections, incidents);
    },
    [train, predict]
  );

  return {
    isTraining,
    isPredicting,
    predictions,
    modelMeta,
    train,
    predict,
    trainAndPredict,
    clear: () => setPredictions([]),
  };
}
