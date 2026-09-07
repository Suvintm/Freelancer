package com.suvix.payment.domain.billing.service;

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
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoicePdfService {

    private final GstTaxRuleEngine gstTaxRuleEngine;

    @Value("${suvix.billing.company-name:SuviX}")
    private String companyName;

    @Value("${suvix.billing.gstin:29ABCDE1234F1Z5}")
    private String platformGstin;

    @Value("${suvix.billing.address:Manyata Tech Park, Nagawara, Bengaluru, Karnataka, India}")
    private String platformAddress;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

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

            boolean isUsd = "USD".equalsIgnoreCase(invoice.getCurrency());
            String currSymbol = isUsd ? "$" : "₹";
            String currCode = isUsd ? "USD" : "INR";

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, darkBrand);
            Font companyHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, darkBrand);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, textPrimary);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, textPrimary);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, textPrimary);
            Font mutedFont = FontFactory.getFont(FontFactory.HELVETICA, 8, textMuted);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, textMuted);

            // ─────────────────────────────────────────────────────────────────
            // 1. TOP HEADER SECTION: Brand Logo (Left) + Tax Invoice (Right)
            // ─────────────────────────────────────────────────────────────────
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{55, 45});

            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.setPaddingBottom(8);

            // Embed blackbglogo.png or company branding
            try {
                java.io.InputStream logoStream = getClass().getResourceAsStream("/images/blackbglogo.png");
                if (logoStream == null) {
                    logoStream = getClass().getResourceAsStream("/images/logo.png");
                }
                if (logoStream != null) {
                    byte[] logoBytes = logoStream.readAllBytes();
                    Image logoImg = Image.getInstance(logoBytes);
                    logoImg.scaleToFit(160, 48);
                    leftHeader.addElement(logoImg);
                } else {
                    leftHeader.addElement(new Paragraph(companyName, companyHeaderFont));
                }
            } catch (Exception e) {
                leftHeader.addElement(new Paragraph(companyName, companyHeaderFont));
            }

            Paragraph compDetails = new Paragraph();
            compDetails.setSpacingBefore(4);
            compDetails.add(new Chunk(companyName + "\n", boldFont));
            compDetails.add(new Chunk("GSTIN: " + platformGstin + "  |  SAC: 998439 (SaaS Services)\n", boldFont));
            compDetails.add(new Chunk(platformAddress + "\n", smallFont));
            compDetails.add(new Chunk("Email: billing@suvix.in  |  Website: https://suvix.in", smallFont));
            leftHeader.addElement(compDetails);

            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightHeader.setPaddingBottom(8);

            String invTitleText = isUsd ? "COMMERCIAL INVOICE / RECEIPT" : "TAX INVOICE";
            Paragraph invTitle = new Paragraph(invTitleText, FontFactory.getFont(FontFactory.HELVETICA_BOLD, isUsd ? 14 : 18, primaryIndigo));
            invTitle.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invTitle);

            Paragraph invNum = new Paragraph("Invoice No: " + invoice.getInvoiceNumber(), boldFont);
            invNum.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invNum);

            Paragraph invDate = new Paragraph("Issue Date: " + (invoice.getInvoiceDate() != null ? invoice.getInvoiceDate().format(DATE_FORMAT) : ""), normalFont);
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
            divCell.setFixedHeight(4);
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
                billedToCell.addElement(new Paragraph("Customer GSTIN: " + invoice.getCustomerGstin(), boldFont));
            } else {
                billedToCell.addElement(new Paragraph("GST Type: Unregistered Consumer (B2C)", smallFont));
            }
            metaGrid.addCell(billedToCell);

            // Box B: Payment & Transaction Details
            PdfPCell payMetaCell = new PdfPCell();
            payMetaCell.setBackgroundColor(bgCard);
            payMetaCell.setBorderColor(borderColor);
            payMetaCell.setPadding(8);
            payMetaCell.addElement(new Paragraph("PAYMENT DETAILS", sectionTitleFont));
            payMetaCell.addElement(new Paragraph("Payment Method: Online (UPI / Netbanking / Card)", normalFont));
            payMetaCell.addElement(new Paragraph("Gateway / Ref: Razorpay Smart Gateway", normalFont));
            payMetaCell.addElement(new Paragraph("Transaction ID: " + (invoice.getTransactionId() != null ? invoice.getTransactionId() : "TXN-" + invoice.getInvoiceNumber()), smallFont));
            payMetaCell.addElement(new Paragraph("Subscription Ref: " + (invoice.getSubscriptionId() != null ? invoice.getSubscriptionId() : "SUB-" + invoice.getUserId().substring(0, 8)), smallFont));
            metaGrid.addCell(payMetaCell);

            document.add(metaGrid);
            document.add(new Paragraph(" "));

            // ─────────────────────────────────────────────────────────────────
            // 3. ITEMIZATION TABLE (Slate Header + Crisp Rows)
            // ─────────────────────────────────────────────────────────────────
            PdfPTable itemsTable = new PdfPTable(5);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{42, 14, 12, 16, 16});

            addHeaderCell(itemsTable, "Item Description", headerFont, darkBrand);
            addHeaderCell(itemsTable, "SAC Code", headerFont, darkBrand);
            addHeaderCell(itemsTable, "Qty", headerFont, darkBrand);
            addHeaderCell(itemsTable, "Unit Rate", headerFont, darkBrand);
            addHeaderCell(itemsTable, "Amount (" + currCode + ")", headerFont, darkBrand);

            // Dynamic Item Description from database entity
            String itemDesc = "SuviX SaaS Subscription Access";
            String itemSac = "998439";
            if (invoice.getLineItems() != null && !invoice.getLineItems().isBlank()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    java.util.List<java.util.Map<String, Object>> items = mapper.readValue(
                            invoice.getLineItems(),
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {}
                    );
                    if (items != null && !items.isEmpty()) {
                        java.util.Map<String, Object> firstItem = items.get(0);
                        if (firstItem.get("description") != null) {
                            itemDesc = (String) firstItem.get("description");
                        }
                        if (firstItem.get("sacCode") != null) {
                            itemSac = (String) firstItem.get("sacCode");
                        }
                    }
                } catch (Exception ignored) {
                    itemDesc = invoice.getLineItems();
                }
            }

            // Item row
            addRowCell(itemsTable, itemDesc, normalFont, Element.ALIGN_LEFT);
            addRowCell(itemsTable, itemSac, normalFont, Element.ALIGN_CENTER);
            addRowCell(itemsTable, "1", normalFont, Element.ALIGN_CENTER);
            addRowCell(itemsTable, String.format("%s%.2f", currSymbol, invoice.getSubtotal()), normalFont, Element.ALIGN_RIGHT);
            addRowCell(itemsTable, String.format("%s%.2f", currSymbol, invoice.getSubtotal()), normalFont, Element.ALIGN_RIGHT);

            // Proration row if applicable
            if (invoice.isProrated() && invoice.getProrationCredit().compareTo(BigDecimal.ZERO) > 0) {
                addRowCell(itemsTable, "Proration / Upgrade Unused Balance Credit", italicFont(), Element.ALIGN_LEFT);
                addRowCell(itemsTable, "-", italicFont(), Element.ALIGN_CENTER);
                addRowCell(itemsTable, "1", italicFont(), Element.ALIGN_CENTER);
                addRowCell(itemsTable, "- " + currSymbol + String.format("%.2f", invoice.getProrationCredit()), italicFont(), Element.ALIGN_RIGHT);
                addRowCell(itemsTable, "- " + currSymbol + String.format("%.2f", invoice.getProrationCredit()), italicFont(), Element.ALIGN_RIGHT);
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
                addTotalRow(totalsSubTable, "Taxable Subtotal:", String.format("$%.2f", invoice.getSubtotal()), normalFont);
                addTotalRow(totalsSubTable, "Tax (0.0% Export LUT):", "$0.00", normalFont);
            } else {
                addTotalRow(totalsSubTable, "Taxable Subtotal:", String.format("₹%.2f", gst.getTaxableAmount()), normalFont);

                if (gst.getCgstAmount().compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "CGST (9.0%):", String.format("₹%.2f", gst.getCgstAmount()), normalFont);
                    addTotalRow(totalsSubTable, "SGST (9.0%):", String.format("₹%.2f", gst.getSgstAmount()), normalFont);
                } else if (gst.getIgstAmount().compareTo(BigDecimal.ZERO) > 0) {
                    addTotalRow(totalsSubTable, "IGST (18.0%):", String.format("₹%.2f", gst.getIgstAmount()), normalFont);
                } else {
                    addTotalRow(totalsSubTable, "GST (Export / LUT):", "₹0.00", normalFont);
                }
            }

            if (invoice.isProrated() && invoice.getProrationCredit().compareTo(BigDecimal.ZERO) > 0) {
                addTotalRow(totalsSubTable, "Proration Discount:", String.format("- %s%.2f", currSymbol, invoice.getProrationCredit()), italicFont());
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

            addTotalRow(totalsSubTable, "Grand Total (" + currCode + "):",
                    String.format("%s%.2f", currSymbol, invoice.getTotalAmount()),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkBrand));

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
                    : "This is a digitally generated Tax Invoice issued in compliance with Rule 46 of the Indian CGST/SGST Rules, 2017. No physical signature is required. For any billing questions, reach us at billing@suvix.in.";

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
        cell.setPadding(6);
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