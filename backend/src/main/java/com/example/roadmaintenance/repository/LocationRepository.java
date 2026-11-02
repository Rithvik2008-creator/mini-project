package com.example.roadmaintenance.repository;

import com.example.roadmaintenance.entity.LocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<LocationEntity, Long> {
    boolean existsByNameIgnoreCase(String name);
    LocationEntity findByNameIgnoreCase(String name);
}
