package com.example.roadmaintenance.repository;

import com.example.roadmaintenance.entity.UserEntity;
import com.example.roadmaintenance.security.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<UserEntity> findByRole(UserRole role);
    List<UserEntity> findByTeamId(String teamId);
    long countByRole(UserRole role);
}
