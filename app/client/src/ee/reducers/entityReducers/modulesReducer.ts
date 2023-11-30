import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type {
  FetchPackageResponse,
  FetchPackagesInWorkspaceResponse,
} from "@appsmith/api/PackageApi";
import type { DeleteModulePayload } from "@appsmith/actions/moduleActions";

type ID = string;

export type ModulesReducerState = Record<ID, Module>;

const INITIAL_STATE: ModulesReducerState = {};

const modulesReducer = createImmerReducer(INITIAL_STATE, {
  [ReduxActionTypes.FETCH_PACKAGE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<FetchPackageResponse>,
  ) => {
    draftState = {};
    const { modules } = action.payload;
    modules.forEach((module) => {
      draftState[module.id] = module;
    });

    return draftState;
  },
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<DeleteModulePayload>,
  ) => {
    const { id: moduleId } = action.payload;
    delete draftState[moduleId];

    return draftState;
  },
  [ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id].inputsForm = module.inputsForm;

    return draftState;
  },
  [ReduxActionTypes.FETCH_ALL_PACKAGES_IN_WORKSPACE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<FetchPackagesInWorkspaceResponse>,
  ) => {
    draftState = INITIAL_STATE;
    const { modules } = action.payload;
    modules.map((module) => {
      draftState[module.id] = module;
    });

    return draftState;
  },
});

export default modulesReducer;
