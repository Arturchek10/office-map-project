package com.t1.map_service.mapper.furniture;

import com.t1.map_service.dto.furniture.FurnitureCreateRequest;
import com.t1.map_service.dto.furniture.FurnitureDto;
import com.t1.map_service.dto.furniture.FurniturePatchRequest;
import com.t1.map_service.dto.furniture.FurniturePatchUiRequest;
import com.t1.map_service.dto.furniture.FurniturePlaceRequest;
import com.t1.map_service.model.Point;
import com.t1.map_service.model.entity.Furniture;
import com.t1.map_service.storage.FileStorageService;
import java.time.Duration;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:33+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class FurnitureMapperImpl implements FurnitureMapper {

    @Override
    public Furniture toEntity(FurnitureCreateRequest request) {
        if ( request == null ) {
            return null;
        }

        Furniture furniture = new Furniture();

        furniture.setName( request.name() );

        return furniture;
    }

    @Override
    public Furniture toEntity(FurniturePlaceRequest request) {
        if ( request == null ) {
            return null;
        }

        Furniture furniture = new Furniture();

        furniture.setName( request.name() );
        furniture.setPosition( request.position() );

        return furniture;
    }

    @Override
    public FurnitureDto toDto(Furniture furniture) {
        if ( furniture == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        Integer angle = null;
        Point position = null;
        Short sizeFactor = null;

        id = furniture.getId();
        name = furniture.getName();
        angle = furniture.getAngle();
        position = furniture.getPosition();
        sizeFactor = furniture.getSizeFactor();

        String photoUrl = null;

        FurnitureDto furnitureDto = new FurnitureDto( id, name, photoUrl, angle, position, sizeFactor );

        return furnitureDto;
    }

    @Override
    public FurnitureDto toDto(Furniture furniture, FileStorageService storage, Duration ttl) {
        if ( furniture == null ) {
            return null;
        }

        String photoUrl = null;
        Long id = null;
        String name = null;
        Integer angle = null;
        Point position = null;
        Short sizeFactor = null;

        photoUrl = photoKeyToPresigned( furniture.getPhotoKey(), storage, ttl );
        id = furniture.getId();
        name = furniture.getName();
        angle = furniture.getAngle();
        position = furniture.getPosition();
        sizeFactor = furniture.getSizeFactor();

        FurnitureDto furnitureDto = new FurnitureDto( id, name, photoUrl, angle, position, sizeFactor );

        return furnitureDto;
    }

    @Override
    public void update(Furniture furniture, FurniturePatchUiRequest request) {
        if ( request == null ) {
            return;
        }

        if ( request.angle() != null ) {
            furniture.setAngle( request.angle() );
        }
        if ( request.sizeFactor() != null ) {
            furniture.setSizeFactor( request.sizeFactor() );
        }
    }

    @Override
    public void update(Furniture furniture, FurniturePatchRequest request) {
        if ( request == null ) {
            return;
        }

        if ( request.name() != null ) {
            furniture.setName( request.name() );
        }
    }
}
