package com.t1.map_service.mapper;

import com.t1.map_service.dto.layer.LayerCreateRequest;
import com.t1.map_service.dto.layer.LayerDto;
import com.t1.map_service.dto.layer.LayerUpdateRequest;
import com.t1.map_service.dto.marker.MarkerShortDto;
import com.t1.map_service.model.entity.Layer;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:33+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class LayerMapperImpl implements LayerMapper {

    @Autowired
    private MarkerShortMapper markerShortMapper;

    @Override
    public LayerDto toDto(Layer layer) {
        if ( layer == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        List<MarkerShortDto> markers = null;

        id = layer.getId();
        name = layer.getName();
        markers = markerShortMapper.toDtoList( layer.getMarkers() );

        LayerDto layerDto = new LayerDto( id, name, markers );

        return layerDto;
    }

    @Override
    public Layer toEntity(LayerCreateRequest request) {
        if ( request == null ) {
            return null;
        }

        Layer.LayerBuilder layer = Layer.builder();

        layer.name( request.name() );

        return layer.build();
    }

    @Override
    public void update(Layer target, LayerUpdateRequest source) {
        if ( source == null ) {
            return;
        }

        if ( source.name() != null ) {
            target.setName( source.name() );
        }
    }
}
