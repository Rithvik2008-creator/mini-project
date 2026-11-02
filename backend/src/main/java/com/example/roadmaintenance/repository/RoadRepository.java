package com.example.roadmaintenance.repository;

import com.example.roadmaintenance.entity.RoadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoadRepository extends JpaRepository<RoadEntity, Long> {
    List<RoadEntity> findByClosed(boolean closed);
    boolean existsBySourceAndDestinationAndTravelTime(String source, String destination, int travelTime);
}
