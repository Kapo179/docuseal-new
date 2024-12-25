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
      skills = [],
      hobbies = [],
      languages = '',
      achievements = [],
      certifications = []
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
            .contact-details {
              font-size: 14px;
            }
            .contact-details a {
              color: #0066cc;
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
              margin-bottom: 3px;
            }
            .education-name {
              font-weight: bold;
            }
            .education-year {
              font-style: italic;
            }
            .education-details {
              margin-left: 0;
              padding-left: 20px;
              margin-top: 5px;
            }
            .education-details li {
              margin-bottom: 3px;
            }

            /* Work Experience styling */
            .experience-entry {
              margin-bottom: 15px;
            }
            .experience-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .company-position {
              font-weight: bold;
            }
            .duration {
              font-style: italic;
            }
            .responsibilities {
              margin: 5px 0 0 0;
              padding-left: 20px;
            }
            .responsibilities li {
              margin-bottom: 3px;
            }

            /* Skills section */
            .skills-grid {
              display: grid;
              grid-template-columns: 120px auto;
              gap: 10px;
              margin-top: 10px;
            }
            .skill-category {
              font-weight: bold;
            }

            /* Hobbies section */
            .hobbies-list {
              margin: 5px 0;
              padding-left: 20px;
            }
            .hobbies-list li {
              margin-bottom: 3px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${name}</h1>
            <div class="contact-details">
              ${contactDetails.phone} • <a href="mailto:${contactDetails.email}">${contactDetails.email}</a>
              ${contactDetails.linkedin && contactDetails.linkedin !== 'N/A' ? 
                `<br>${contactDetails.linkedin}` : 
                ''}
            </div>
          </div>

          <div class="section-header">EDUCATION AND QUALIFICATIONS</div>
          ${education.map(edu => `
            <div class="education-entry">
              <div class="education-title">
                <span class="education-name">${edu.institution} – ${edu.degree}</span>
                <span class="education-year">${edu.year}</span>
              </div>
              ${edu.details ? `
                <ul class="education-details">
                  ${edu.details.split('. ').map(detail => `<li>${detail}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}

          <div class="section-header">WORK EXPERIENCE</div>
          ${workExperience.map(exp => `
            <div class="experience-entry">
              <div class="experience-header">
                <span class="company-position">${exp.company}${exp.team ? `, ${exp.team}` : ''} – ${exp.position}</span>
                <span class="duration">${exp.duration}</span>
              </div>
              <ul class="responsibilities">
                ${exp.responsibilities.split('. ').filter(r => r.trim()).map(r => 
                  `<li>${r.trim()}${r.endsWith('.') ? '' : '.'}</li>`
                ).join('')}
              </ul>
            </div>
          `).join('')}

          <div class="section-header">ADDITIONAL SKILLS</div>
          <div class="skills-grid">
            ${skills && skills.length > 0 ? `
              <div class="skill-category">IT Skills</div>
              <div>${Array.isArray(skills) ? skills.join(', ') : skills}</div>
            ` : ''}
            ${typeof languages !== 'undefined' && languages ? `
              <div class="skill-category">Languages</div>
              <div>${languages}</div>
            ` : ''}
          </div>

          ${hobbies && hobbies.length > 0 ? `
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
};

