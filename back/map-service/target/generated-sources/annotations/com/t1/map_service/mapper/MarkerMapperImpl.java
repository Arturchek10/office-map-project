package com.t1.map_service.mapper;

import com.t1.map_service.dto.description.DescriptionDto;
import com.t1.map_service.dto.marker.MarkerDto;
import com.t1.map_service.dto.marker.UpdateMarkerRequest;
import com.t1.map_service.enums.MarkerType;
import com.t1.map_service.model.Point;
import com.t1.map_service.model.entity.Marker;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:32+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class MarkerMapperImpl implements MarkerMapper {

    @Autowired
    private DescriptionMapper descriptionMapper;

    @Override
    public void update(Marker target, UpdateMarkerRequest source) {
        if ( source == null ) {
            return;
        }

        if ( source.name() != null ) {
            target.setName( source.name() );
        }
        if ( source.uncomfortable() != null ) {
            target.setUncomfortable( source.uncomfortable() );
        }

        target.setType( mapTypeFromRequest(source) );
    }

    @Override
    public MarkerDto toDto(Marker marker) {
        if ( marker == null ) {
            return null;
        }

        DescriptionDto payload = null;
        Long id = null;
        String name = null;
        Point position = null;
        boolean uncomfortable = false;

        payload = descriptionMapper.toDto( marker.getDescription() );
        id = marker.getId();
        name = marker.getName();
        position = marker.getPosition();
        uncomfortable = marker.isUncomfortable();

        String type = mapTypeToString(marker);

        MarkerDto markerDto = new MarkerDto( id, name, type, position, uncomfortable, payload );

        return markerDto;
    }

    @Override
    public List<MarkerDto> toDtoList(List<Marker> markers) {
        if ( markers == null ) {
            return null;
        }

        List<MarkerDto> list = new ArrayList<MarkerDto>( markers.size() );
        for ( Marker marker : markers ) {
            list.add( toDto( marker ) );
        }

        return list;
    }

    @Override
    public Marker toEntity(UpdateMarkerRequest request) {
        if ( request == null ) {
            return null;
        }

        Marker.MarkerBuilder marker = Marker.builder();

        marker.name( request.name() );
        if ( request.type() != null ) {
            marker.type( Enum.valueOf( MarkerType.class, request.type() ) );
        }
        if ( request.uncomfortable() != null ) {
            marker.uncomfortable( request.uncomfortable() );
        }

        return marker.build();
    }
}
