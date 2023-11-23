import type {
  ModuleInstance,
  ModuleInstanceCreatorType,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";

export interface CreateQueryModuleInstancePayload {
  moduleId: string;
  contextId: string;
  contextType: ModuleInstanceCreatorType;
}

export interface UpdateModuleInstancePayload {
  id: ModuleInstanceId;
  moduleInstance: Partial<ModuleInstance>;
}

export interface FetchModuleInstancesPayload {
  contextId: string;
  contextType: ModuleInstanceCreatorType;
}

export interface FetchModuleInstanceEntitiesPayload {
  contextId: string;
  contextType: ModuleInstanceCreatorType;
}

export interface SetupModuleInstancePayload {
  contextId: string;
  contextType: ModuleInstanceCreatorType;
}

export type UpdateModuleInstanceSettingsPayload = Action;

export interface UpdateModuleInstanceOnPageLoadSettingsPayload {
  actionId: string;
  value?: boolean;
}

export interface SaveModuleInstanceNamePayload {
  id: string;
  name: string;
}

export interface DeleteModuleInstancePayload {
  id: string;
}

export const createQueryModuleInstance = (
  payload: CreateQueryModuleInstancePayload,
) => ({
  type: ReduxActionTypes.CREATE_MODULE_INSTANCE_INIT,
  payload,
});

export const deleteModuleInstance = (payload: DeleteModuleInstancePayload) => ({
  type: ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT,
  payload,
});

export const updateModuleInstance = (payload: UpdateModuleInstancePayload) => ({
  type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_INIT,
  payload,
});

export const fetchModuleInstances = (payload: FetchModuleInstancesPayload) => ({
  type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_INIT,
  payload,
});

export const fetchModuleInstancesForView = (
  payload: FetchModuleInstancesPayload,
) => ({
  type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_INIT,
  payload,
});

export const setupModuleInstances = (payload: SetupModuleInstancePayload) => ({
  type: ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
  payload,
});

export const setupModuleInstancesForView = (
  payload: SetupModuleInstancePayload,
) => ({
  type: ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_INIT,
  payload,
});

export const fetchModuleInstanceEntities = (
  payload: FetchModuleInstanceEntitiesPayload,
) => ({
  type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
  payload,
});

export const updateModuleInstanceSettings = (
  payload?: UpdateModuleInstanceSettingsPayload,
) => ({
  type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_INIT,
  payload,
});

export const updateModuleInstanceOnPageLoadSettings = (
  payload: UpdateModuleInstanceOnPageLoadSettingsPayload,
) => ({
  type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT,
  payload,
});

export const saveModuleInstanceName = (
  payload: SaveModuleInstanceNamePayload,
) => ({
  type: ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT,
  payload,
});
