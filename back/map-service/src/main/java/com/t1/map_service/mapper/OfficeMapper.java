package com.t1.map_service.mapper;

import com.t1.map_service.dto.office.OfficeCreateRequest;
import com.t1.map_service.dto.office.OfficeDto;
import com.t1.map_service.dto.office.OfficeUpdateRequest;
import com.t1.map_service.model.entity.Office;
import com.t1.map_service.storage.FileStorageService;
import org.mapstruct.*;

import java.time.Duration;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface OfficeMapper {

    @Mapping(
            target = "floorsCount",
            expression = "java(office.getFloors() == null ? 0 : office.getFloors().size())"
    )

    OfficeDto toDto(Office office);


    @Mapping(
            target = "floorsCount",
            expression = "java(office.getFloors() == null ? 0 : office.getFloors().size())"
    )

    // пресайн только для photoUrl
    @Mapping(target = "photoUrl",
            source = "photoKey",
            qualifiedByName = "photoKeyToPresigned")
    OfficeDto toDto(Office office,
                    @Context FileStorageService storage,
                    @Context Duration ttl);

    @Mapping(target = "photoKey", ignore = true)
    Office toEntity(OfficeCreateRequest request);

    @Mapping(target = "photoKey", ignore = true)
    void update(@MappingTarget Office target, OfficeUpdateRequest source);

    @Named("photoKeyToPresigned")
    default String photoKeyToPresigned(String key,
                                       @Context FileStorageService storage,
                                       @Context Duration ttl) {
        if (key == null || key.isBlank()) return null;
        return storage.presignGet(key, ttl);
    }


}
