package com.t1.map_service.controller.furniture;

import com.t1.map_service.dto.furniture.*;
import com.t1.map_service.service.FurnitureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/furniture")
@RequiredArgsConstructor
public class FurnitureController implements FurnitureApi {

    private final FurnitureService furnitureService;

    @Override
    @GetMapping("/{furnitureId}")
    public ResponseEntity<FurnitureDto> getFurniture(
            @PathVariable Long furnitureId
    ) {
        return ResponseEntity.ok(furnitureService.getFurnitureById(furnitureId));
    }

    @Override
    @GetMapping("/catalog")
    public ResponseEntity<Page<FurnitureShortDto>> getFurnitureCatalog(
            Pageable pageable
    ) {
        return ResponseEntity.ok(furnitureService.getCatalog(pageable));
    }

    @Override
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<FurnitureDto> create(
            @RequestPart("data") @Valid FurnitureCreateRequest request,
            @RequestPart("photo") MultipartFile photo
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(furnitureService.create(request, photo));
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping( "/{floorId}")
    public ResponseEntity<FurnitureDto> place(
            @PathVariable Long floorId,
            @RequestBody @Valid FurniturePlaceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(furnitureService.placeFurniture(floorId, request));
    }

    @Override
    @PatchMapping("/move/{furnitureId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<FurnitureDto> move(
            @PathVariable Long furnitureId,
            @RequestBody @Valid FurnitureMoveRequest request
    ) {
        return ResponseEntity.ok(furnitureService.move(furnitureId, request));
    }

    @Override
    @PatchMapping("/ui/{furnitureId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<FurnitureDto> updateUi(
            @PathVariable Long furnitureId,
            @RequestBody @Valid FurniturePatchUiRequest request
    ) {
        return ResponseEntity.ok(furnitureService.updateUi(furnitureId, request));
    }

    @Override
    @PatchMapping(value = "/{furnitureId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<FurnitureDto> update(
            @PathVariable Long furnitureId,
            @RequestPart("data") @Valid FurniturePatchRequest request,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {
        return ResponseEntity.ok(furnitureService.update(furnitureId, request, photo));
    }

    @Override
    @DeleteMapping("/{furnitureId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long furnitureId
    ) {
        furnitureService.deleteFurniture(furnitureId);
        return ResponseEntity.noContent().build();
    }

}
