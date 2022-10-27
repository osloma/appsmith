package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomEnvironmentVariableRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomEnvironmentVariableRepositoryImpl extends CustomEnvironmentVariableRepositoryCEImpl
        implements CustomEnvironmentVariableRepository {

    @Autowired
    public CustomEnvironmentVariableRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}
