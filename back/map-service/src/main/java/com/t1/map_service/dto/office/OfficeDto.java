package com.t1.map_service.dto.office;


public record OfficeDto(
        Long id,
        String name,
        String address,
        Double latitude,
        Double longitude,
        String city,
        String photoUrl,
        Integer floorsCount
) {
}
