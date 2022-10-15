package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Set;

public interface CustomPermissionGroupRepository extends CustomPermissionGroupRepositoryCE {

    Flux<PermissionGroup> findAll(AclPermission aclPermission);

    Flux<PermissionGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields);

    Flux<PermissionGroup> findAllById(Set<String> ids, AclPermission permission);
}
