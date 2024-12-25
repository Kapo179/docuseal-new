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
              padding: 40px 50px; /* Increased padding */
              box-sizing: border-box;
              background: white;
            }
            h1 {
              color: #2c3e50;
              margin-top: 0;
              margin-bottom: 20px;
              font-size: 32px;
            }
            h2 {
              color: #34495e;
              border-bottom: 2px solid #3498db;
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 20px;
            }
            .contact-details {
              margin-bottom: 30px;
            }
            .contact-details p {
              margin: 8px 0;
            }
            .education-item, .experience-item {
              margin-bottom: 25px;
            }
            .education-item h3, .experience-item h3 {
              margin-bottom: 8px;
              color: #2c3e50;
            }
            .duration {
              color: #666;
              font-style: italic;
              margin-bottom: 10px;
            }
            .skills-list {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 15px;
            }
            .skill-item {
              background: #f5f6fa;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 14px;
            }
            section {
              margin-bottom: 30px;
            }
            
            /* Prevent orphans and widows */
            p, li {
              orphans: 3;
              widows: 3;
            }

            /* Keep sections together where possible */
            section, .education-item, .experience-item {
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 25px;
            }

            /* Prevent breaks after headings */
            h1, h2, h3 {
              break-after: avoid;
              page-break-after: avoid;
            }

            /* Keep work experience details together */
            .experience-item {
              break-inside: avoid-page;
              page-break-inside: avoid;
            }

            /* Keep skills together */
            .skills-list {
              break-inside: avoid;
              page-break-inside: avoid;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 15px;
            }

            /* Ensure proper spacing between sections */
            .section {
              margin-bottom: 30px;
              break-before: auto;
              break-after: auto;
              page-break-before: auto;
              page-break-after: auto;
            }

            /* Add space for page breaks if needed */
            @media print {
              .page-break {
                break-before: page;
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <main>
            <!-- Wrap sections in main for better page break control -->
            <section class="header">
              <h1>${name}</h1>
              <!-- Contact details -->
            </section>

            <section class="education">
              <h2>Education</h2>
              <!-- Education items -->
            </section>

            <section class="experience">
              <h2>Work Experience</h2>
              <!-- Experience items -->
            </section>

            <section class="skills">
              <h2>Skills</h2>
              <!-- Skills list -->
            </section>

            <section class="hobbies">
              <h2>Hobbies & Interests</h2>
              <!-- Hobbies content -->
            </section>
          </main>
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
