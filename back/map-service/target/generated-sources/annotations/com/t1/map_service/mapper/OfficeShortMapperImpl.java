package com.t1.map_service.mapper;

import com.t1.map_service.dto.floor.FloorShortDto;
import com.t1.map_service.dto.office.OfficeShortDto;
import com.t1.map_service.model.entity.Floor;
import com.t1.map_service.model.entity.Office;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:34+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class OfficeShortMapperImpl implements OfficeShortMapper {

    @Autowired
    private FloorShortMapper floorShortMapper;

    @Override
    public OfficeShortDto toDto(Office office) {
        if ( office == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        List<FloorShortDto> floors = null;

        id = office.getId();
        name = office.getName();
        floors = floorListToFloorShortDtoList( office.getFloors() );

        FloorShortDto startFloor = findStartFloor(office);

        OfficeShortDto officeShortDto = new OfficeShortDto( id, name, startFloor, floors );

        return officeShortDto;
    }

    protected List<FloorShortDto> floorListToFloorShortDtoList(List<Floor> list) {
        if ( list == null ) {
            return null;
        }

        List<FloorShortDto> list1 = new ArrayList<FloorShortDto>( list.size() );
        for ( Floor floor : list ) {
            list1.add( floorShortMapper.toDto( floor ) );
        }

        return list1;
    }
}
