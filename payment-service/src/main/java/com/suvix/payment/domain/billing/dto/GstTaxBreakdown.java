package com.suvix.payment.domain.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstTaxBreakdown {

    private BigDecimal taxableAmount;
    private BigDecimal cgstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstRate;
    private BigDecimal sgstAmount;
    private BigDecimal igstRate;
    private BigDecimal igstAmount;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;

    @Builder.Default
    private String sacCode = "998439";

    @Builder.Default
    private String taxType = "INTRA_STATE"; // INTRA_STATE (CGST+SGST), INTER_STATE (IGST), EXPORT_LUT
    private String placeOfSupply;
}