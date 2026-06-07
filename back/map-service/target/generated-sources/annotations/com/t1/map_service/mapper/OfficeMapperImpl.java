package com.t1.map_service.mapper;

import com.t1.map_service.dto.office.OfficeCreateRequest;
import com.t1.map_service.dto.office.OfficeDto;
import com.t1.map_service.dto.office.OfficeUpdateRequest;
import com.t1.map_service.model.entity.Office;
import com.t1.map_service.storage.FileStorageService;
import java.time.Duration;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-03T00:17:03+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class OfficeMapperImpl implements OfficeMapper {

    @Override
    public OfficeDto toDto(Office office) {
        if ( office == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String address = null;
        Double latitude = null;
        Double longitude = null;
        String city = null;

        id = office.getId();
        name = office.getName();
        address = office.getAddress();
        latitude = office.getLatitude();
        longitude = office.getLongitude();
        city = office.getCity();

        Integer floorsCount = office.getFloors() == null ? 0 : office.getFloors().size();
        String photoUrl = null;

        OfficeDto officeDto = new OfficeDto( id, name, address, latitude, longitude, city, photoUrl, floorsCount );

        return officeDto;
    }

    @Override
    public OfficeDto toDto(Office office, FileStorageService storage, Duration ttl) {
        if ( office == null ) {
            return null;
        }

        String photoUrl = null;
        Long id = null;
        String name = null;
        String address = null;
        Double latitude = null;
        Double longitude = null;
        String city = null;

        photoUrl = photoKeyToPresigned( office.getPhotoKey(), storage, ttl );
        id = office.getId();
        name = office.getName();
        address = office.getAddress();
        latitude = office.getLatitude();
        longitude = office.getLongitude();
        city = office.getCity();

        Integer floorsCount = office.getFloors() == null ? 0 : office.getFloors().size();

        OfficeDto officeDto = new OfficeDto( id, name, address, latitude, longitude, city, photoUrl, floorsCount );

        return officeDto;
    }

    @Override
    public Office toEntity(OfficeCreateRequest request) {
        if ( request == null ) {
            return null;
        }

        Office.OfficeBuilder office = Office.builder();

        office.name( request.name() );
        office.address( request.address() );
        office.city( request.city() );
        office.latitude( request.latitude() );
        office.longitude( request.longitude() );

        return office.build();
    }

    @Override
    public void update(Office target, OfficeUpdateRequest source) {
        if ( source == null ) {
            return;
        }

        if ( source.name() != null ) {
            target.setName( source.name() );
        }
        if ( source.address() != null ) {
            target.setAddress( source.address() );
        }
    }
}
