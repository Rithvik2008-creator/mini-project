package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.entity.Equipment;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api")
public class EquipmentController {

    @GetMapping("/equipment")
    public List<String> getEquipment() {
        return Arrays.stream(Equipment.values()).map(Enum::name).toList();
    }
}
