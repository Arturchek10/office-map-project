package com.t1.map_service.mapper;

import com.t1.map_service.dto.marker.MarkerShortDto;
import com.t1.map_service.model.Point;
import com.t1.map_service.model.entity.Marker;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:34+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class MarkerShortMapperImpl implements MarkerShortMapper {

    @Override
    public MarkerShortDto toDto(Marker marker) {
        if ( marker == null ) {
            return null;
        }

        Long id = null;
        Point position = null;

        id = marker.getId();
        position = marker.getPosition();

        String type = mapType(marker);

        MarkerShortDto markerShortDto = new MarkerShortDto( id, position, type );

        return markerShortDto;
    }

    @Override
    public List<MarkerShortDto> toDtoList(List<Marker> markers) {
        if ( markers == null ) {
            return null;
        }

        List<MarkerShortDto> list = new ArrayList<MarkerShortDto>( markers.size() );
        for ( Marker marker : markers ) {
            list.add( toDto( marker ) );
        }

        return list;
    }
}
