export * from "ce/workers/common/DependencyMap/utils/getEntityDependenciesByType";

import type {
  DataTreeEntityConfig,
  DataTreeEntityObject,
  ModuleInputsConfig,
  ModuleInputsEntity,
  QueryModuleInstanceEntity,
  QueryModuleInstanceEntityConfig,
} from "@appsmith/entities/DataTree/types";
import {
  getDependencies as CE_getDependencies,
  getPathDependencies as CE_getPathDependencies,
} from "ce/workers/common/DependencyMap/utils/getEntityDependenciesByType";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import { getDependencyFromEntityPath } from "workers/common/DependencyMap/utils/getEntityDependencies";
import { find, union } from "lodash";
import { getEntityNameAndPropertyPath } from "ce/workers/Evaluation/evaluationUtils";
import { isQueryModuleInstance } from "@appsmith/workers/Evaluation/evaluationUtils";

export const getDependencies = {
  ...CE_getDependencies,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: (
    entity: DataTreeEntityObject,
    entityConfig: DataTreeEntityConfig,
  ) => {
    return getModuleInputsDependencies(
      entity as ModuleInputsEntity,
      entityConfig as ModuleInputsConfig,
    );
  },
  [ENTITY_TYPE_VALUE.MODULE_INSTANCE]: (
    entity: DataTreeEntityObject,
    entityConfig: DataTreeEntityConfig,
    allKeys: Record<string, true>,
  ) => {
    return getModuleInstanceDependencies(entity, entityConfig, allKeys);
  },
};

export function getModuleInstanceDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
  allKeys: Record<string, true>,
) {
  if (isQueryModuleInstance(entity)) {
    return QueryModuleInstanceDependencies(
      entity as QueryModuleInstanceEntity,
      entityConfig as QueryModuleInstanceEntityConfig,
      allKeys as Record<string, true>,
    );
  }
}

export function QueryModuleInstanceDependencies(
  entity: QueryModuleInstanceEntity,
  entityConfig: QueryModuleInstanceEntityConfig,
  allKeys: Record<string, true>,
) {
  let dependencies: Record<string, string[]> = {};
  const instanceName = entityConfig.name;
  const actionDependencyMap = entityConfig.dependencyMap || {};
  const dynamicBindingPathList = getEntityDynamicBindingPathList(entityConfig);

  for (const [propertyPath, pathDeps] of Object.entries(actionDependencyMap)) {
    const fullPropertyPath = `${instanceName}.${propertyPath}`;
    const propertyPathDependencies: string[] = pathDeps
      .map((dependentPath) => `${instanceName}.${dependentPath}`)
      .filter((path) => allKeys.hasOwnProperty(path));
    dependencies[fullPropertyPath] = propertyPathDependencies;
  }

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const fullPropertyPath = `${instanceName}.${propertyPath}`;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      entity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDependencies = union(existingDeps, dynamicPathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDependencies };
  }

  return dependencies;
}

export function getModuleInputsDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
) {
  const entityName = entityConfig.name;
  const dynamicBindingPathList = getEntityDynamicBindingPathList(entityConfig);
  let dependencies: Record<string, string[]> = {};

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const fullPropertyPath = `${entityName}.${propertyPath}`;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      entity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDependencies = union(existingDeps, dynamicPathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDependencies };
  }
  return dependencies;
}

export const getPathDependencies = {
  ...CE_getPathDependencies,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: (
    entity: DataTreeEntity,
    entityConfig: DataTreeEntityConfig,
    fullPropertyPath: string,
  ) => {
    return getModuleInputsPathDependencies(
      entity as ModuleInputsEntity,
      entityConfig as ModuleInputsConfig,
      fullPropertyPath as string,
    );
  },
  [ENTITY_TYPE_VALUE.MODULE_INSTANCE]: (
    entity: DataTreeEntity,
    entityConfig: DataTreeEntityConfig,
    fullPropertyPath: string,
    allKeys: Record<string, true>,
  ) => {
    return getModuleInstancePathDependencies(
      entity,
      entityConfig,
      fullPropertyPath,
      allKeys,
    );
  },
};

export function getModuleInstancePathDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
  fullPropertyPath: string,
  allKeys: Record<string, true>,
) {
  if (isQueryModuleInstance(entity)) {
    return getQueryModulePathDependencies(
      entity,
      entityConfig,
      fullPropertyPath,
      allKeys,
    );
  }
}

export function getQueryModulePathDependencies(
  entity: DataTreeEntity,
  entityConfig: DataTreeEntityConfig,
  fullPropertyPath: string,
  allKeys: Record<string, true>,
) {
  let actionPathDependencies: string[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  const actionInternalDependencyMap = entityConfig.dependencyMap || {};
  const actionPathInternalDependencies =
    actionInternalDependencyMap[propertyPath]
      ?.map((dep) => `${entityConfig.name}.${dep}`)
      .filter((path) => allKeys.hasOwnProperty(path)) || [];
  actionPathDependencies = union(
    actionPathDependencies,
    actionPathInternalDependencies,
  );

  const dynamicBindingPathList = getEntityDynamicBindingPathList(entityConfig);
  const bindingPaths = entityConfig.bindingPaths;

  const isADynamicPath =
    bindingPaths.hasOwnProperty(propertyPath) ||
    find(dynamicBindingPathList, { key: propertyPath });

  if (!isADynamicPath) return actionPathDependencies;

  const dynamicPathDependencies = getDependencyFromEntityPath(
    propertyPath,
    entity,
  );
  actionPathDependencies = union(
    actionPathDependencies,
    dynamicPathDependencies,
  );

  return actionPathDependencies;
}

export function getModuleInputsPathDependencies(
  entity: ModuleInputsEntity,
  entityConfig: ModuleInputsConfig,
  fullPropertyPath: string,
) {
  let dependencies: string[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);

  const dynamicBindingPathList = getEntityDynamicBindingPathList(entityConfig);
  const bindingPaths = entityConfig.bindingPaths || {};

  const isADynamicPath =
    bindingPaths.hasOwnProperty(propertyPath) ||
    find(dynamicBindingPathList, { key: propertyPath });

  if (!isADynamicPath) return dependencies;

  const dynamicPathDependencies = getDependencyFromEntityPath(
    propertyPath,
    entity,
  );
  dependencies = union(dependencies, dynamicPathDependencies);

  return dependencies;
}
