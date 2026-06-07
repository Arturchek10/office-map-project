package com.t1.map_service.mapper.furniture;

import com.t1.map_service.dto.furniture.FurnitureShortDto;
import com.t1.map_service.model.entity.Furniture;
import com.t1.map_service.storage.FileStorageService;
import java.time.Duration;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:34+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class FurnitureShortMapperImpl implements FurnitureShortMapper {

    @Override
    public FurnitureShortDto toDto(Furniture furniture, FileStorageService storage, Duration ttl) {
        if ( furniture == null ) {
            return null;
        }

        String photoUrl = null;
        Long id = null;
        String name = null;

        photoUrl = photoKeyToPresigned( furniture.getPhotoKey(), storage, ttl );
        id = furniture.getId();
        name = furniture.getName();

        FurnitureShortDto furnitureShortDto = new FurnitureShortDto( id, name, photoUrl );

        return furnitureShortDto;
    }
}
