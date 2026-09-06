package com.suvix.payment.domain.billing.service;

import com.suvix.payment.domain.billing.dto.GstTaxBreakdown;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
public class GstTaxRuleEngine {

    @Value("${suvix.billing.seller-state-code:29}") // Default 29 = Karnataka
    private String sellerStateCode;

    public static final String SAC_OIDAR = "998439"; // Other information technology services n.e.c.
    private static final BigDecimal STANDARD_GST_RATE = new BigDecimal("18.00");
    private static final BigDecimal HALF_GST_RATE = new BigDecimal("9.00");

    /**
     * Computes exact CGST/SGST vs IGST breakdown based on customer state and GSTIN
     */
    public GstTaxBreakdown calculateGst(BigDecimal grossAmount, String customerGstin, String customerStateCode, String currency) {
        if (grossAmount == null || grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return GstTaxBreakdown.builder()
                    .taxableAmount(BigDecimal.ZERO)
                    .cgstRate(BigDecimal.ZERO)
                    .cgstAmount(BigDecimal.ZERO)
                    .sgstRate(BigDecimal.ZERO)
                    .sgstAmount(BigDecimal.ZERO)
                    .igstRate(BigDecimal.ZERO)
                    .igstAmount(BigDecimal.ZERO)
                    .totalTax(BigDecimal.ZERO)
                    .totalAmount(BigDecimal.ZERO)
                    .sacCode(SAC_OIDAR)
                    .taxType("EXEMPT")
                    .placeOfSupply(customerStateCode != null ? customerStateCode : "Unknown")
                    .build();
        }

        // Check if international / non-INR (Export of services under Letter of Undertaking - LUT)
        if (currency != null && !"INR".equalsIgnoreCase(currency)) {
            return GstTaxBreakdown.builder()
                    .taxableAmount(grossAmount)
                    .cgstRate(BigDecimal.ZERO)
                    .cgstAmount(BigDecimal.ZERO)
                    .sgstRate(BigDecimal.ZERO)
                    .sgstAmount(BigDecimal.ZERO)
                    .igstRate(BigDecimal.ZERO)
                    .igstAmount(BigDecimal.ZERO)
                    .totalTax(BigDecimal.ZERO)
                    .totalAmount(grossAmount)
                    .sacCode(SAC_OIDAR)
                    .taxType("EXPORT_LUT")
                    .placeOfSupply("Outside India")
                    .build();
        }

        // Determine Customer State from GSTIN (first 2 digits) or customerStateCode
        String buyerState = sellerStateCode; // default intra-state
        if (customerGstin != null && customerGstin.trim().length() >= 2) {
            buyerState = customerGstin.trim().substring(0, 2);
        } else if (customerStateCode != null && !customerStateCode.isBlank()) {
            buyerState = customerStateCode.trim();
        }

        // Back-calculate taxable subtotal: Subtotal = Gross / 1.18
        BigDecimal divisor = BigDecimal.ONE.add(STANDARD_GST_RATE.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal taxableAmount = grossAmount.divide(divisor, 4, RoundingMode.HALF_UP);
        BigDecimal totalTax = grossAmount.subtract(taxableAmount).setScale(4, RoundingMode.HALF_UP);

        if (sellerStateCode.equalsIgnoreCase(buyerState)) {
            // Intra-state supply: 9% CGST + 9% SGST
            BigDecimal halfTax = totalTax.divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);
            return GstTaxBreakdown.builder()
                    .taxableAmount(taxableAmount)
                    .cgstRate(HALF_GST_RATE)
                    .cgstAmount(halfTax)
                    .sgstRate(HALF_GST_RATE)
                    .sgstAmount(halfTax)
                    .igstRate(BigDecimal.ZERO)
                    .igstAmount(BigDecimal.ZERO)
                    .totalTax(totalTax)
                    .totalAmount(grossAmount)
                    .sacCode(SAC_OIDAR)
                    .taxType("INTRA_STATE")
                    .placeOfSupply(buyerState)
                    .build();
        } else {
            // Inter-state supply: 18% IGST
            return GstTaxBreakdown.builder()
                    .taxableAmount(taxableAmount)
                    .cgstRate(BigDecimal.ZERO)
                    .cgstAmount(BigDecimal.ZERO)
                    .sgstRate(BigDecimal.ZERO)
                    .sgstAmount(BigDecimal.ZERO)
                    .igstRate(STANDARD_GST_RATE)
                    .igstAmount(totalTax)
                    .totalTax(totalTax)
                    .totalAmount(grossAmount)
                    .sacCode(SAC_OIDAR)
                    .taxType("INTER_STATE")
                    .placeOfSupply(buyerState)
                    .build();
        }
    }
}