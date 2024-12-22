const chromium = require('chrome-aws-lambda');

exports.handler = async (event) => {
  const { name, education, workExperience } = JSON.parse(event.body);

  const htmlTemplate = `
    <html>
      <body>
        <h1>${name}</h1>
        <h2>Education</h2>
        <p>${education}</p>
        <h2>Work Experience</h2>
        <p>${workExperience}</p>
      </body>
    </html>
  `;

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate);

    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/pdf' },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Failed to generate PDF.' };
  }
};
