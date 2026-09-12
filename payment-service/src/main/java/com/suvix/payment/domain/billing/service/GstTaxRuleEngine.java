package com.suvix.payment.domain.billing.service;

import com.suvix.payment.domain.billing.dto.GstTaxBreakdown;
import com.suvix.payment.domain.billing.entity.TaxRule;
import com.suvix.payment.domain.billing.repository.TaxRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class GstTaxRuleEngine {

    private final TaxRuleRepository taxRuleRepository;

    @Value("${suvix.billing.seller-state-code:29}") // Default 29 = Karnataka
    private String sellerStateCode;

    public static final String SAC_OIDAR = "998439"; // Other information technology services n.e.c.
    private static final BigDecimal DEFAULT_GST_RATE = new BigDecimal("18.00");
    private static final BigDecimal DEFAULT_HALF_GST_RATE = new BigDecimal("9.00");

    /**
     * Resolves the active tax rule for a given country and state from DB.
     */
    public TaxRule resolveTaxRule(String currency, String countryCode, String stateCode) {
        String effectiveCountry = (currency != null && !"INR".equalsIgnoreCase(currency)) ? "US" : (countryCode != null ? countryCode : "IN");
        return taxRuleRepository.findActiveRule(effectiveCountry, stateCode)
                .orElseGet(() -> TaxRule.builder()
                        .countryCode(effectiveCountry)
                        .stateCode(stateCode != null ? stateCode : "ALL")
                        .taxName("GST")
                        .taxRate("IN".equalsIgnoreCase(effectiveCountry) ? DEFAULT_GST_RATE : BigDecimal.ZERO)
                        .cgstRate("IN".equalsIgnoreCase(effectiveCountry) ? DEFAULT_HALF_GST_RATE : BigDecimal.ZERO)
                        .sgstRate("IN".equalsIgnoreCase(effectiveCountry) ? DEFAULT_HALF_GST_RATE : BigDecimal.ZERO)
                        .igstRate("IN".equalsIgnoreCase(effectiveCountry) ? DEFAULT_GST_RATE : BigDecimal.ZERO)
                        .sacCode(SAC_OIDAR)
                        .isInclusive(true)
                        .isActive(true)
                        .build());
    }

    /**
     * Computes exact CGST/SGST vs IGST breakdown dynamically based on customer state, GSTIN, and DB tax rules
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

        // Determine Customer State from GSTIN (first 2 digits) or customerStateCode
        String buyerState = sellerStateCode; // default intra-state
        if (customerGstin != null && customerGstin.trim().length() >= 2) {
            buyerState = customerGstin.trim().substring(0, 2);
        } else if (customerStateCode != null && !customerStateCode.isBlank()) {
            buyerState = customerStateCode.trim();
        }

        TaxRule rule = resolveTaxRule(currency, "IN", buyerState);
        String sac = (rule.getSacCode() != null && !rule.getSacCode().isBlank()) ? rule.getSacCode() : SAC_OIDAR;

        // Check if international / non-INR (Export of services under Letter of Undertaking - LUT or 0% rate)
        if ((currency != null && !"INR".equalsIgnoreCase(currency)) || rule.getTaxRate().compareTo(BigDecimal.ZERO) == 0) {
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
                    .sacCode(sac)
                    .taxType("EXPORT_LUT")
                    .placeOfSupply("Outside India")
                    .build();
        }

        BigDecimal activeTaxRate = rule.getTaxRate();

        // Back-calculate taxable subtotal dynamically: Subtotal = Gross / (1 + taxRate/100)
        BigDecimal divisor = BigDecimal.ONE.add(activeTaxRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal taxableAmount = grossAmount.divide(divisor, 4, RoundingMode.HALF_UP);
        BigDecimal totalTax = grossAmount.subtract(taxableAmount).setScale(4, RoundingMode.HALF_UP);

        if (sellerStateCode.equalsIgnoreCase(buyerState)) {
            // Intra-state supply: CGST + SGST (dynamically from rule)
            BigDecimal cgstRate = rule.getCgstRate() != null ? rule.getCgstRate() : activeTaxRate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal sgstRate = rule.getSgstRate() != null ? rule.getSgstRate() : activeTaxRate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal halfTax = totalTax.divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);

            return GstTaxBreakdown.builder()
                    .taxableAmount(taxableAmount)
                    .cgstRate(cgstRate)
                    .cgstAmount(halfTax)
                    .sgstRate(sgstRate)
                    .sgstAmount(halfTax)
                    .igstRate(BigDecimal.ZERO)
                    .igstAmount(BigDecimal.ZERO)
                    .totalTax(totalTax)
                    .totalAmount(grossAmount)
                    .sacCode(sac)
                    .taxType("INTRA_STATE")
                    .placeOfSupply(buyerState)
                    .build();
        } else {
            // Inter-state supply: IGST (dynamically from rule)
            BigDecimal igstRate = rule.getIgstRate() != null ? rule.getIgstRate() : activeTaxRate;
            return GstTaxBreakdown.builder()
                    .taxableAmount(taxableAmount)
                    .cgstRate(BigDecimal.ZERO)
                    .cgstAmount(BigDecimal.ZERO)
                    .sgstRate(BigDecimal.ZERO)
                    .sgstAmount(BigDecimal.ZERO)
                    .igstRate(igstRate)
                    .igstAmount(totalTax)
                    .totalTax(totalTax)
                    .totalAmount(grossAmount)
                    .sacCode(sac)
                    .taxType("INTER_STATE")
                    .placeOfSupply(buyerState)
                    .build();
        }
    }
}