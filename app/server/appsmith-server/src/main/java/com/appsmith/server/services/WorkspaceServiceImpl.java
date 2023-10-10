package com.appsmith.server.services;

import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.helpers.WorkspaceServiceHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.WorkspaceServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Slf4j
@Service
public class WorkspaceServiceImpl extends WorkspaceServiceCEImpl implements WorkspaceService {

    private final TenantService tenantService;
    private final UserUtils userUtils;

    private final EnvironmentService environmentService;

    public WorkspaceServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkspaceRepository repository,
            AnalyticsService analyticsService,
            PluginRepository pluginRepository,
            SessionUserService sessionUserService,
            AssetRepository assetRepository,
            AssetService assetService,
            ApplicationRepository applicationRepository,
            PermissionGroupService permissionGroupService,
            PolicySolution policySolution,
            ModelMapper modelMapper,
            WorkspacePermission workspacePermission,
            PermissionGroupPermission permissionGroupPermission,
            WorkspaceServiceHelper workspaceServiceHelper,
            TenantService tenantService,
            UserUtils userUtils,
            EnvironmentService environmentService) {

        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                pluginRepository,
                sessionUserService,
                assetRepository,
                assetService,
                applicationRepository,
                permissionGroupService,
                policySolution,
                modelMapper,
                workspacePermission,
                permissionGroupPermission,
                workspaceServiceHelper);

        this.tenantService = tenantService;
        this.userUtils = userUtils;
        this.environmentService = environmentService;
    }

    @Override
    public Mono<Workspace> retrieveById(String workspaceId) {
        return repository.retrieveById(workspaceId);
    }

    @Override
    public Mono<String> getDefaultEnvironmentId(String workspaceId, AclPermission aclPermission) {
        return environmentService
                .findByWorkspaceId(workspaceId, aclPermission)
                .filter(Environment::getIsDefault)
                .next()
                .map(Environment::getId);
    }

    @Override
    public Mono<String> verifyEnvironmentIdByWorkspaceId(
            String workspaceId, String environmentId, AclPermission aclPermission) {

        Mono<String> environmentNameMono = environmentService
                .findById(environmentId)
                .map(Environment::getName)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_ACCESS_ERROR, FieldName.ENVIRONMENT, FieldName.WORKSPACE)));

        return environmentService
                .findByWorkspaceId(workspaceId, aclPermission)
                .filter(environment -> environment.getId().equals(environmentId))
                .next()
                .map(Environment::getId)
                .switchIfEmpty(Mono.defer(() -> environmentNameMono.flatMap(name -> Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ENVIRONMENT, name)))));
    }

    @Override
    public Flux<Environment> getDefaultEnvironment(String workspaceId) {
        return environmentService.findByWorkspaceId(workspaceId, null).filter(Environment::getIsDefault);
    }

    @Override
    protected void prepareWorkspaceToCreate(Workspace workspace, User user) {
        super.prepareWorkspaceToCreate(workspace, user);
        workspace.setHasEnvironments(true);
    }

    @Override
    protected Mono<Workspace> createWorkspaceDependents(Workspace createdWorkspace) {
        return environmentService.createDefaultEnvironments(createdWorkspace).then(Mono.just(createdWorkspace));
    }

    @Override
    protected Mono<Workspace> archiveWorkspaceDependents(Workspace workspace) {
        return environmentService.archiveByWorkspaceId(workspace.getId()).then(Mono.just(workspace));
    }
}
