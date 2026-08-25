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

    @Value("${suvix.billing.company-name:SuviX Media Private Limited}")
    private String companyName;

    @Value("${suvix.billing.gstin:29ABCDE1234F1Z5}")
    private String platformGstin;

    @Value("${suvix.billing.address:Indiranagar, Bengaluru, Karnataka, 560038, India}")
    private String platformAddress;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    /**
     * Generates high-speed, enterprise-grade GST tax invoice PDF
     */
    public byte[] generateInvoicePdf(Invoice invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors & Fonts
            Color primaryColor = new Color(79, 70, 229); // Indigo 600
            Color darkTextColor = new Color(30, 41, 59); // Slate 800
            Color lightGrayBg = new Color(248, 250, 252); // Slate 50

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, primaryColor);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkTextColor);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, darkTextColor);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9, darkTextColor);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

            // 1. Header (Company Info & TAX INVOICE title)
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{60, 40});

            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.addElement(new Paragraph(companyName, titleFont));
            leftHeader.addElement(new Paragraph("GSTIN: " + platformGstin + " | SAC: 998439", boldFont));
            leftHeader.addElement(new Paragraph(platformAddress, smallFont));

            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph invTitle = new Paragraph("TAX INVOICE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, darkTextColor));
            invTitle.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invTitle);

            Paragraph invNum = new Paragraph("Invoice #: " + invoice.getInvoiceNumber(), boldFont);
            invNum.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invNum);

            Paragraph invDate = new Paragraph("Date: " + (invoice.getInvoiceDate() != null ? invoice.getInvoiceDate().format(DATE_FORMAT) : ""), normalFont);
            invDate.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invDate);

            Paragraph statusPara = new Paragraph("Status: " + invoice.getStatus().name().toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(22, 163, 74)));
            statusPara.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(statusPara);

            headerTable.addCell(leftHeader);
            headerTable.addCell(rightHeader);
            document.add(headerTable);

            document.add(new Paragraph(" "));

            // 2. Billed-To Customer Info Box
            PdfPTable customerTable = new PdfPTable(1);
            customerTable.setWidthPercentage(100);
            PdfPCell customerCell = new PdfPCell();
            customerCell.setBackgroundColor(lightGrayBg);
            customerCell.setPadding(10);
            customerCell.setBorderColor(new Color(226, 232, 240));

            customerCell.addElement(new Paragraph("BILLED TO:", headerFont));
            customerCell.addElement(new Paragraph("Customer Name: " + invoice.getCustomerName(), normalFont));
            customerCell.addElement(new Paragraph("Email: " + invoice.getCustomerEmail(), normalFont));
            customerCell.addElement(new Paragraph("User ID: " + invoice.getUserId(), normalFont));
            if (invoice.getCustomerGstin() != null && !invoice.getCustomerGstin().isBlank()) {
                customerCell.addElement(new Paragraph("Customer GSTIN: " + invoice.getCustomerGstin(), boldFont));
            }
            customerTable.addCell(customerCell);
            document.add(customerTable);

            document.add(new Paragraph(" "));

            // 3. Line Items Table
            PdfPTable itemsTable = new PdfPTable(5);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{40, 15, 15, 15, 15});

            addHeaderCell(itemsTable, "Description", headerFont, primaryColor);
            addHeaderCell(itemsTable, "SAC Code", headerFont, primaryColor);
            addHeaderCell(itemsTable, "Qty", headerFont, primaryColor);
            addHeaderCell(itemsTable, "Rate", headerFont, primaryColor);
            addHeaderCell(itemsTable, "Amount (" + invoice.getCurrency() + ")", headerFont, primaryColor);

            // Item row
            addRowCell(itemsTable, "SuviX SaaS Subscription Access", normalFont);
            addRowCell(itemsTable, "998439", normalFont);
            addRowCell(itemsTable, "1", normalFont);
            addRowCell(itemsTable, String.format("%.2f", invoice.getSubtotal()), normalFont);
            addRowCell(itemsTable, String.format("%.2f", invoice.getSubtotal()), normalFont);

            // Proration row if applicable
            if (invoice.isProrated() && invoice.getProrationCredit().compareTo(BigDecimal.ZERO) > 0) {
                addRowCell(itemsTable, "Proration Credit Applied", italicFont());
                addRowCell(itemsTable, "-", italicFont());
                addRowCell(itemsTable, "1", italicFont());
                addRowCell(itemsTable, "-" + String.format("%.2f", invoice.getProrationCredit()), italicFont());
                addRowCell(itemsTable, "-" + String.format("%.2f", invoice.getProrationCredit()), italicFont());
            }

            document.add(itemsTable);

            document.add(new Paragraph(" "));

            // 4. GST Tax Split and Total Summary
            GstTaxBreakdown gst = gstTaxRuleEngine.calculateGst(
                    invoice.getTotalAmount(),
                    invoice.getCustomerGstin(),
                    null,
                    invoice.getCurrency()
            );

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{55, 45});

            // QR Code in bottom-left
            PdfPCell qrCell = new PdfPCell();
            qrCell.setBorder(Rectangle.NO_BORDER);
            try {
                String qrData = String.format("GSTIN:%s|INV:%s|DATE:%s|TOTAL:%.2f|TAX:%.2f",
                        platformGstin, invoice.getInvoiceNumber(), invoice.getInvoiceDate(),
                        invoice.getTotalAmount(), gst.getTotalTax());
                Image qrImage = generateQrCodeImage(qrData, 90, 90);
                if (qrImage != null) {
                    qrCell.addElement(qrImage);
                    qrCell.addElement(new Paragraph("Scan to verify authentic GST invoice", smallFont));
                }
            } catch (Exception e) {
                log.warn("Failed to embed QR code in invoice: {}", e.getMessage());
            }
            summaryTable.addCell(qrCell);

            // Totals breakdown on bottom-right
            PdfPCell totalsCell = new PdfPCell();
            totalsCell.setBorder(Rectangle.NO_BORDER);

            PdfPTable totalsSubTable = new PdfPTable(2);
            totalsSubTable.setWidthPercentage(100);
            totalsSubTable.setWidths(new float[]{60, 40});

            addTotalRow(totalsSubTable, "Taxable Subtotal:", String.format("%.2f", gst.getTaxableAmount()), normalFont);

            if (gst.getCgstAmount().compareTo(BigDecimal.ZERO) > 0) {
                addTotalRow(totalsSubTable, "CGST (9%):", String.format("%.2f", gst.getCgstAmount()), normalFont);
                addTotalRow(totalsSubTable, "SGST (9%):", String.format("%.2f", gst.getSgstAmount()), normalFont);
            } else if (gst.getIgstAmount().compareTo(BigDecimal.ZERO) > 0) {
                addTotalRow(totalsSubTable, "IGST (18%):", String.format("%.2f", gst.getIgstAmount()), normalFont);
            } else {
                addTotalRow(totalsSubTable, "GST (Export LUT):", "0.00", normalFont);
            }

            addTotalRow(totalsSubTable, "Total Amount (" + invoice.getCurrency() + "):",
                    String.format("%.2f", invoice.getTotalAmount()),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, primaryColor));

            totalsCell.addElement(totalsSubTable);
            summaryTable.addCell(totalsCell);

            document.add(summaryTable);

            // 5. Footer Terms
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph(
                    "This is a computer generated digital invoice authorized under the Indian CGST/SGST Act 2017. No physical signature required.",
                    smallFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for invoice {}: {}", invoice.getInvoiceNumber(), e.getMessage());
            throw new RuntimeException("PDF Generation Error", e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font, Color color) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
        cell.setBackgroundColor(color);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addRowCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, font));
        lCell.setBorder(Rectangle.NO_BORDER);
        lCell.setPadding(3);
        table.addCell(lCell);

        PdfPCell vCell = new PdfPCell(new Phrase(value, font));
        vCell.setBorder(Rectangle.NO_BORDER);
        vCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        vCell.setPadding(3);
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