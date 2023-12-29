package com.appsmith.server.newactions.imports;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.NewActionRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Map;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

@Service
public class NewActionImportableServiceImpl extends NewActionImportableServiceCEImpl
        implements ImportableService<NewAction> {
    public NewActionImportableServiceImpl(
            NewActionService newActionService,
            NewActionRepository repository,
            ActionCollectionService actionCollectionService) {
        super(newActionService, repository, actionCollectionService);
    }

    @Override
    protected NewAction getExistingActionForImportedAction(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, NewAction> actionsInCurrentApp,
            NewAction newAction) {
        if (!Boolean.TRUE.equals(newAction.getIsPublic())) {
            return super.getExistingActionForImportedAction(
                    mappedImportableResourcesDTO, actionsInCurrentApp, newAction);
        }
        Map<String, NewAction> fQNToNewActionMap = actionsInCurrentApp.values().stream()
                .collect(Collectors.toMap(
                        existingAction -> existingAction.getUnpublishedAction().getFullyQualifiedName(),
                        newAction1 -> newAction1));

        return fQNToNewActionMap.get(newAction.getUnpublishedAction().getFullyQualifiedName());
    }

    @Override
    protected boolean existingAppContainsAction(Map<String, NewAction> actionsInCurrentApp, NewAction newAction) {
        return super.existingAppContainsAction(actionsInCurrentApp, newAction)
                || (Boolean.TRUE.equals(newAction.getIsPublic())
                        && actionsInCurrentApp.values().stream().anyMatch(newAction1 -> newAction
                                .getUnpublishedAction()
                                .getValidName()
                                .equals(newAction1.getUnpublishedAction().getValidName())));
    }

    @Override
    protected void populateDomainMappedReferences(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, NewAction newAction) {
        super.populateDomainMappedReferences(mappedImportableResourcesDTO, newAction);
        if (TRUE.equals(newAction.getIsPublic())) {
            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            ActionDTO publishedAction = newAction.getPublishedAction();
            // This public action had not been created with module instance,
            // this would happen in the case of orphan module instances.
            // Go ahead and set the references to instance now
            Map<String, String> moduleInstanceRefToIdMap = mappedImportableResourcesDTO.getModuleInstanceRefToIdMap();
            newAction.setRootModuleInstanceId(moduleInstanceRefToIdMap.get(newAction.getRootModuleInstanceId()));
            newAction.setModuleInstanceId(moduleInstanceRefToIdMap.get(newAction.getModuleInstanceId()));
            unpublishedAction.setDatasource(null);
            unpublishedAction.autoGenerateDatasource();
            publishedAction.setDatasource(null);
            publishedAction.autoGenerateDatasource();
        }
    }

    @Override
    protected Flux<NewAction> getActionsInCurrentAppMono(Application application) {
        return super.getActionsInCurrentAppMono(application)
                .filter(newAction ->
                        newAction.getRootModuleInstanceId() == null || TRUE.equals(newAction.getIsPublic()));
    }

    @Override
    protected void updateImportableActionFromExistingAction(NewAction existingAction, NewAction actionToImport) {
        super.updateImportableActionFromExistingAction(existingAction, actionToImport);

        actionToImport.setModuleInstanceId(existingAction.getModuleInstanceId());
        actionToImport.setRootModuleInstanceId(existingAction.getRootModuleInstanceId());
    }
}
