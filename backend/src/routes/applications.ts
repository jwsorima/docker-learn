import { NextFunction, Request, Response, Router } from "express";
const applications = Router();
import { checkApplicationExist, createApplication, createApplicationList, getApplication, getApplicationsForDownload, getScheduledApplicationsPaged, updateRemarks, updateSchedule } from "../db/applicationsQueries.js";
import { getAdmissionsPaged, getPagedApplicationOfAdmission } from "../db/admissionsQueries.js";
import { verifyApplicantJwt } from "../middlewares/verifyJwt.js";
import ExcelJS from 'exceljs/dist/es5/index.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import { z } from 'zod';

const rootDirectory = path.resolve();

const receiveFiles = async (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const applicant_id = req.user?.id;
        
        if (!applicant_id) {
          return cb(new Error('Applicant ID not found in the request.'), '');
        }

        let uploadDir = '';
        if (file.fieldname === 'documentOne') {
          uploadDir = path.join(rootDirectory, `uploads/documentOne/`);
        } else if (file.fieldname === 'documentTwo') {
          uploadDir = path.join(rootDirectory, `uploads/documentTwo/`);
        }

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const applicant_id = req.user?.id;
        const fileExtension = path.extname(file.originalname);
        cb(null, `${applicant_id}${fileExtension}`);
      },
    }),
    limits: {
      fileSize: 1024 * 5000, // 5MB file size limit
    },
  }).fields([
    { name: 'documentOne', maxCount: 1 },
    { name: 'documentTwo', maxCount: 1 },
  ]);

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).send({ message: 'Error: Unexpected file field' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send({ message: 'Error: File size limit exceeded (max 5MB)' });
      }
    }

    if (!req.files) {
      return res.status(400).send({ message: 'Error: No files found' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files['documentOne'] || !files['documentTwo']) {
      return res.status(400).send({ message: 'Error: Both documentOne and documentTwo are required' });
    }

    try {
      // Validate file type for documentOne
      const documentOne = files['documentOne'][0];
      const documentOneType = await fileTypeFromBuffer(fs.readFileSync(documentOne.path));
      if (!documentOneType || !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(documentOneType.mime)) {
        return res.status(400).send({ message: 'Invalid file type for documentOne. Only PNG, JPEG, WEBP, or PDF allowed.' });
      }

      // Validate file type for documentTwo
      const documentTwo = files['documentTwo'][0];
      const documentTwoType = await fileTypeFromBuffer(fs.readFileSync(documentTwo.path));
      if (!documentTwoType || !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(documentTwoType.mime)) {
        return res.status(400).send({ message: 'Invalid file type for documentTwo. Only PNG, JPEG, WEBP, or PDF allowed.' });
      }

      // Extract file extensions and add them to req.body
      req.body.documentOneExt = path.extname(documentOne.originalname).slice(1);
      req.body.documentTwoExt = path.extname(documentTwo.originalname).slice(1);

    } catch (error) {
      console.error('File processing error:', error);
      return res.status(500).send({ message: 'Error processing the files.' });
    }

    next();
  });
};


applications.post('/', 
  verifyApplicantJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const applicant_id = req.user?.id;

      const applicationExists = await checkApplicationExist(applicant_id!);

      if (applicationExists.exists) {
        res.status(400).json({ message: 'You have already submitted an application.' }); return;
      }

      next();
    } catch (error) {
      console.error('Error checking existing application:', error);
      res.status(500).json({ message: 'Internal Server Error' }); return;
    }
  },
  receiveFiles, 
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files || !files['documentOne'] || !files['documentTwo']) {
        res.status(400).json({ message: 'Both documentOne and documentTwo are required.' }); return;
      }

      const { documentOneExt, documentTwoExt } = req.body;
      const { course_id } = req.body;
      const applicant_id = req.user?.id;

      if (!applicant_id) {
        res.status(400).json({ message: 'Applicant ID is required to submit the application.' }); return;
      }

      await createApplication(applicant_id, course_id, documentOneExt, documentTwoExt);
      
      res.status(200).json({ message: 'Application submitted successfully.' });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
);

applications.get('/check', verifyApplicantJwt, async (req: Request, res: Response) => {
  const applicant_id = req.user?.id;

  if (!applicant_id) {
    res.status(400).json({ message: 'Applicant ID is missing or invalid.' }); return;
  }

  try {
    const { exists, application } = await checkApplicationExist(applicant_id);

    res.status(200).json({ exists, application });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error checking application:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred while checking application:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applications.get('/course/:active_course_id/active', async (req: Request, res: Response) => {
  const { active_course_id } = req.params;
  const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
  const offset = page * limit;

  const status = req.query.status === 'Pending' ? 'Pending' : 'Scheduled';

  try {
    let { applications, total } = await getScheduledApplicationsPaged(parseInt(active_course_id), limit, offset, status);

    res.status(200).json({
      applications: applications,
      total
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred during login:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});


applications.get('/:applicant_id/document/:document_type', (req: Request, res: Response) => {
  const { applicant_id, document_type } = req.params;

  const documentPath = path.join(rootDirectory, `uploads/${document_type}/${applicant_id}`);

  const fileExtension = (req.query.ext as string) || '';
  const fullPath = `${documentPath}.${fileExtension}`;

  if (fs.existsSync(fullPath)) {
    const mimeType: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };

    const formattedExtension = `.${fileExtension}`;

    const contentType = mimeType[formattedExtension] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

applications.put('/:id/schedule', async (req: Request, res: Response) => {
  const applicationID = parseInt(req.params.id, 10);
  const { schedule_start, schedule_end } = req.body;

  try {
    const updated = await updateSchedule(applicationID, new Date(schedule_start), new Date(schedule_end));

    if (updated) {
      res.status(200).json({ message: 'Schedule updated successfully' }); return;
    } else {
      res.status(404).json({ message: 'Applicant not found or no schedule to update' }); return;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred during login:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applications.put('/:id/remarks', async (req: Request, res: Response) => {
  const applicationID = parseInt(req.params.id, 10);
  const { remarks } = req.body;

  try {
    const updated = await updateRemarks(applicationID, remarks);

    if (updated) {
      res.status(200).json({ message: 'Remarks updated successfully' }); return;
    } else {
      res.status(404).json({ message: 'Applicant not found or no remarks to update' }); return;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred during login:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applications.get('/status', verifyApplicantJwt, async (req: Request, res: Response) => {
  try {
    const applicantId = req.user?.id;

    if (!applicantId) {
      res.status(403).json({ message: 'Unauthorized' }); return;
    }

    const result = await getApplication(applicantId);

    if (!result || result.rows.length === 0) {
      res.status(404).json({ message: 'No application found' }); return;
    }

    res.status(200).json(result.rows[0]); return;
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ message: 'Internal Server Error' }); return;
  }
});

const applicationListSchema = z.object({
  application_ids: z.array(z.number().int()),
  status: z.enum(['Passed', 'NotPassed', 'NoShow']),
});

// type ApplicationListRequest = z.infer<typeof applicationListSchema>;

applications.post('/course/:course_status_id/list', async (req: Request, res: Response) => {
  try {
    const course_status_id = parseInt(req.params.course_status_id, 10);
    if (isNaN(course_status_id)) {
      res.status(400).json({ message: 'Invalid course_status_id parameter' }); return;
    }

    const validatedData = applicationListSchema.parse(req.body);
    const { application_ids, status } = validatedData;

    await createApplicationList(application_ids, status, course_status_id);

    res.status(201).json({ message: 'Generated list successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    } else if (error instanceof Error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applications.get('/lists', async (req: Request, res: Response) => {
  try {
    const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const offset = page * limit;

    const { admissions, total } = await getAdmissionsPaged(limit, offset);
    res.status(200).json({ admissions, total });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching admissions:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applications.get('/lists/:admission_record_id', async (req: Request, res: Response) => {
  try {
    const admission_record_id = parseInt(req.params.admission_record_id, 10);
    const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const offset = page * limit;

    if (isNaN(admission_record_id)) {
      res.status(400).json({ message: 'Invalid admission_record_id provided.' }); return;
    }

    const { applications, total } = await getPagedApplicationOfAdmission(admission_record_id, limit, offset);

    res.status(200).json({
      applications,
      total,
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching applications:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applications.get('/lists/:admission_record_id/download', async (req: Request, res: Response) => {
  try {
    const admission_record_id = parseInt(req.params.admission_record_id, 10);
    if (isNaN(admission_record_id)) {
      res.status(400).json({ message: 'Invalid admission_record_id provided.' }); return;
    }

    const applicationsResult = await getApplicationsForDownload(admission_record_id);

    if (applicationsResult.length === 0) {
      res.status(404).send('No applications found for this admission record.'); return;
    }

    const { course_name, academic_year, type } = applicationsResult[0];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Applications');

    worksheet.addRow(['Admission Details']);
    worksheet.addRow(['Course Name:', course_name]);
    worksheet.addRow(['Academic Year:', academic_year]);
    worksheet.addRow(['Type:', type]);
    worksheet.addRow([]);

    worksheet.addRow([
      'Application ID', 'Full Name', 'Application Date', 
      'Email', 'Address', 'Contact Number', 'Sex', 'Birthdate'
    ]);

    const columnWidths = [
      { key: 'application_id', width: 15 },
      { key: 'full_name', width: 30 },
      { key: 'application_date', width: 20 },
      { key: 'email', width: 30 },
      { key: 'address', width: 50 },
      { key: 'contact_number', width: 20 },
      { key: 'sex', width: 10 },
      { key: 'birthdate', width: 20 },
    ];
    columnWidths.forEach((col, i) => {
      worksheet.getColumn(i + 1).width = col.width;
    });

    applicationsResult.forEach(application => {
      worksheet.addRow([
        application.application_id,
        application.full_name,
        dayjs(application.application_date).format('YYYY/MM/DD'),
        application.email,
        application.address,
        application.contact_number,
        application.sex,
        dayjs(application.birthdate).format('YYYY/MM/DD')
      ]);
    });

    const xlsxBuffer = await workbook.xlsx.writeBuffer();

    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Length': xlsxBuffer.byteLength,
      'Content-Disposition': `attachment; filename=admission_${admission_record_id}_applications.xlsx`,
      'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length'
    });

    res.write(xlsxBuffer);
    res.end();

  } catch (err) {
    console.error('Error downloading applications:', err);
    res.status(500).send('Server error');
  }
});


export default applications;