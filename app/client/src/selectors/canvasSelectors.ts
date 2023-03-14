import { AppState } from "@appsmith/reducers";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { createSelector } from "reselect";
import { getCurrentAppPositioningType } from "./editorSelectors";

export const getIsDraggingForSelection = (state: AppState) => {
  return state.ui.canvasSelection.isDraggingForSelection;
};

export const getIsAutoLayout = createSelector(
  getCurrentAppPositioningType,
  (appPositionType: AppPositioningTypes): boolean => {
    return appPositionType === AppPositioningTypes.AUTO;
  },
);
