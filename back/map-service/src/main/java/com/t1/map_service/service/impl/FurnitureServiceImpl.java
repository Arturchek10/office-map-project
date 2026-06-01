package com.t1.map_service.service.impl;

import com.t1.map_service.dto.furniture.*;
import com.t1.map_service.exception.EntityAlreadyExistsException;
import com.t1.map_service.exception.EntityNotFoundException;
import com.t1.map_service.mapper.furniture.FurnitureMapper;
import com.t1.map_service.mapper.furniture.FurnitureShortMapper;
import com.t1.map_service.model.entity.Floor;
import com.t1.map_service.model.entity.Furniture;
import com.t1.map_service.repository.FurnitureRepository;
import com.t1.map_service.service.FurnitureService;
import com.t1.map_service.service.inner.FloorInnerService;
import com.t1.map_service.service.inner.FurnitureInnerService;
import com.t1.map_service.service.photo.impl.FurniturePhotoService;
import com.t1.map_service.storage.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class FurnitureServiceImpl implements FurnitureService {

    private final FurnitureRepository repository;
    private final FurnitureInnerService innerService;
    private final FurnitureMapper mapper;
    private final FurnitureShortMapper shortMapper;
    private final FloorInnerService floorService;

    private final FileStorageService storage;
    private final FurniturePhotoService photoService;

    @Value("${app.files.presign_minutes:10}")
    private int presignMinutes;

    private Duration durationTtl;

    @PostConstruct
    public void init() {
        this.durationTtl = Duration.ofMinutes(presignMinutes);
    }

    @Override
    public FurnitureDto getFurnitureById(Long furnitureId) {
        log.debug("Get furniture: start (furnitureId={})", furnitureId);

        Furniture furniture = innerService.getEntityById(furnitureId);

        log.debug("Get furniture: success (furnitureId={}, name={})",
                furniture.getId(), furniture.getName());

        return mapper.toDto(furniture, storage, durationTtl);
    }

    @Override
    @Transactional
    public FurnitureDto create(FurnitureCreateRequest request, MultipartFile photo) {
        log.debug("Create furniture: start (name={})", request.name());

        if (repository.existsByNameIgnoreCase(request.name())) {
            log.warn("Create furniture: already exists (name={})", request.name());
            throw new EntityAlreadyExistsException("Furniture with name %s already exists".formatted(request.name()));
        }

        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("Photo is required");
        }

        Furniture furniture = mapper.toEntity(request);

        String key = storage.uploadImage(photo, null); // storage сам сгенерирует id, не передаем объект (будет uploads)
        furniture.setPhotoKey(key);

        Furniture saved = repository.save(furniture);

        log.info("Furniture created (furnitureId={}, name={})", saved.getId(), saved.getName());
        return mapper.toDto(saved, storage, durationTtl);
    }

    @Override
    @Transactional
    public FurnitureDto placeFurniture(Long floorId, FurniturePlaceRequest request) {
        log.debug("Place furniture: start (floorId={}, name={})", floorId, request.name());

//        if (!repository.existsByNameIgnoreCase(request.name())) {
//            log.warn("Place furniture: furniture not found (name={})", request.name());
//            throw new EntityNotFoundException("Furniture with name=%s not found".formatted(request.name()));
//        }

        Floor relatedFloor = floorService.getEntityById(floorId);
        log.debug("Place furniture: floor loaded (floorId={})", floorId);

        Furniture furniture = mapper.toEntity(request);
        furniture.setFloor(relatedFloor);

        String key = storage.extractObjectKeyFromUrl(request.photoUrl());

        if(key == null || key.isBlank()) {
            throw new IllegalArgumentException("Cannot extract photo key from provided photoUrl");
        }
        furniture.setPhotoKey(key);
        Furniture saved = repository.save(furniture);

        log.info("Furniture placed (furnitureId={}, floorId={}, name={})",
                saved.getId(), floorId, saved.getName());

        return mapper.toDto(saved, storage, durationTtl);
    }

    @Override
    @Transactional
    public FurnitureDto move(Long furnitureId, FurnitureMoveRequest request) {
        log.debug("Move furniture: start (furnitureId={})", furnitureId);

        Furniture furniture = innerService.getEntityById(furnitureId);
        furniture.setPosition(request.position());

        Furniture saved = repository.save(furniture);
        log.info("Furniture moved (furnitureId={}, position={})",
                saved.getId(), saved.getPosition());

        return mapper.toDto(saved, storage, durationTtl);
    }

    @Override
    @Transactional
    public FurnitureDto updateUi(Long furnitureId, FurniturePatchUiRequest request) {
        log.debug("Update furniture UI: start (furnitureId={})", furnitureId);

        Furniture furniture = innerService.getEntityById(furnitureId);
        mapper.update(furniture, request);

        Furniture saved = repository.save(furniture);
        log.info("Furniture UI updated (furnitureId={})", saved.getId());

        return mapper.toDto(saved, storage, durationTtl);
    }

    @Override
    @Transactional
    public FurnitureDto update(Long furnitureId, FurniturePatchRequest request, MultipartFile photo) {
        log.debug("Update furniture: start (furnitureId={})", furnitureId);

        Furniture furniture = innerService.getEntityById(furnitureId);

        mapper.update(furniture, request);

        if (Boolean.TRUE.equals(request.removePhoto())) {
            photoService.removePhoto(furniture);
        } else if (photo != null && !photo.isEmpty()) {
            photoService.replacePhoto(furniture, photo);
        }

        log.info("Furniture updated (furnitureId={})", furnitureId);
        return mapper.toDto(furniture, storage, durationTtl);
    }

    @Override
    @Transactional
    public void deleteFurniture(Long furnitureId) {
        log.error("DELETE CALLED {}", furnitureId);
        log.debug("Delete furniture: start (furnitureId={})", furnitureId);

        Furniture furniture = innerService.getEntityById(furnitureId);

        repository.delete(furniture);

        log.info("Furniture deleted (furnitureId={})", furnitureId);
    }

    @Override
    public Page<FurnitureShortDto> getCatalog(Pageable pageable) {
        log.debug("Get furniture catalog: start (page={}, size={}, sort={})",
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());

        Page<FurnitureShortDto> page = innerService.getAllUnique(pageable)
                .map(f -> shortMapper.toDto(f, storage, durationTtl));

        log.debug("Get furniture catalog: success (elements={}, total={})",
                page.getNumberOfElements(), page.getTotalElements());

        return page;
    }
}
