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
    // Parse the entire body without destructuring first
    const body = JSON.parse(event.body);
    
    // Extract required fields with defaults
    const {
      name = '',
      contactDetails = {},
      education = [],
      workExperience = [],
      skills = [],
      hobbies = [],
      // Add optional sections with defaults
      languages = '',
      achievements = [],
      certifications = [],
      projects = [],
      volunteerWork = [],
      // Spread operator to catch any additional fields
      ...additionalSections
    } = body;

    // Validate only the minimum required fields
    if (!name || !contactDetails) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Missing required fields',
          details: 'Name and contact details are required'
        })
      };
    }

    // Create a sections object that includes all possible sections
    const sections = {
      education,
      workExperience,
      skills,
      hobbies,
      languages,
      achievements,
      certifications,
      projects,
      volunteerWork,
      ...additionalSections // Include any additional sections
    };

    // Filter out empty sections
    const validSections = Object.entries(sections).reduce((acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value;
      } else if (typeof value === 'string' && value.trim()) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Generate the HTML template with all valid sections
    const htmlContent = generateTemplate(name, contactDetails, validSections);

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
    await page.setContent(htmlContent);

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

// Separate template generation function
function generateTemplate(name, contactDetails, sections) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <!-- ... your styles ... -->
      </head>
      <body>
        <!-- Header Section -->
        <div class="header">
          <h1>${name}</h1>
          <div class="contact-details">
            ${contactDetails.phone} • <a href="mailto:${contactDetails.email}">${contactDetails.email}</a>
            ${contactDetails.linkedin && contactDetails.linkedin !== 'N/A' ? 
              `<br>${contactDetails.linkedin}` : 
              ''}
          </div>
        </div>

        <!-- Dynamic Sections -->
        ${Object.entries(sections).map(([sectionName, content]) => {
          // Convert section name to title case and handle special cases
          const title = sectionName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();

          return content && content.length ? `
            <div class="section-header">${title.toUpperCase()}</div>
            ${generateSectionContent(sectionName, content)}
          ` : '';
        }).join('')}
      </body>
    </html>
  `;
}

// Helper function to generate section content based on section type
function generateSectionContent(sectionName, content) {
  switch(sectionName) {
    case 'education':
      return generateEducationSection(content);
    case 'workExperience':
      return generateWorkExperienceSection(content);
    case 'skills':
      return generateSkillsSection(content);
    case 'projects':
      return generateProjectsSection(content);
    case 'certifications':
      return generateCertificationsSection(content);
    case 'volunteerWork':
      return generateVolunteerSection(content);
    case 'hobbies':
      return generateHobbiesSection(content);
    default:
      // Handle any other section type
      return Array.isArray(content) 
        ? `<ul>${content.map(item => `<li>${item}</li>`).join('')}</ul>`
        : `<p>${content}</p>`;
  }
}

// Add your section generation functions here...

