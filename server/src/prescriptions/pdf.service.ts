import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Prescription } from '@prisma/client';

@Injectable()
export class PdfService {
  async generatePrescriptionPdf(
    prescription: any,
    frontendUrl: string,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const qrUrl = `${frontendUrl}/patient/prescriptions/${prescription.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 100,
          margin: 1,
        });
        const qrCodeImage = Buffer.from(
          qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''),
          'base64',
        );

        // Header con título a la izquierda y QR a la derecha
        const startY = doc.y;
        
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('PRESCRIPCIÓN MÉDICA', 50, startY, { align: 'left' });
        
        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Código: ${prescription.code}`, 50, startY + 30, { align: 'left' });

        // QR en la misma fila, lado derecho
        doc.image(qrCodeImage, 480, startY - 15, {
          fit: [70, 70],
        });

        // Mover después del header
        doc.y = startY + 80;

        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown(1);

        const columnsStartY = doc.y;
        const leftColumnX = 50;
        const rightColumnX = 310;

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('DATOS DEL PACIENTE', leftColumnX, columnsStartY, { underline: true });

        let currentY = columnsStartY + 20;

        doc
          .fontSize(11)
          .font('Helvetica')
          .text(`Nombre: ${prescription.patient.user.name}`, leftColumnX, currentY);
        
        currentY += 15;
        doc.text(`Email: ${prescription.patient.user.email}`, leftColumnX, currentY);

        if (prescription.patient.birthDate) {
          const birthDate = new Date(prescription.patient.birthDate);
          currentY += 15;
          doc.text(
            `Fecha de Nacimiento: ${birthDate.toLocaleDateString('es-ES')}`,
            leftColumnX,
            currentY,
          );
        }

        // Columna derecha: DATOS DEL MÉDICO
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('DATOS DEL MÉDICO', rightColumnX, columnsStartY, { underline: true });

        currentY = columnsStartY + 20;

        doc
          .fontSize(11)
          .font('Helvetica')
          .text(`Nombre: ${prescription.author.user.name}`, rightColumnX, currentY);
        
        currentY += 15;
        doc.text(`Email: ${prescription.author.user.email}`, rightColumnX, currentY);

        if (prescription.author.specialty) {
          currentY += 15;
          doc.text(`Especialidad: ${prescription.author.specialty}`, rightColumnX, currentY);
        }

        doc.y = currentY + 40;
        doc.x = 50;

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('DETALLES DE LA PRESCRIPCIÓN', 50, doc.y, { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(11)
          .font('Helvetica')
          .text(
            `Fecha de Emisión: ${new Date(prescription.createdAt).toLocaleDateString('es-ES')}`,
            50,
            doc.y,
            { continued: false },
          )
          .text(
            `Estado: ${prescription.status === 'pending' ? 'Pendiente' : 'Consumida'}`,
            50,
            doc.y,
            { continued: false },
          );

        if (prescription.consumedAt) {
          doc.text(
            `Fecha de Consumo: ${new Date(prescription.consumedAt).toLocaleDateString('es-ES')}`,
            50,
            doc.y,
            { continued: false },
          );
        }

        if (prescription.notes) {
          doc.text(`Notas: ${prescription.notes}`, 50, doc.y, { continued: false });
        }

        doc.moveDown(1);

        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown(1);

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('MEDICAMENTOS RECETADOS', 50, doc.y, { underline: true })
          .moveDown(0.5);

        prescription.items.forEach((item: any, index: number) => {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${item.name}`, { continued: false })
            .fontSize(10)
            .font('Helvetica');

          if (item.dosage) {
            doc.text(`   Dosis: ${item.dosage}`, { continued: false });
          }

          if (item.quantity) {
            doc.text(`   Cantidad: ${item.quantity}`, { continued: false });
          }

          if (item.instructions) {
            doc.text(`   Instrucciones: ${item.instructions}`, {
              continued: false,
            });
          }

          doc.moveDown(0.5);
        });

        doc
          .moveDown(2)
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Documento generado el ${new Date().toLocaleString('es-ES')}`,
            50,
            doc.page.height - 60,
            { align: 'center' },
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
