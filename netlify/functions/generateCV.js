const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Initialize S3 client with renamed environment variables
const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

async function uploadToS3(buffer, key, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,

    });

    await s3Client.send(command);
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // Extract fields with defaults
    const {
      name = '',
      contactDetails = {},
      education = [],
      workExperience = [],
      // Split skills into technical and soft if provided that way, otherwise use single skills array
      technicalSkills = body.skills?.filter(s => typeof s === 'string') || [],
      softSkills = [],
      languages = '',
      hobbies = [],
      ...additionalSections
    } = body;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${name} - CV</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              max-width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 15mm 25mm;
              box-sizing: border-box;
            }

            /* Header styling */
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 16px;
              margin: 0 0 5px 0;
              font-weight: normal;
            }
            
            /* Section Headers */
            .section-header {
              text-transform: uppercase;
              font-weight: bold;
              border-bottom: 1px solid black;
              margin: 25px 0 15px 0;
              padding-bottom: 2px;
              font-size: 14px;
            }

            /* Education styling */
            .education-entry {
              margin-bottom: 15px;
            }
            .education-title {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .institution-degree {
              font-weight: bold;
            }
            .year {
              text-align: right;
              min-width: 140px;
            }
            .education-details {
              margin: 5px 0 0 0;
            }

            /* Work Experience styling */
            .experience-entry {
              margin-bottom: 20px;
            }
            .experience-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .company-position {
              font-weight: bold;
            }
            .responsibilities {
              margin: 5px 0 0 0;
              padding-left: 20px;
            }
            .responsibilities li {
              margin-bottom: 5px;
            }

            /* Skills styling */
            .skills-grid {
              display: grid;
              grid-template-columns: auto;
              gap: 5px;
            }
            .skill-category {
              font-weight: bold;
              margin-right: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${name}</h1>
            <div>
              ${contactDetails.phone} | <a href="mailto:${contactDetails.email}">${contactDetails.email}</a>
              ${contactDetails.linkedin ? `<br>${contactDetails.linkedin}` : ''}
            </div>
          </div>

          <div class="section-header">EDUCATION & QUALIFICATIONS</div>
          ${education.map(edu => `
            <div class="education-entry">
              <div class="education-title">
                <div class="institution-degree">${edu.institution} – ${edu.degree}</div>
                <div class="year">${edu.year}</div>
              </div>
              ${edu.details ? `
                <div class="education-details">
                  ${edu.details.includes('\n') ? 
                    `<ul>${edu.details.split('\n').map(detail => `<li>${detail.trim()}</li>`).join('')}</ul>` :
                    edu.details}
                </div>
              ` : ''}
            </div>
          `).join('')}

          <div class="section-header">WORK EXPERIENCE</div>
          ${workExperience.map(exp => `
            <div class="experience-entry">
              <div class="experience-header">
                <div class="company-position">${exp.company}${exp.position ? ` – ${exp.position}` : ''}</div>
                <div class="year">${exp.duration}</div>
              </div>
              <ul class="responsibilities">
                ${exp.responsibilities.split('\n').map(r => `
                  <li>${r.trim().replace(/^-\s*/, '')}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}

          <div class="section-header">ADDITIONAL SKILLS</div>
          <div class="skills-grid">
            ${technicalSkills.length ? `
              <div>
                <span class="skill-category">Technical Skills:</span>
                ${technicalSkills.join(', ')}
              </div>
            ` : ''}
            ${softSkills.length ? `
              <div>
                <span class="skill-category">Soft Skills:</span>
                ${softSkills.join(', ')}
              </div>
            ` : ''}
            ${languages ? `
              <div>
                <span class="skill-category">Languages:</span>
                ${languages}
              </div>
            ` : ''}
          </div>

          ${hobbies && hobbies.length ? `
            <div class="section-header">HOBBIES & INTERESTS</div>
            <ul class="hobbies-list">
              ${hobbies.map(hobby => `<li>${hobby}</li>`).join('')}
            </ul>
          ` : ''}
        </body>
      </html>
    `;

    // Generate unique filename based on timestamp and name
    const timestamp = Date.now();
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const pdfKey = `cvs/${timestamp}-${sanitizedName}.pdf`;
    const pngKey = `previews/${timestamp}-${sanitizedName}.png`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate);

    // Generate PDF and PNG
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '25mm',
        right: '25mm',
        bottom: '25mm',
        left: '25mm'
      }
    });

    const pngBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false
    });

    await browser.close();

    // Upload both files to S3 with new environment variable names
    const [pdfUrl, previewUrl] = await Promise.all([
      uploadToS3(pdfBuffer, pdfKey, 'application/pdf'),
      uploadToS3(pngBuffer, pngKey, 'image/png')
    ]);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'CV generated successfully',
        pdfUrl,
        previewUrl
      })
    };

  } catch (error) {
    console.error('Error in CV generation:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to generate CV',
        details: error.message
      })
    };
  }
};

