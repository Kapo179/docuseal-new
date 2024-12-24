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
    const body = JSON.parse(event.body);
    
    // Validate required fields
    if (!body.name || !body.contactDetails || !body.education || !body.workExperience || !body.skills) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Missing required fields',
          details: 'Please provide all required CV information'
        })
      };
    }

    const { 
      name, 
      contactDetails, 
      education, 
      workExperience, 
      skills, 
      hobbies 
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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              max-width: 210mm; /* A4 width */
              min-height: 297mm; /* A4 height */
              margin: 0 auto;
              padding: 20mm; /* Matches the PDF margins */
              box-sizing: border-box;
            }
            h1 { color: #2c3e50; }
            h2 { 
              color: #34495e;
              border-bottom: 2px solid #3498db;
              padding-bottom: 5px;
            }
            .contact-details {
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 25px;
            }
            .experience-item, .education-item {
              margin-bottom: 15px;
            }
            .skills-list {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .skill-item {
              background: #f0f0f0;
              padding: 5px 10px;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <h1>${name}</h1>
          
          <div class="contact-details">
            <p>Email: ${contactDetails.email}</p>
            <p>Phone: ${contactDetails.phone}</p>
            <p>LinkedIn: ${contactDetails.linkedin}</p>
          </div>

          <div class="section">
            <h2>Education</h2>
            ${education.map(edu => `
              <div class="education-item">
                <h3>${edu.institution}</h3>
                <p>${edu.degree} (${edu.year})</p>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h2>Work Experience</h2>
            ${workExperience.map(exp => `
              <div class="experience-item">
                <h3>${exp.position} at ${exp.company}</h3>
                <p><em>${exp.duration}</em></p>
                <p>${exp.responsibilities}</p>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h2>Skills</h2>
            <div class="skills-list">
              ${skills.map(skill => `
                <span class="skill-item">${skill}</span>
              `).join('')}
            </div>
          </div>

          ${hobbies ? `
            <div class="section">
              <h2>Hobbies & Interests</h2>
              <p>${hobbies.join(', ')}</p>
            </div>
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
        '--disable-web-security'
      ],
      defaultViewport: {
        width: 794,  // A4 width in pixels (assuming 96 DPI)
        height: 1123, // A4 height in pixels (assuming 96 DPI)
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
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
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
