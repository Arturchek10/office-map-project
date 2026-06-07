package com.t1.map_service.mapper;

import com.t1.map_service.dto.floor.FloorShortDto;
import com.t1.map_service.model.entity.Floor;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:33+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class FloorShortMapperImpl implements FloorShortMapper {

    @Override
    public FloorShortDto toDto(Floor floor) {
        if ( floor == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        Integer orderNumber = null;

        id = floor.getId();
        name = floor.getName();
        orderNumber = floor.getOrderNumber();

        FloorShortDto floorShortDto = new FloorShortDto( id, name, orderNumber );

        return floorShortDto;
    }

    @Override
    public Floor toEntity(FloorShortDto floorShortDto) {
        if ( floorShortDto == null ) {
            return null;
        }

        Floor.FloorBuilder floor = Floor.builder();

        floor.id( floorShortDto.id() );
        floor.name( floorShortDto.name() );
        if ( floorShortDto.orderNumber() != null ) {
            floor.orderNumber( floorShortDto.orderNumber() );
        }

        return floor.build();
    }
}
