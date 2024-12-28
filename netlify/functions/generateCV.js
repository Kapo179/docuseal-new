const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Initialize S3 client
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

function generateHTMLTemplate(cvData) {
  // Your existing HTML template generation code
  // ...
}

async function setupBrowser() {
  try {
    // Configure Chromium for Netlify environment
    const executablePath = await chromium.executablePath;
    
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ],
      defaultViewport: {
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      },
      executablePath: process.env.CHROME_EXECUTABLE_PATH || executablePath,
      headless: true,
      ignoreHTTPSErrors: true
    });

    return browser;
  } catch (error) {
    console.error('Browser setup error:', error);
    console.error('Chromium path:', await chromium.executablePath);
    console.error('Environment:', process.env.AWS_LAMBDA_JS_RUNTIME);
    throw error;
  }
}

// Export both the handler and the generateCV function
module.exports = {
  handler: async (event) => {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: CORS_HEADERS
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    let browser;
    try {
      const { 
        name, 
        contactDetails, 
        education, 
        workExperience, 
        skills = {
          technical: [],
          software: [],
          languages: [],
          certifications: [],
          interests: []
        },
        relevantExperience = [],
        references
      } = JSON.parse(event.body);
      
      // Validate required fields
      if (!name || !contactDetails || !education || !workExperience || !skills) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'Missing required fields',
            details: 'Please provide all required CV information'
          })
        };
      }

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
                line-height: 1.3;
                max-width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 12mm 20mm;
                box-sizing: border-box;
                font-size: 11pt;
              }

              /* Header styling */
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

              /* Section Headers */
              .section-header {
                text-transform: uppercase;
                font-weight: bold;
                border-bottom: 1px solid black;
                margin: 15px 0 8px 0;
                padding-bottom: 1px;
                font-size: 12pt;
                color: #000;
              }

              /* Education styling */
              .education-entry {
                margin-bottom: 8px;
              }
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
              .education-details ul {
                margin: 3px 0;
                padding-left: 20px;
              }
              .education-details li {
                margin-bottom: 2px;
                line-height: 1.3;
              }

              /* Work Experience styling */
              .experience-entry {
                margin-bottom: 12px;
              }
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

              /* Skills styling */
              .skills-section {
                margin-bottom: 8px;
              }
              .skill-category {
                font-weight: bold;
                display: inline;
                margin-right: 5px;
              }
              .skills-content {
                display: inline;
              }

              /* Hobbies styling */
              .hobbies-list {
                margin: 5px 0;
                padding-left: 15px;
              }
              .hobbies-list li {
                margin-bottom: 2px;
                font-size: 11pt;
              }

              /* Additional spacing adjustments */
              ul {
                margin: 3px 0;
              }
              p {
                margin: 3px 0;
              }

              /* Add styles for Professional Summary */
              .professional-summary {
                margin: 10px 0;
                text-align: justify;
                font-size: 11pt;
                line-height: 1.3;
              }

              /* Skills styling */
              .key-skills {
                margin: 5px 0;
                padding-left: 15px;
              }
              .key-skills li {
                margin-bottom: 3px;
                font-size: 11pt;
                line-height: 1.3;
              }

              /* Experience styling */
              .experience-entry {
                margin-bottom: 12px;
              }
              .job-title {
                font-weight: bold;
                font-size: 11pt;
              }
              .company-location {
                font-style: italic;
              }
              .job-details {
                margin: 3px 0 0 15px;
              }
              .job-details li {
                margin-bottom: 3px;
                font-size: 11pt;
                line-height: 1.3;
              }

              /* References section */
              .references {
                font-style: italic;
                margin: 10px 0;
                font-size: 11pt;
              }

              /* Additional styles for comprehensive formatting */
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

              .skills-section {
                display: grid;
                grid-template-columns: auto;
                gap: 5px;
              }

              .skill-category {
                font-weight: bold;
                margin-top: 5px;
              }

              .education-details {
                margin-top: 2px;
              }

              .relevant-experience-entry {
                margin-bottom: 12px;
              }
              
              .experience-title {
                font-weight: bold;
                font-size: 11pt;
                margin-bottom: 3px;
              }
              
              .experience-description {
                font-size: 11pt;
                margin-bottom: 5px;
                text-align: justify;
              }
              
              .experience-metrics {
                margin: 0;
                padding-left: 20px;
              }
              
              .experience-metrics li {
                font-size: 10.5pt;
                margin-bottom: 2px;
                color: #333;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${name}</h1>
              <div class="contact-details">
                ${contactDetails.email} | <a href="${contactDetails.linkedin}">${contactDetails.linkedin}</a> | ${contactDetails.phone}
              </div>
            </div>

            ${relevantExperience.length > 0 ? `
              <div class="section-header">RELEVANT EXPERIENCE</div>
              ${relevantExperience.map(exp => `
                <div class="relevant-experience-entry">
                  <div class="experience-title">${exp.title}</div>
                  <div class="experience-description">${exp.description}</div>
                  ${exp.metrics ? `
                    <ul class="experience-metrics">
                      ${exp.metrics.map(metric => `
                        <li>${metric}</li>
                      `).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            ` : ''}

            <div class="section-header">EXPERIENCE</div>
            ${workExperience.map(exp => `
              <div class="entry">
                <div class="entry-header">
                  <span class="entry-left">${exp.company}</span>
                  <span class="entry-right">${exp.location || ''}</span>
                </div>
                ${exp.subtitle ? `
                  <div class="role-subtitle">${exp.subtitle}</div>
                ` : ''}
                <div class="entry-subheader">
                  <span>${exp.position}</span>
                  <span>${exp.duration}</span>
                </div>
                <ul class="bullet-points">
                  ${exp.responsibilities.split('\n').map(resp => 
                    `<li>${resp.trim().replace(/^-\s*/, '')}</li>`
                  ).join('')}
                </ul>
              </div>
            `).join('')}

            <div class="section-header">ACADEMIC QUALIFICATIONS</div>
            ${education.map(edu => `
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
              ${skills.technical ? `
                <div>
                  <span class="skill-category">Technical Skills:</span>
                  ${Array.isArray(skills.technical) ? skills.technical.join(', ') : skills.technical}
                </div>
              ` : ''}
              ${skills.software ? `
                <div>
                  <span class="skill-category">Software:</span>
                  ${Array.isArray(skills.software) ? skills.software.join(', ') : skills.software}
                </div>
              ` : ''}
              ${skills.languages ? `
                <div>
                  <span class="skill-category">Languages:</span>
                  ${Array.isArray(skills.languages) ? skills.languages.join(', ') : skills.languages}
                </div>
              ` : ''}
              ${skills.certifications ? `
                <div>
                  <span class="skill-category">Certifications:</span>
                  ${Array.isArray(skills.certifications) ? skills.certifications.join(', ') : skills.certifications}
                </div>
              ` : ''}
              ${skills.interests ? `
                <div>
                  <span class="skill-category">Interests:</span>
                  ${Array.isArray(skills.interests) ? skills.interests.join(', ') : skills.interests}
                </div>
              ` : ''}
            </div>

            ${references ? `
              <div class="section-header">REFERENCES</div>
              <p>${references}</p>
            ` : ''}
          </body>
        </html>
      `;

      // Generate unique filename based on timestamp and name
      const timestamp = Date.now();
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const pdfKey = `cvs/${timestamp}-${sanitizedName}.pdf`;
      const pngKey = `previews/${timestamp}-${sanitizedName}.png`;

      browser = await setupBrowser();
      console.log('Browser launched successfully');

      const page = await browser.newPage();
      console.log('New page created');
      
      await page.setContent(htmlTemplate);
      console.log('HTML content set');

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
      console.log('PDF generated');

      const pngBuffer = await page.screenshot({
        type: 'png',
        fullPage: true,
        omitBackground: false
      });
      console.log('PNG screenshot taken');

      await browser.close();
      console.log('Browser closed');

      // Upload both files to S3 with new environment variable names
      const [pdfUrl, previewUrl] = await Promise.all([
        uploadToS3(pdfBuffer, pdfKey, 'application/pdf'),
        uploadToS3(pngBuffer, pngKey, 'image/png')
      ]);
      console.log('Files uploaded to S3');

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          message: 'CV generated and uploaded successfully',
          pdfUrl,
          previewUrl,
          filename: `${sanitizedName}.pdf`
        })
      };

    } catch (error) {
      console.error('Error in CV generation:', error);
      if (browser) {
        await browser.close();
      }
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Failed to generate CV',
          details: error.message
        })
      };
    }
  },
  generateCV: async function(cvData) {
    let browser;
    try {
      // Generate unique filename based on timestamp and name
      const timestamp = Date.now();
      const sanitizedName = cvData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const pdfKey = `cvs/${timestamp}-${sanitizedName}.pdf`;
      const pngKey = `previews/${timestamp}-${sanitizedName}.png`;

      // Launch browser using the setup function
      browser = await setupBrowser();
      console.log('Browser launched successfully');

      const page = await browser.newPage();
      console.log('New page created');
      
      // Generate HTML from cvData
      const htmlTemplate = generateHTMLTemplate(cvData);
      await page.setContent(htmlTemplate);
      console.log('HTML content set');

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
      console.log('PDF generated');

      const pngBuffer = await page.screenshot({
        type: 'png',
        fullPage: true,
        omitBackground: false
      });
      console.log('PNG screenshot taken');

      await browser.close();
      console.log('Browser closed');

      // Upload to S3
      const [pdfUrl, previewUrl] = await Promise.all([
        uploadToS3(pdfBuffer, pdfKey, 'application/pdf'),
        uploadToS3(pngBuffer, pngKey, 'image/png')
      ]);
      console.log('Files uploaded to S3');

      return {
        pdfUrl,
        previewUrl
      };

    } catch (error) {
      console.error('Error in generateCV:', error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }
};

