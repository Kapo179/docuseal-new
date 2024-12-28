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

async function generateCVFromAssistant(cvData) {
  let browser;
  try {
    console.log('Starting CV generation from Assistant data...');
    
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
        '--font-render-hinting=none'
      ],
      defaultViewport: {
        width: 794,
        height: 1123,
        deviceScaleFactor: 2
      },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    
    // Generate HTML template
    const htmlTemplate = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${cvData.name} - CV</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.3;
              max-width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 12mm 20mm;
              box-sizing: border-box;
              font-size: 11pt;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .header h1 {
              font-size: 14pt;
              margin: 0 0 3px 0;
              font-weight: bold;
            }
            .entry-header {
              font-weight: bold;
              font-size: 11pt;
            }
            .entry-subheader {
              font-weight: semi-bold;
              font-size: 11pt;
            }
            .contact-details {
              font-size: 11pt;
              line-height: 1.2;
            }
            .contact-details a {
              color: #000;
              text-decoration: none;
            }
            .section-header {
              text-transform: uppercase;
              font-weight: bold;
              border-bottom: 1px solid black;
              margin: 15px 0 8px 0;
              padding-bottom: 1px;
              font-size: 12pt;
              color: #000;
            }
            .education-entry { margin-bottom: 8px; }
            .education-title {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }
            .institution {
              font-weight: bold;
              font-size: 11pt;
            }
            .degree {
              font-weight: normal;
              margin-left: 5px;
            }
            .year {
              text-align: right;
              min-width: 85px;
              font-size: 11pt;
            }
            .education-details {
              margin: 3px 0 0 0;
              padding-left: 15px;
              font-size: 10.5pt;
              color: #333;
            }
            .experience-entry { margin-bottom: 12px; }
            .experience-header {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              margin-bottom: 3px;
            }
            .company-position {
              font-weight: bold;
              font-size: 11pt;
            }
            .responsibilities {
              margin: 3px 0 0 0;
              padding-left: 15px;
            }
            .responsibilities li {
              margin-bottom: 3px;
              font-size: 11pt;
            }
            .skills-section { margin-bottom: 8px; }
            .skill-category {
              font-weight: bold;
              display: inline;
              margin-right: 5px;
            }
            .skills-content { display: inline; }
            ul {
              margin: 3px 0;
              padding-left: 20px;
            }
            li { margin-bottom: 2px; }
            p { margin: 3px 0; }
            .professional-summary {
              margin: 10px 0;
              text-align: justify;
              font-size: 11pt;
              line-height: 1.3;
            }
            .key-skills {
              margin: 5px 0;
              padding-left: 15px;
            }
            .key-skills li {
              margin-bottom: 3px;
              font-size: 11pt;
              line-height: 1.3;
            }
            .job-title {
              font-weight: bold;
              font-size: 11pt;
            }
            .company-location { font-style: italic; }
            .job-details { margin: 3px 0 0 15px; }
            .job-details li {
              margin-bottom: 3px;
              font-size: 11pt;
              line-height: 1.3;
            }
            .references {
              font-style: italic;
              margin: 10px 0;
              font-size: 11pt;
            }
            .role-subtitle {
              font-style: italic;
              margin-bottom: 2px;
            }
            .bullet-points {
              margin: 0;
              padding-left: 15px;
            }
            .bullet-points li {
              margin-bottom: 2px;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${cvData.name}</h1>
            <div class="contact-details">
              ${cvData.contactDetails.email} | <a href="${cvData.contactDetails.linkedin}">${cvData.contactDetails.linkedin}</a> | ${cvData.contactDetails.phone}
            </div>
          </div>

          ${cvData.relevantExperience?.length > 0 ? `
            <div class="section-header">RELEVANT EXPERIENCE</div>
            ${cvData.relevantExperience.map(exp => `
              <div class="relevant-experience-entry">
                <div class="experience-title">${exp.title}</div>
                <div class="experience-description">${exp.description}</div>
                ${exp.metrics ? `
                  <ul class="experience-metrics">
                    ${exp.metrics.map(metric => `<li>${metric}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          ` : ''}

          <div class="section-header">EXPERIENCE</div>
          ${cvData.workExperience.map(exp => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-left">${exp.company}</span>
                <span class="entry-right">${exp.location || ''}</span>
              </div>
              ${exp.subtitle ? `<div class="role-subtitle">${exp.subtitle}</div>` : ''}
              <div class="entry-subheader">
                <span>${exp.position}</span>
                <span>${exp.duration}</span>
              </div>
              <ul class="bullet-points">
                ${Array.isArray(exp.responsibilities) 
                  ? exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')
                  : exp.responsibilities.split('\n').map(resp => 
                      `<li>${resp.trim().replace(/^-\s*/, '')}</li>`
                    ).join('')
                }
              </ul>
            </div>
          `).join('')}

          <div class="section-header">ACADEMIC QUALIFICATIONS</div>
          ${cvData.education.map(edu => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-left">${edu.institution}</span>
                <span class="entry-right">${edu.location || ''}</span>
              </div>
              <div class="entry-subheader">
                <span>${edu.degree}</span>
                <span>${edu.year}</span>
              </div>
              ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
              ${edu.details ? `
                <ul class="bullet-points education-details">
                  ${Array.isArray(edu.details) 
                    ? edu.details.map(detail => `<li>${detail}</li>`).join('')
                    : edu.details.split('\n').map(detail => 
                        `<li>${detail.trim().replace(/^-\s*/, '')}</li>`
                      ).join('')
                  }
                </ul>
              ` : ''}
            </div>
          `).join('')}

          <div class="section-header">ADDITIONAL INFORMATION</div>
          <div class="skills-section">
            ${cvData.skills.technical ? `
              <div>
                <span class="skill-category">Technical Skills:</span>
                ${Array.isArray(cvData.skills.technical) ? cvData.skills.technical.join(', ') : cvData.skills.technical}
              </div>
            ` : ''}
            ${cvData.skills.software ? `
              <div>
                <span class="skill-category">Software:</span>
                ${Array.isArray(cvData.skills.software) ? cvData.skills.software.join(', ') : cvData.skills.software}
              </div>
            ` : ''}
            ${cvData.skills.languages ? `
              <div>
                <span class="skill-category">Languages:</span>
                ${Array.isArray(cvData.skills.languages) ? cvData.skills.languages.join(', ') : cvData.skills.languages}
              </div>
            ` : ''}
            ${cvData.skills.certifications ? `
              <div>
                <span class="skill-category">Certifications:</span>
                ${Array.isArray(cvData.skills.certifications) ? cvData.skills.certifications.join(', ') : cvData.skills.certifications}
              </div>
            ` : ''}
            ${cvData.skills.interests ? `
              <div>
                <span class="skill-category">Interests:</span>
                ${Array.isArray(cvData.skills.interests) ? cvData.skills.interests.join(', ') : cvData.skills.interests}
              </div>
            ` : ''}
          </div>

          ${cvData.references ? `
            <div class="section-header">REFERENCES</div>
            <p>${cvData.references}</p>
          ` : ''}
        </body>
      </html>`;

    await page.setContent(htmlTemplate);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = cvData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const pdfKey = `assistant-cvs/${timestamp}-${sanitizedName}.pdf`;
    const pngKey = `assistant-previews/${timestamp}-${sanitizedName}.png`;

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

    // Upload files to S3
    const [pdfUrl, previewUrl] = await Promise.all([
      uploadToS3(pdfBuffer, pdfKey, 'application/pdf'),
      uploadToS3(pngBuffer, pngKey, 'image/png')
    ]);

    console.log('Generated URLs:', { pdfUrl, previewUrl });

    return {
      success: true,
      pdfUrl,
      previewUrl
    };

  } catch (error) {
    console.error('Error in CV generation:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generateCVFromAssistant }; 