package com.suvix.payment.domain.subscription.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationSummary {

    private Instant startedAt;
    private Instant completedAt;
    private long totalProcessed;
    private long totalMatched;
    private long totalDiscrepancies;
    private long totalHealed;
    private long totalFlagged;
    private String executionStatus;

    @Builder.Default
    private List<DiscrepancyItem> discrepancyDetails = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiscrepancyItem {
        private String subscriptionId;
        private String userId;
        private String dbStatus;
        private String gatewayStatus;
        private String discrepancyType;
        private String actionTaken;
    }
}