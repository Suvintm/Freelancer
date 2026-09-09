package com.suvix.payment.domain.billing.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.suvix.payment.domain.billing.dto.GstTaxBreakdown;
import com.suvix.payment.domain.billing.entity.Invoice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoicePdfService {

    private final GstTaxRuleEngine gstTaxRuleEngine;
    private final ObjectMapper objectMapper;

    @Value("${suvix.billing.company-name:SuviX Platform Services}")
    private String companyName;

    @Value("${suvix.billing.gstin:29ABCDE1234F1Z5}")
    private String platformGstin;

    @Value("${suvix.billing.address:Manyata Tech Park, Nagawara, Bengaluru, Karnataka, India}")
    private String platformAddress;

    private static final DateTimeFormatter DATE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(ZoneId.of("Asia/Kolkata"));

    private static final DateTimeFormatter DATE_ONLY_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy");

    /**
     * Generates high-speed, enterprise-grade GST tax invoice PDF
     */
    public byte[] generateInvoicePdf(Invoice invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 32, 32, 32, 32);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Premium Enterprise Theme Palette
            Color darkBrand = new Color(15, 23, 42);      // Slate 900
            Color primaryIndigo = new Color(79, 70, 229); // Indigo 600
            Color textPrimary = new Color(30, 41, 59);    // Slate 800
            Color textMuted = new Color(100, 116, 139);   // Slate 500
            Color bgCard = new Color(248, 250, 252);      // Slate 50
            Color borderColor = new Color(226, 232, 240); // Slate 200
            Color emeraldSuccess = new Color(22, 163, 74);// Emerald 600
            Color amberWarning = new Color(217, 119, 6);  // Amber 600

            boolean isUsd = "USD".equalsIgnoreCase(invoice.getCurrency());
            String currSymbol = isUsd ? "$" : "₹";
            String currCode = isUsd ? "USD" : "INR";

            Font companyHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, darkBrand);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, Color.WHITE);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, textPrimary);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, textPrimary);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, textPrimary);
            Font mutedFont = FontFactory.getFont(FontFactory.HELVETICA, 8, textMuted);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, textMuted);

            // Parse Line Items & Extract Upgrade Metadata
            List<Map<String, Object>> parsedItems = new ArrayList<>();
            Map<String, Object> upgradeMetadata = null;
            if (invoice.getLineItems() != null && !invoice.getLineItems().isBlank()) {
                try {
                    parsedItems = objectMapper.readValue(
                            invoice.getLineItems(),
                            new TypeReference<List<Map<String, Object>>>() {}
                    );
                } catch (Exception ignored) {}
            }

            boolean isUpgrade = invoice.isProrated() || (invoice.getProrationCredit() != null && invoice.getProrationCredit().compareTo(BigDecimal.ZERO) > 0);
            boolean isDowngrade = false;

            if (parsedItems != null) {
                for (Map<String, Object> item : parsedItems) {
                    String type = (String) item.get("type");
                    if ("UPGRADE_METADATA".equalsIgnoreCase(type)) {
                        upgradeMetadata = item;
                        isUpgrade = true;
                    } else if ("PRORATION".equalsIgnoreCase(type) || "UPGRADE".equalsIgnoreCase(type)) {
                        isUpgrade = true;
                    } else if ("DOWNGRADE".equalsIgnoreCase(type)) {
                        isDowngrade = true;
                    }
                }
            }

            // ─────────────────────────────────────────────────────────────────
            // 1. TOP HEADER SECTION: Brand Logo (Left) + Tax Invoice (Right)
            // ─────────────────────────────────────────────────────────────────
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{55, 45});

            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.setPaddingBottom(8);

            // Embed brand logo
            try {
                java.io.InputStream logoStream = getClass().getResourceAsStream("/images/blackbglogo.png");
                if (logoStream == null) {
                    logoStream = getClass().getResourceAsStream("/images/logo.png");
                }
                if (logoStream != null) {
                    byte[] logoBytes = logoStream.readAllBytes();
                    Image logoImg = Image.getInstance(logoBytes);
                    logoImg.scaleToFit(145, 42);
                    leftHeader.addElement(logoImg);
                } else {
                    leftHeader.addElement(new Paragraph(companyName, companyHeaderFont));
                }
            } catch (Exception e) {
                leftHeader.addElement(new Paragraph(companyName, companyHeaderFont));
            }

            Paragraph compDetails = new Paragraph();
            compDetails.setSpacingBefore(3);
            compDetails.add(new Chunk("GSTIN: " + platformGstin + "  |  SAC: 998439 (SaaS Services)\n", boldFont));
            compDetails.add(new Chunk(platformAddress + "\n", smallFont));
            compDetails.add(new Chunk("Email: billing@suvix.in  |  Website: https://suvix.in", smallFont));
            leftHeader.addElement(compDetails);

            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightHeader.setPaddingBottom(8);

            String invTitleText = isUsd ? "COMMERCIAL INVOICE / RECEIPT" : "TAX INVOICE";
            Paragraph invTitle = new Paragraph(invTitleText, FontFactory.getFont(FontFactory.HELVETICA_BOLD, isUsd ? 14 : 17, primaryIndigo));
            invTitle.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invTitle);

            // Subtitle Badge (Upgrade / Downgrade / New Subscription / Renewal)
            String transitionBadgeText;
            Color transitionBadgeColor = emeraldSuccess;
            if (isUpgrade) {
                transitionBadgeText = "★ PLAN UPGRADE INVOICE (Tax-Inclusive MRP)";
                transitionBadgeColor = primaryIndigo;
            } else if (isDowngrade) {
                transitionBadgeText = "★ PLAN DOWNGRADE RECEIPT (Tax-Inclusive MRP)";
                transitionBadgeColor = amberWarning;
            } else if (isUsd) {
                transitionBadgeText = "0% Tax Export of Services (LUT Sec 16)";
            } else {
                transitionBadgeText = "★ TAX-INCLUSIVE INVOICE (All Taxes Included)";
            }

            Paragraph badgePara = new Paragraph(transitionBadgeText, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, transitionBadgeColor));
            badgePara.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(badgePara);

            Paragraph invNum = new Paragraph("Invoice No: " + invoice.getInvoiceNumber(), boldFont);
            invNum.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invNum);

            // Format exact Date and Timestamp
            String formattedDate;
            if (invoice.getPaidAt() != null) {
                formattedDate = DATE_TIME_FORMAT.format(invoice.getPaidAt());
            } else if (invoice.getCreatedAt() != null) {
                formattedDate = DATE_TIME_FORMAT.format(invoice.getCreatedAt());
            } else if (invoice.getInvoiceDate() != null) {
                formattedDate = invoice.getInvoiceDate().format(DATE_ONLY_FORMAT);
            } else {
                formattedDate = DATE_TIME_FORMAT.format(java.time.Instant.now());
            }

            Paragraph invDate = new Paragraph("Issue Date & Time: " + formattedDate + " IST", normalFont);
            invDate.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invDate);

            String placeOfSupplyText = isUsd ? "Place of Supply: International Export (LUT: Sec 16)" : "Place of Supply: 29 - Karnataka (India)";
            Paragraph posPara = new Paragraph(placeOfSupplyText, mutedFont);
            posPara.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(posPara);

            Paragraph statusPara = new Paragraph("Status: " + invoice.getStatus().name().toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, emeraldSuccess));
            statusPara.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(statusPara);

            headerTable.addCell(leftHeader);
            headerTable.addCell(rightHeader);
            document.add(headerTable);

            // Elegant Divider Line
            PdfPTable divTable = new PdfPTable(1);
            divTable.setWidthPercentage(100);
            PdfPCell divCell = new PdfPCell();
            divCell.setBorder(Rectangle.BOTTOM);
            divCell.setBorderColor(borderColor);
            divCell.setFixedHeight(3);
            divCell.setPadding(0);
            divTable.addCell(divCell);
            document.add(divTable);

            document.add(new Paragraph(" "));

            // ─────────────────────────────────────────────────────────────────
            // 2. BILLED TO & PAYMENT METADATA (Dual Box Layout)
            // ─────────────────────────────────────────────────────────────────
            PdfPTable metaGrid = new PdfPTable(2);
            metaGrid.setWidthPercentage(100);
            metaGrid.setWidths(new float[]{50, 50});

            // Box A: Billed To
            PdfPCell billedToCell = new PdfPCell();
            billedToCell.setBackgroundColor(bgCard);
            billedToCell.setBorderColor(borderColor);
            billedToCell.setPadding(8);
            billedToCell.addElement(new Paragraph("BILLED TO (CUSTOMER)", sectionTitleFont));
            billedToCell.addElement(new Paragraph("Name: " + invoice.getCustomerName(), normalFont));
            billedToCell.addElement(new Paragraph("Email: " + invoice.getCustomerEmail(), normalFont));
            billedToCell.addElement(new Paragraph("Account Ref: " + invoice.getUserId(), smallFont));
            if (invoice.getCustomerGstin() != null && !invoice.getCustomerGstin().isBlank()) {
                billedToCell.addElement(new Paragraph("Customer GSTIN: " + invoice.getCustomerGstin() + " (B2B Tax Credit Eligible)", boldFont));
            } else {
                billedToCell.addElement(new Paragraph("GST Type: Unregistered Consumer (B2C - All Taxes Included)", smallFont));
            }
            metaGrid.addCell(billedToCell);

            // Box B: Payment & Transaction Details
            PdfPCell payMetaCell = new PdfPCell();
            payMetaCell.setBackgroundColor(bgCard);
            payMetaCell.setBorderColor(borderColor);
            payMetaCell.setPadding(8);
            payMetaCell.addElement(new Paragraph("PAYMENT & TRANSACTION DETAILS", sectionTitleFont));
            payMetaCell.addElement(new Paragraph("Payment Method: Online (UPI / Netbanking / Cards)", normalFont));
            payMetaCell.addElement(new Paragraph("Gateway: Razorpay Smart Payment Gateway", normalFont));
            payMetaCell.addElement(new Paragraph("Transaction ID: " + (invoice.getTransactionId() != null ? invoice.getTransactionId() : "TXN-" + invoice.getInvoiceNumber()), smallFont));
            payMetaCell.addElement(new Paragraph("Subscription Ref: " + (invoice.getSubscriptionId() != null ? invoice.getSubscriptionId() : "SUB-" + invoice.getUserId().substring(0, Math.min(8, invoice.getUserId().length()))), smallFont));
            metaGrid.addCell(payMetaCell);

            document.add(metaGrid);

            // ─────────────────────────────────────────────────────────────────
            // 2B. PLAN UPGRADE & PRORATION RECONCILIATION SUMMARY CARD
            // ─────────────────────────────────────────────────────────────────
            if (isUpgrade) {
                document.add(new Paragraph(" "));
                PdfPTable upgradeCard = new PdfPTable(1);
                upgradeCard.setWidthPercentage(100);

                PdfPCell uCell = new PdfPCell();
                uCell.setBackgroundColor(new Color(245, 247, 255)); // Indigo 50 tint
                uCell.setBorderColor(new Color(199, 210, 254));     // Indigo 200 border
                uCell.setPadding(8);

                Paragraph uHeader = new Paragraph("★ PLAN UPGRADE & PRORATION RECONCILIATION SUMMARY", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, primaryIndigo));
                uHeader.setSpacingAfter(4);
                uCell.addElement(uHeader);

                String fromPlanStr = upgradeMetadata != null && upgradeMetadata.get("fromPlanName") != null ? (String) upgradeMetadata.get("fromPlanName") : "Creator Pro";
                String toPlanStr = upgradeMetadata != null && upgradeMetadata.get("toPlanName") != null ? (String) upgradeMetadata.get("toPlanName") : "Creator Elite";
                String fromPriceStr = upgradeMetadata != null && upgradeMetadata.get("fromPlanPrice") != null ? currSymbol + upgradeMetadata.get("fromPlanPrice") : currSymbol + "499.00";
                String toPriceStr = upgradeMetadata != null && upgradeMetadata.get("toPlanPrice") != null ? currSymbol + upgradeMetadata.get("toPlanPrice") : currSymbol + "1,499.00";
                String remDaysStr = upgradeMetadata != null && upgradeMetadata.get("remainingDays") != null ? upgradeMetadata.get("remainingDays").toString() : "1";
                String totalDaysStr = upgradeMetadata != null && upgradeMetadata.get("totalDays") != null ? upgradeMetadata.get("totalDays").toString() : "1";
                String validUntilStr = upgradeMetadata != null && upgradeMetadata.get("validUntil") != null ? (String) upgradeMetadata.get("validUntil") : null;

                String formattedValidUntil = "End of Current Billing Period";
                if (validUntilStr != null && !validUntilStr.isBlank()) {
                    try {
                        java.time.Instant vInstant = java.time.Instant.parse(validUntilStr);
                        formattedValidUntil = DATE_TIME_FORMAT.format(vInstant) + " IST";
                    } catch (Exception ignored) {
                        formattedValidUntil = validUntilStr;
                    }
                }

                PdfPTable uGrid = new PdfPTable(2);
                uGrid.setWidthPercentage(100);
                uGrid.setWidths(new float[]{55, 45});

                PdfPCell uLeft = new PdfPCell();
                uLeft.setBorder(Rectangle.NO_BORDER);
                uLeft.addElement(new Paragraph("Upgrade Pathway: " + fromPlanStr + " (" + fromPriceStr + "/mo) ➔ " + toPlanStr + " (" + toPriceStr + "/mo)", boldFont));
                uLeft.addElement(new Paragraph("Proration Cycle: " + remDaysStr + " days remaining out of " + totalDaysStr + " days (Co-Term Active)", normalFont));
                Paragraph expiryP = new Paragraph("Plan Access Valid Until: " + formattedValidUntil, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, emeraldSuccess));
                uLeft.addElement(expiryP);
                uGrid.addCell(uLeft);

                PdfPCell uRight = new PdfPCell();
                uRight.setBorder(Rectangle.NO_BORDER);
                BigDecimal proratedChargeVal = upgradeMetadata != null && upgradeMetadata.get("proratedTargetCharge") != null
                        ? new BigDecimal(upgradeMetadata.get("proratedTargetCharge").toString())
                        : invoice.getTotalAmount().add(invoice.getProrationCredit() != null ? invoice.getProrationCredit() : BigDecimal.ZERO);
                BigDecimal creditRefundVal = invoice.getProrationCredit() != null && invoice.getProrationCredit().compareTo(BigDecimal.ZERO) > 0
                        ? invoice.getProrationCredit()
                        : (upgradeMetadata != null && upgradeMetadata.get("unusedCredit") != null ? new BigDecimal(upgradeMetadata.get("unusedCredit").toString()) : BigDecimal.ZERO);

                uRight.addElement(new Paragraph("New Plan Charge (" + remDaysStr + "d Prorated): " + String.format("%s%.2f", currSymbol, proratedChargeVal), normalFont));
                uRight.addElement(new Paragraph("Less: Unused Credit Refund: - " + String.format("%s%.2f", currSymbol, creditRefundVal), italicFont()));
                uRight.addElement(new Paragraph("Net Upgrade Paid Today: " + String.format("%s%.2f", currSymbol, invoice.getTotalAmount()) + " (Tax-Inclusive)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, darkBrand)));
                uGrid.addCell(uRight);

                uCell.addElement(uGrid);
                upgradeCard.addCell(uCell);
                document.add(upgradeCard);
            }

            document.add(new Paragraph(" "));

            // ─────────────────────────────────────────────────────────────────
            // 3. ITEMIZATION TABLE (Slate Header + Crisp Multi-Line Rows)
            // ─────────────────────────────────────────────────────────────────
            PdfPTable itemsTable = new PdfPTable(6);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{36, 12, 7, 15, 15, 15});

            addHeaderCell(itemsTable, "Item Description", headerFont, darkBrand);
            addHeaderCell(itemsTable, "SAC Code", headerFont, darkBrand);
            addHeaderCell(itemsTable, "Qty", headerFont, darkBrand);
            addHeaderCell(itemsTable, "Unit Rate (MRP)", headerFont, darkBrand);
            addHeaderCell(itemsTable, "Taxable Value", headerFont, darkBrand);
            addHeaderCell(itemsTable, "Amount (" + currCode + ")", headerFont, darkBrand);

            BigDecimal totalGrossBeforeDeductions = BigDecimal.ZERO;
            BigDecimal totalProrationDeducted = BigDecimal.ZERO;
            BigDecimal totalCouponDeducted = BigDecimal.ZERO;

            if (parsedItems != null && !parsedItems.isEmpty()) {
                for (Map<String, Object> item : parsedItems) {
                    String desc = (String) item.getOrDefault("description", "SuviX Subscription");
                    String sac = (String) item.getOrDefault("sacCode", "998439");
                    String type = (String) item.getOrDefault("type", "PLAN");

                    if ("UPGRADE_METADATA".equalsIgnoreCase(type)) {
                        continue; // Processed in dedicated upgrade card
                    }

                    BigDecimal grossVal = item.get("grossAmount") != null
                            ? new BigDecimal(item.get("grossAmount").toString())
                            : (item.get("amount") != null ? new BigDecimal(item.get("amount").toString()) : invoice.getTotalAmount());

                    BigDecimal taxableVal = item.get("taxableAmount") != null
                            ? new BigDecimal(item.get("taxableAmount").toString())
                            : (isUsd ? grossVal : grossVal.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP));

                    boolean isDeduction = grossVal.compareTo(BigDecimal.ZERO) < 0;

                    if ("PRORATION".equalsIgnoreCase(type) || desc.toLowerCase().contains("proration")) {
                        totalProrationDeducted = totalProrationDeducted.add(grossVal.abs());
                    } else if ("COUPON".equalsIgnoreCase(type) || desc.toLowerCase().contains("coupon")) {
                        totalCouponDeducted = totalCouponDeducted.add(grossVal.abs());
                    } else {
                        totalGrossBeforeDeductions = totalGrossBeforeDeductions.add(grossVal);
                    }

                    Font rowFont = isDeduction ? italicFont() : normalFont;
                    Font amtFont = isDeduction ? italicFont() : boldFont;

                    addRowCell(itemsTable, desc, rowFont, Element.ALIGN_LEFT);
                    addRowCell(itemsTable, sac, rowFont, Element.ALIGN_CENTER);
                    addRowCell(itemsTable, "1", rowFont, Element.ALIGN_CENTER);
                    addRowCell(itemsTable, String.format("%s%.2f", currSymbol, grossVal), rowFont, Element.ALIGN_RIGHT);
                    addRowCell(itemsTable, String.format("%s%.2f", currSymbol, taxableVal), rowFont, Element.ALIGN_RIGHT);
                    addRowCell(itemsTable, String.format("%s%.2f", currSymbol, grossVal), amtFont, Element.ALIGN_RIGHT);
                }
            } else {
                // Fallback for older single-item invoices
                String fallbackDesc = "SuviX Creator Subscription Access";
                BigDecimal targetGross = invoice.getTotalAmount();
                if (invoice.isProrated() && invoice.getProrationCredit().compareTo(BigDecimal.ZERO) > 0) {
                    targetGross = targetGross.add(invoice.getProrationCredit());
                }
                BigDecimal targetTaxable = isUsd ? targetGross : targetGross.divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
                totalGrossBeforeDeductions = targetGross;

                addRowCell(itemsTable, fallbackDesc, normalFont, Element.ALIGN_LEFT);
                addRowCell(itemsTable, "998439", normalFont, Element.ALIGN_CENTER);
                addRowCell(itemsTable, "1", normalFont, Element.ALIGN_CENTER);
                addRowCell(itemsTable, String.format("%s%.2f", currSymbol, targetGross), normalFont, Element.ALIGN_RIGHT);
                addRowCell(itemsTable, String.format("%s%.2f", currSymbol, targetTaxable), normalFont, Element.ALIGN_RIGHT);
                addRowCell(itemsTable, String.format("%s%.2f", currSymbol, targetGross), boldFont, Element.ALIGN_RIGHT);

                if (invoice.isProrated() && invoice.getProrationCredit().compareTo(BigDecimal.ZERO) > 0) {
                    totalProrationDeducted = invoice.getProrationCredit();
                    BigDecimal credTax = isUsd ? invoice.getProrationCredit() : invoice.getProrationCredit().divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);

                    addRowCell(itemsTable, "Proration Unused Balance Credit Applied", italicFont(), Element.ALIGN_LEFT);
                    addRowCell(itemsTable, "-", italicFont(), Element.ALIGN_CENTER);
                    addRowCell(itemsTable, "1", italicFont(), Element.ALIGN_CENTER);
                    addRowCell(itemsTable, "- " + currSymbol + String.format("%.2f", invoice.getProrationCredit()), italicFont(), Element.ALIGN_RIGHT);
                    addRowCell(itemsTable, "- " + currSymbol + String.format("%.2f", credTax), italicFont(), Element.ALIGN_RIGHT);
                    addRowCell(itemsTable, "- " + currSymbol + String.format("%.2f", invoice.getProrationCredit()), italicFont(), Element.ALIGN_RIGHT);
                }
            }

            document.add(itemsTable);
            document.add(new Paragraph(" "));

            // ─────────────────────────────────────────────────────────────────
            // 4. TAX CALCULATION & GST SUMMARY (Dual Split Table)
            // ─────────────────────────────────────────────────────────────────
            GstTaxBreakdown gst = gstTaxRuleEngine.calculateGst(
                    invoice.getTotalAmount(),
                    invoice.getCustomerGstin(),
                    null,
                    invoice.getCurrency()
            );

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{45, 55});

            // QR Code in bottom-left (Crisp & Well Sized)
            PdfPCell qrCell = new PdfPCell();
            qrCell.setBorder(Rectangle.BOX);
            qrCell.setBorderColor(borderColor);
            qrCell.setBackgroundColor(bgCard);
            qrCell.setPadding(8);
            qrCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            try {
                String qrData = String.format("GSTIN:%s|INV:%s|DATE:%s|TOTAL:%.2f|TAX:%.2f|IRN:AUTH-VERIFIED",
                        platformGstin, invoice.getInvoiceNumber(), invoice.getInvoiceDate(),
                        invoice.getTotalAmount(), isUsd ? BigDecimal.ZERO : gst.getTotalTax());
                Image qrImage = generateQrCodeImage(qrData, 75, 75);
                if (qrImage != null) {
                    qrImage.setAlignment(Element.ALIGN_CENTER);
                    qrCell.addElement(qrImage);
                    Paragraph scanPara = new Paragraph(isUsd ? "Scan to verify digital commercial invoice" : "Scan with any GST verification app to authenticate e-invoice", smallFont);
                    scanPara.setAlignment(Element.ALIGN_CENTER);
                    scanPara.setSpacingBefore(3);
                    qrCell.addElement(scanPara);
                }
            } catch (Exception e) {
                log.warn("Failed to embed QR code: {}", e.getMessage());
            }
            summaryTable.addCell(qrCell);

            // Totals breakdown on bottom-right
            PdfPCell totalsCell = new PdfPCell();
            totalsCell.setBorder(Rectangle.NO_BORDER);
            totalsCell.setPaddingLeft(10);

            PdfPTable totalsSubTable = new PdfPTable(2);
            totalsSubTable.setWidthPercentage(100);
            totalsSubTable.setWidths(new float[]{60, 40});

            if (isUsd) {
                if (totalGrossBeforeDeductions.compareTo(invoice.getTotalAmount()) > 0) {
                    addTotalRow(totalsSubTable, "Plan Gross Price:", String.format("$%.2f", totalGrossBeforeDeductions), normalFont);
                }
                if (totalProrationDeducted.compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "Proration Credit:", String.format("- $%.2f", totalProrationDeducted), italicFont());
                }
                if (totalCouponDeducted.compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "Coupon Discount:", String.format("- $%.2f", totalCouponDeducted), italicFont());
                }
                addTotalRow(totalsSubTable, "Taxable Subtotal:", String.format("$%.2f", invoice.getTotalAmount()), normalFont);
                addTotalRow(totalsSubTable, "Tax (0.0% Export LUT):", "$0.00", normalFont);
            } else {
                if (totalGrossBeforeDeductions.compareTo(invoice.getTotalAmount()) > 0) {
                    addTotalRow(totalsSubTable, "Plan Gross Price (MRP):", String.format("₹%.2f", totalGrossBeforeDeductions), normalFont);
                }
                if (totalProrationDeducted.compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "Unused Proration Credit:", String.format("- ₹%.2f", totalProrationDeducted), italicFont());
                }
                if (totalCouponDeducted.compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "Coupon Discount:", String.format("- ₹%.2f", totalCouponDeducted), italicFont());
                }

                addTotalRow(totalsSubTable, "Net Taxable Base Subtotal:", String.format("₹%.2f", gst.getTaxableAmount()), normalFont);

                if (gst.getCgstAmount().compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "CGST (9.0% Included):", String.format("₹%.2f", gst.getCgstAmount()), normalFont);
                    addTotalRow(totalsSubTable, "SGST (9.0% Included):", String.format("₹%.2f", gst.getSgstAmount()), normalFont);
                    addTotalRow(totalsSubTable, "Total GST (18.0% Included):", String.format("₹%.2f", gst.getTotalTax()), boldFont);
                } else if (gst.getIgstAmount().compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "IGST (18.0% Included):", String.format("₹%.2f", gst.getIgstAmount()), normalFont);
                    addTotalRow(totalsSubTable, "Total GST (18.0% Included):", String.format("₹%.2f", gst.getTotalTax()), boldFont);
                } else {
                    addTotalRow(totalsSubTable, "GST (Export / LUT):", "₹0.00", normalFont);
                }
            }

            PdfPCell lineCell1 = new PdfPCell();
            lineCell1.setBorder(Rectangle.BOTTOM);
            lineCell1.setBorderColor(borderColor);
            lineCell1.setFixedHeight(2);
            PdfPCell lineCell2 = new PdfPCell();
            lineCell2.setBorder(Rectangle.BOTTOM);
            lineCell2.setBorderColor(borderColor);
            lineCell2.setFixedHeight(2);
            totalsSubTable.addCell(lineCell1);
            totalsSubTable.addCell(lineCell2);

            addTotalRow(totalsSubTable, "Grand Total Paid (" + currCode + "):",
                    String.format("%s%.2f", currSymbol, invoice.getTotalAmount()),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13f, primaryIndigo));

            if (!isUsd) {
                PdfPCell inclNote = new PdfPCell(new Phrase("*(All 18% GST Taxes Included in Total Amount Paid)", boldFont));
                inclNote.setColspan(2);
                inclNote.setBorder(Rectangle.NO_BORDER);
                inclNote.setHorizontalAlignment(Element.ALIGN_RIGHT);
                inclNote.setPaddingTop(3);
                totalsSubTable.addCell(inclNote);
            }

            totalsCell.addElement(totalsSubTable);
            summaryTable.addCell(totalsCell);

            document.add(summaryTable);

            // ─────────────────────────────────────────────────────────────────
            // 5. LEGAL DISCLAIMER & COMPLIANCE FOOTER
            // ─────────────────────────────────────────────────────────────────
            document.add(new Paragraph(" "));
            PdfPTable footerTable = new PdfPTable(1);
            footerTable.setWidthPercentage(100);
            PdfPCell footerCell = new PdfPCell();
            footerCell.setBorder(Rectangle.TOP);
            footerCell.setBorderColor(borderColor);
            footerCell.setPaddingTop(8);

            String footerDisclaimer = isUsd
                    ? "This is a digitally generated commercial invoice for SaaS subscription services. Zero-rated export of services under Section 16 of the Indian IGST Act, 2017. No physical signature is required. For any billing questions, reach us at billing@suvix.in."
                    : "This is a digitally generated Tax Invoice issued in compliance with Rule 46 of the Indian CGST/SGST Rules, 2017 & Legal Metrology Act. Prices are Tax-Inclusive (MRP). SAC 998439. No physical signature is required. For any billing questions, reach us at billing@suvix.in.";

            Paragraph footer = new Paragraph(footerDisclaimer, smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footerCell.addElement(footer);
            footerTable.addCell(footerCell);
            document.add(footerTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for invoice {}: {}", invoice.getInvoiceNumber(), e.getMessage());
            throw new RuntimeException("PDF Generation Error", e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font, Color color) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(color);
        cell.setPadding(6);
        cell.setBorderColor(new Color(203, 213, 225));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addRowCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, font));
        lCell.setBorder(Rectangle.NO_BORDER);
        lCell.setPadding(2.5f);
        table.addCell(lCell);

        PdfPCell vCell = new PdfPCell(new Phrase(value, font));
        vCell.setBorder(Rectangle.NO_BORDER);
        vCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        vCell.setPadding(2.5f);
        table.addCell(vCell);
    }

    private Font italicFont() {
        return FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.DARK_GRAY);
    }

    private Image generateQrCodeImage(String text, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);
            ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOut);
            return Image.getInstance(pngOut.toByteArray());
        } catch (Exception e) {
            return null;
        }
    }
}