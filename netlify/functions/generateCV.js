const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

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

  try {
    const { 
      name, 
      contactDetails, 
      education, 
      workExperience, 
      skills, 
      hobbies 
    } = JSON.parse(event.body).params;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${name} - CV</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
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

    await chromium.font('/tmp/fonts');
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath('/tmp/chromium'),
      headless: true
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate);

    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    await browser.close();

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'CV generated successfully',
        cvHtml: htmlTemplate,
        pdfBase64: pdfBuffer.toString('base64')
      })
    };
  } catch (error) {
    console.error('Error generating CV:', error);
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
