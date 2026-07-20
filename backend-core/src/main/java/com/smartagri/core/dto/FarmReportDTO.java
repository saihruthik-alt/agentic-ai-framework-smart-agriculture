package com.smartagri.core.dto;

import com.smartagri.core.domain.Crop;
import com.smartagri.core.domain.Farm;
import com.smartagri.core.domain.SensorLog;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FarmReportDTO {
    private UUID farmId;
    private String farmName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String soilType;
    private BigDecimal totalAreaHectares;
    
    private List<CropSummary> crops;
    private TelemetrySummary latestTelemetry;
    private LocalDateTime compiledAt;

    @Data
    @Builder
    public static class CropSummary {
        private UUID cropId;
        private String name;
        private String variety;
        private String status;
        private String plantedAt;
        private String harvestPlannedAt;
    }

    @Data
    @Builder
    public static class TelemetrySummary {
        private BigDecimal soilMoisture;
        private BigDecimal soilTemp;
        private BigDecimal npkNitrogen;
        private BigDecimal npkPhosphorus;
        private BigDecimal npkPotassium;
        private String lastRecordedAt;
    }
}
