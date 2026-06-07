package com.t1.map_service.mapper;

import com.t1.map_service.dto.layer.LayerShortDto;
import com.t1.map_service.model.entity.Layer;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-14T22:04:33+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class LayerShortMapperImpl implements LayerShortMapper {

    @Override
    public LayerShortDto toDto(Layer layer) {
        if ( layer == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        boolean base = false;

        id = layer.getId();
        name = layer.getName();
        base = layer.isBase();

        LayerShortDto layerShortDto = new LayerShortDto( id, name, base );

        return layerShortDto;
    }

    @Override
    public List<LayerShortDto> toDtoList(List<Layer> layers) {
        if ( layers == null ) {
            return null;
        }

        List<LayerShortDto> list = new ArrayList<LayerShortDto>( layers.size() );
        for ( Layer layer : layers ) {
            list.add( toDto( layer ) );
        }

        return list;
    }
}
