package com.t1.map_service.mapper;

import com.t1.map_service.dto.floor.FloorCreateRequest;
import com.t1.map_service.dto.floor.FloorDto;
import com.t1.map_service.dto.floor.FloorUpdateRequest;
import com.t1.map_service.model.entity.Floor;
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
public class FloorMapperImpl implements FloorMapper {

    @Override
    public Floor toEntity(FloorCreateRequest dto) {
        if ( dto == null ) {
            return null;
        }

        Floor.FloorBuilder floor = Floor.builder();

        floor.name( dto.name() );
        if ( dto.orderNumber() != null ) {
            floor.orderNumber( dto.orderNumber() );
        }

        return floor.build();
    }

    @Override
    public FloorDto toDto(Floor floor) {
        if ( floor == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        Integer orderNumber = null;

        id = floor.getId();
        name = floor.getName();
        orderNumber = floor.getOrderNumber();

        String photoUrl = null;

        FloorDto floorDto = new FloorDto( id, name, photoUrl, orderNumber );

        return floorDto;
    }

    @Override
    public FloorDto toDto(Floor floor, FileStorageService storage, Duration ttl) {
        if ( floor == null ) {
            return null;
        }

        String photoUrl = null;
        Long id = null;
        String name = null;
        Integer orderNumber = null;

        photoUrl = photoKeyToPresigned( floor.getPhotoKey(), storage, ttl );
        id = floor.getId();
        name = floor.getName();
        orderNumber = floor.getOrderNumber();

        FloorDto floorDto = new FloorDto( id, name, photoUrl, orderNumber );

        return floorDto;
    }

    @Override
    public void update(Floor target, FloorUpdateRequest source) {
        if ( source == null ) {
            return;
        }

        if ( source.name() != null ) {
            target.setName( source.name() );
        }
        if ( source.orderNumber() != null ) {
            target.setOrderNumber( source.orderNumber() );
        }
    }
}
