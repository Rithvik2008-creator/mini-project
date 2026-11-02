package com.example.roadmaintenance.repository;

import com.example.roadmaintenance.entity.MaintenanceTeamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamRepository extends JpaRepository<MaintenanceTeamEntity, String> {
    List<MaintenanceTeamEntity> findByAvailableTrue();
    List<MaintenanceTeamEntity> findByAvailableFalse();
}
